import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../auth/jwt.js";
import { ROLE_PERMISSIONS, Permission } from "../auth/permissions.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { durationToMs } from "../utils/time.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendEmail } from "../utils/mailer.js";
import { resolveCountry } from "../utils/country.js";
import { verifyEmailTemplate } from "../templates/verifyEmailTemplate.js";
import { resetPasswordTemplate } from "../templates/resetPasswordTemplate.js";
import { isPasswordStrong } from "../utils/passwordStrength.js";
import {
  googleAuthUrl as googleAuthUrlService,
  googleAuthCallback as googleAuthCallbackService,
} from "../services/googleAuth.js";
import { appleAuthCallback as appleAuthCallbackService } from "../services/appleAuth.js";
import { welcomeEmailTemplate } from "../templates/welcomeEmailTemplate.js";
import {
  adminInviteTemplate,
  roleLabel,
} from "../templates/adminInviteTemplate.js";
import { createNotification } from "./notificationController.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  deviceId: z.string().optional(),
  preferredGenres: z.array(z.string()).optional(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
});

const onboardingSchema = z.object({
  preferredGenres: z.array(z.string()).min(1),
  heardFrom: z.string().optional(),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  deviceId: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
  deviceId: z.string().optional(),
});

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
  deviceId: z.string().optional(),
});

const verifyEmailSchema = z.object({
  token: z.string(),
  email: z.string().email(),
});

const resendVerifySchema = z.object({
  email: z.string().email(),
});

const deviceLabelSchema = z.object({
  deviceId: z.string().optional(),
  label: z.string().min(1).max(64),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    "SUPER_ADMIN",
    "CONTENT_MANAGER",
    "BLOG_EDITOR",
    "MODERATOR",
    "SUPPORT",
    "FINANCE",
    "ANALYTICS",
    "OPS",
  ]),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  // The invitation itself is the source of truth for the email address. The
  // client may echo it back for a sanity check, but it is not required and it
  // can never be used to redirect the invite to a different mailbox.
  email: z.string().email().optional(),
  name: z.string().min(2),
  password: z.string().min(8),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

const getPermissionsForRole = (role: string): Permission[] =>
  ROLE_PERMISSIONS[role] ?? [];

const computeRefreshExpiry = () => {
  const ms = durationToMs(config.refreshTokenTtl);
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + (ms || 7 * 24 * 60 * 60 * 1000));
  return expiresAt;
};

const farFutureDate = () =>
  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for "remember me"

const isIndefinite = (d: Date) => d.getFullYear() > 2099;

const formatProfile = (p: any) => ({
  id: p.id.toString(),
  name: p.name,
  avatarUrl: p.avatarUrl,
  kidMode: p.kidMode,
  language: p.language,
  country: p.country,
  birthYear: p.birthYear,
  autoplay: p.autoplay,
  preferences: p.preferences,
});

const getProfilesForUser = async (userId: bigint) => {
  const profiles = await prisma.profile.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (profiles.length) return profiles.map(formatProfile);
  const created = await prisma.profile.create({
    data: { userId, name: "Primary" },
  });
  return [formatProfile(created)];
};

const upsertDevice = async (userId: bigint, deviceId: string): Promise<{ isNew: boolean }> => {
  const existing = await prisma.device.findUnique({
    where: {
      userId_deviceId: {
        userId,
        deviceId,
      },
    },
  });

  if (existing) {
    await prisma.device.update({
      where: { id: existing.id },
      data: { lastSeen: new Date() },
    });
    return { isNew: false };
  }

  const deviceCount = await prisma.device.count({ where: { userId } });
  if (deviceCount >= config.deviceLimit) {
    const oldest = await prisma.device.findMany({
      where: { userId },
      orderBy: { lastSeen: "asc" },
      take: deviceCount - config.deviceLimit + 1,
    });
    const ids = oldest.map((d) => d.id);
    if (ids.length) {
      await prisma.session.deleteMany({
        where: { userId, deviceId: { in: oldest.map((d) => d.deviceId) } },
      });
      await prisma.device.deleteMany({ where: { id: { in: ids } } });
    }
  }

  await prisma.device.create({ data: { userId, deviceId } });
  return { isNew: true };
};

// Admin sessions are long-lived (see adminLogin). Callers that mint a session
// for an admin pass this so the new session matches what admin login hands out
// instead of expiring in the default two hours.
const adminAccessTtlSeconds = () => {
  const adminTtlMs = durationToMs(config.adminAccessTokenTtl);
  return adminTtlMs > 0
    ? Math.floor(adminTtlMs / 1000)
    : Math.floor(durationToMs(config.accessTokenTtl) / 1000) || 60 * 60;
};

const issueTokens = async (
  user: {
    id: bigint;
    email: string;
    role: string;
    name: string;
  },
  accessTtlSeconds?: number
) => {
  const deviceId = crypto.randomUUID();
  const permissions = getPermissionsForRole(user.role);

  const accessToken = signAccessToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
      deviceId,
    },
    accessTtlSeconds
  );
  const refreshToken = signRefreshToken({
    userId: user.id,
    deviceId,
    tokenId: crypto.randomUUID(),
  });

  const refreshHash = await bcrypt.hash(refreshToken, 10);
  await upsertDevice(user.id, deviceId);
  await prisma.session.create({
    data: {
      userId: user.id,
      deviceId,
      refreshToken: refreshHash,
      expiresAt: computeRefreshExpiry(),
    },
  });

  return { accessToken, refreshToken, deviceId, permissions };
};

export const signup = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const { email, password, name, preferredGenres, birthYear } = parsed.data;
  const emailLower = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = crypto.randomUUID();
  const verificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  const user = await prisma.user.create({
    data: {
      email: emailLower,
      password: passwordHash,
      name,
      role: "USER",
      verificationToken,
      verificationTokenExpires: verificationExpires,
    },
  });

  const verifyUrl = `${process.env.APP_ORIGIN ?? "https://www.wanzami.tv"}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
    email
  )}`;
  await sendEmail({
    to: email,
    subject: "Verify your Wanzami account",
    html: verifyEmailTemplate({ name, verifyUrl }),
  });

  await prisma.profile.create({
    data: {
      userId: user.id,
      name,
      preferences: preferredGenres?.length ? { preferredGenres } : undefined,
      country: resolveCountry(req),
      birthYear,
    },
  });

  // Welcome email
  try {
    await sendEmail({
      to: emailLower,
      subject: "Welcome to Wanzami",
      html: welcomeEmailTemplate({ name }),
    });
  } catch (err) {
    console.error("Failed to send welcome email", err);
    // non-blocking
  }

  return res.status(201).json({
    user: {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerified: user.emailVerified,
    },
    profiles: await getProfilesForUser(user.id),
    message: "Account created. Check your email to verify your account.",
  });
};

// Google OAuth: return auth URL
export const googleAuthUrl = async (req: Request, res: Response) => {
  const redirectUri = (req.query.redirectUri as string) || process.env.GOOGLE_REDIRECT_URI;
  try {
    const url = await googleAuthUrlService(redirectUri);
    return res.json({ url });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message ?? "Failed to build Google URL" });
  }
};

// Google OAuth: mobile deep-link bridge
// Google redirects here after iOS ASWebAuthenticationSession login.
// We forward code+state back to the app via the wanzami:// custom scheme
// so ASWebAuthenticationSession captures it (callbackUrlScheme: 'wanzami').
export const googleMobileCallback = async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string | undefined>;
  if (error || !code) {
    return res.redirect(`wanzami://auth/callback?error=${encodeURIComponent(error ?? "no_code")}`);
  }
  const params = new URLSearchParams({ code });
  if (state) params.set("state", state);
  return res.redirect(`wanzami://auth/callback?${params.toString()}`);
};

// Google OAuth: handle callback, issue app tokens
export const googleAuthCallback = async (req: Request, res: Response) => {
  const { code, state, redirectUri } = req.body as { code?: string; state?: string; redirectUri?: string };
  if (!code) return res.status(400).json({ message: "Missing code" });
  try {
    const issued = await googleAuthCallbackService({ code, state, redirectUri });
    return res.json(issued);
  } catch (err: any) {
    const codeVal = err?.code as string | undefined;
    const rawMessage = String(err?.message ?? "Google auth failed");
    const isDatabaseConnectivityError =
      err?.name === "PrismaClientInitializationError" ||
      err?.code === "P1001" ||
      rawMessage.includes("Can't reach database server") ||
      rawMessage.includes("Authentication failed against database server") ||
      rawMessage.includes("provided database credentials") ||
      rawMessage.includes("prisma.user.findUnique") ||
      rawMessage.includes("prisma.");

    if (codeVal === "ACCOUNT_NOT_FOUND_FOR_GOOGLE") {
      return res.status(404).json({ code: codeVal, message: rawMessage });
    }

    if (isDatabaseConnectivityError) {
      console.error("googleAuthCallback database connectivity error", err);
      return res.status(503).json({
        code: "AUTH_TEMPORARILY_UNAVAILABLE",
        message: "Google sign-in is temporarily unavailable. Please try again later.",
      });
    }

    console.error("googleAuthCallback error", err);
    return res.status(500).json({
      code: "GOOGLE_AUTH_FAILED",
      message: "Google sign-in is temporarily unavailable. Please try again later.",
    });
  }
};

export const completeOnboarding = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = onboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const { preferredGenres, heardFrom, birthYear } = parsed.data;
  const userId = req.user.userId;

  let profile = await prisma.profile.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        userId,
        name: "Primary",
      },
    });
  }

  const existingPrefs: any = profile.preferences ?? {};
  const newPrefs = {
    ...existingPrefs,
    preferredGenres,
    heardFrom,
  };

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      preferences: newPrefs,
      birthYear: birthYear ?? profile.birthYear,
    },
  });

  return res.json({ ok: true });
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { email, password, deviceId, rememberMe } = parsed.data;
  const emailLower = email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.emailVerified) {
    return res
      .status(403)
      .json({ message: "Email not verified. Check your inbox." });
  }

  const resolvedDeviceId = deviceId ?? crypto.randomUUID();
  const { isNew: isNewDevice } = await upsertDevice(user.id, resolvedDeviceId);

  const permissions = getPermissionsForRole(user.role);
  const accessToken = signAccessToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
      deviceId: resolvedDeviceId,
    },
    config.adminAccessTokenTtl
  );
  const refreshToken = signRefreshToken({
    userId: user.id,
    deviceId: resolvedDeviceId,
    tokenId: crypto.randomUUID(),
  });
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = rememberMe ? farFutureDate() : computeRefreshExpiry();

  await prisma.session.create({
    data: {
      userId: user.id,
      deviceId: resolvedDeviceId,
      refreshToken: refreshHash,
      expiresAt,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    },
  });

  if (isNewDevice) {
    void createNotification({
      userId: user.id,
      type: "NEW_DEVICE_LOGIN",
      title: "New device sign-in",
      body: `A new device signed in to your Wanzami account. If this wasn't you, please change your password.`,
      metadata: { deviceId: resolvedDeviceId, userAgent: req.headers["user-agent"] ?? null },
    });
  }

  return res.json({
    user: {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    },
    accessToken,
    refreshToken,
    deviceId: resolvedDeviceId,
    permissions,
    profiles: await getProfilesForUser(user.id),
  });
};

export const adminLogin = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { email, password, deviceId, rememberMe } = parsed.data;
  const emailLower = email.toLowerCase();

  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (!user || user.role === "USER") {
    return res.status(403).json({ message: "Admin access denied" });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.emailVerified) {
    return res
      .status(403)
      .json({ message: "Email not verified. Check your inbox." });
  }

  const resolvedDeviceId = deviceId ?? crypto.randomUUID();
  await upsertDevice(user.id, resolvedDeviceId);

  const permissions = getPermissionsForRole(user.role);
  const adminTtlMs = durationToMs(config.adminAccessTokenTtl);
  const adminTtlSeconds =
    adminTtlMs > 0 ? Math.floor(adminTtlMs / 1000) : Math.floor(durationToMs(config.accessTokenTtl) / 1000) || 60 * 60;
  const accessToken = signAccessToken(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
      deviceId: resolvedDeviceId,
    },
    adminTtlSeconds,
  );
  const refreshToken = signRefreshToken({
    userId: user.id,
    deviceId: resolvedDeviceId,
    tokenId: crypto.randomUUID(),
  });
  const refreshHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = rememberMe ? farFutureDate() : computeRefreshExpiry();

  await prisma.session.create({
    data: {
      userId: user.id,
      deviceId: resolvedDeviceId,
      refreshToken: refreshHash,
      expiresAt,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    },
  });

  return res.json({
    user: {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    },
    accessToken,
    refreshToken,
    deviceId: resolvedDeviceId,
    permissions,
    profiles: await getProfilesForUser(user.id),
  });
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({
    user: {
      ...user,
      id: user.id.toString(),
    },
    permissions: getPermissionsForRole(user.role),
    profiles: await getProfilesForUser(user.id),
  });
};

// Apple 5.1.1(v) / account deletion: the authenticated user removes their own
// account. No password re-entry — Sign in with Apple/Google users never see
// their password (see appleAuth.ts / googleAuth.ts), so requiring one would
// make deletion impossible for them. The client shows a confirmation dialog;
// this endpoint trusts the authenticated request itself. A plain user delete
// is sufficient: every FK from other tables to User already has the correct
// ON DELETE CASCADE / SET NULL behavior in the schema.
export const deleteOwnAccount = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = req.user.userId;

  // Logged before deletion since the email is gone afterward and support may
  // need to confirm a deletion happened.
  console.log(`Account deletion: userId=${userId.toString()} email=${req.user.email}`);

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (err: any) {
    if (err?.code === "P2025") {
      // Already gone (e.g. double-submit) — the desired end state is reached.
      return res.json({ message: "Account deleted" });
    }
    throw err;
  }

  return res.json({ message: "Account deleted" });
};

export const refresh = async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { refreshToken, deviceId } = parsed.data;

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        deviceId: deviceId ?? decoded.deviceId,
      },
    });

    if (!session) {
      return res.status(401).json({ message: "Session not found" });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await prisma.session.delete({ where: { id: session.id } });
      return res.status(401).json({ message: "Session expired" });
    }

    const matches = await bcrypt.compare(refreshToken, session.refreshToken);
    if (!matches) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const resolvedDeviceId = deviceId ?? decoded.deviceId;
    await upsertDevice(user.id, resolvedDeviceId);

    const permissions = getPermissionsForRole(user.role);
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
      deviceId: resolvedDeviceId,
    });
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      deviceId: resolvedDeviceId,
      tokenId: crypto.randomUUID(),
    });
    const refreshHash = await bcrypt.hash(newRefreshToken, 10);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: refreshHash,
        expiresAt: isIndefinite(session.expiresAt)
          ? session.expiresAt
          : computeRefreshExpiry(),
      },
    });

    return res.json({
      accessToken,
      refreshToken: newRefreshToken,
      deviceId: resolvedDeviceId,
      permissions,
    });
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const parsed = logoutSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { refreshToken, deviceId } = parsed.data;

  if (!refreshToken && !deviceId) {
    return res
      .status(400)
      .json({ message: "refreshToken or deviceId required to logout" });
  }

  if (refreshToken) {
    const decoded = (() => {
      try {
        return verifyRefreshToken(refreshToken);
      } catch {
        return null;
      }
    })();
    if (decoded) {
      const session = await prisma.session.findFirst({
        where: {
          userId: decoded.userId,
          deviceId: deviceId ?? decoded.deviceId,
        },
      });
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
    }
  }

  if (deviceId) {
    await prisma.device.deleteMany({
      where: { deviceId },
    });
  }

  return res.json({ message: "Logged out" });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { token, email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (
    !user ||
    user.verificationToken !== token ||
    !user.verificationTokenExpires ||
    user.verificationTokenExpires.getTime() < Date.now()
  ) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    },
  });

  return res.json({ message: "Email verified. You can now log in." });
};

export const resendVerification = async (req: Request, res: Response) => {
  const parsed = resendVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.emailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  const newToken = crypto.randomUUID();
  const verificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken: newToken,
      verificationTokenExpires: verificationExpires,
    },
  });

  const verifyUrl = `${process.env.APP_ORIGIN ?? "https://www.wanzami.tv"}/verify-email?token=${newToken}&email=${encodeURIComponent(
    email
  )}`;
  await sendEmail({
    to: email,
    subject: "Verify your Wanzami account",
    html: verifyEmailTemplate({ name: user.name, verifyUrl }),
  });

  return res.json({ message: "Verification email resent." });
};

export const updateDeviceLabel = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = deviceLabelSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { deviceId, label } = parsed.data;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const targetDeviceId = deviceId ?? req.user.deviceId;
  if (!targetDeviceId) {
    return res.status(400).json({ message: "Missing device id" });
  }

  let device = await prisma.device.findFirst({
    where: { userId: req.user.userId, deviceId: targetDeviceId },
  });

  // If device not found, create it (so first-time users can save right away)
  if (!device) {
    device = await prisma.device.create({
      data: {
        userId: req.user.userId,
        deviceId: targetDeviceId,
        label,
      },
    });
  } else {
    await prisma.device.update({
      where: { id: device.id },
      data: { label, lastSeen: new Date() },
    });
  }

  return res.json({ message: "Device saved", deviceId: targetDeviceId, label });
};

const ensureNotLastSuperAdmin = async (userId: bigint) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  if (user.role !== "SUPER_ADMIN") return;
  const count = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
  if (count <= 1) {
    throw new Error("Cannot remove the last SUPER_ADMIN");
  }
};

// Every admin-facing link we hand out is built here so there is exactly one
// place that knows the admin host (config.adminAppOrigin / ADMIN_APP_ORIGIN).
const buildInviteAcceptUrl = (token: string) =>
  `${config.adminAppOrigin}/admin/accept-invite?token=${encodeURIComponent(
    token
  )}`;

const loadInviter = async (createdBy?: bigint | null) => {
  if (!createdBy) return null;
  try {
    return await prisma.user.findUnique({
      where: { id: createdBy },
      select: { name: true, email: true },
    });
  } catch {
    return null;
  }
};

export const inviteAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const { email, role } = parsed.data;
    const emailLower = email.toLowerCase();

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Re-inviting the same address supersedes any invite still outstanding,
    // so the roster never shows two live invites for one person.
    await prisma.invitation.deleteMany({
      where: { email: emailLower, acceptedAt: null },
    });

    const invite = await prisma.invitation.create({
      data: {
        email: emailLower,
        role,
        token,
        expiresAt,
        createdBy: req.user?.userId ?? 0n,
      },
    });

    const acceptUrl = buildInviteAcceptUrl(token);
    const inviter = await loadInviter(req.user?.userId);

    // sendEmail never throws; it reports failure through `ok`. Surface that to
    // the caller so the UI can tell the truth instead of claiming "Invite sent"
    // when SMTP rejected it.
    const sent = await sendEmail({
      to: emailLower,
      subject: `You've been invited to the Wanzami admin dashboard (${roleLabel(
        role
      )})`,
      html: adminInviteTemplate({
        email: emailLower,
        role,
        acceptUrl,
        expiresAt,
        invitedByName: inviter?.name,
        invitedByEmail: inviter?.email,
        adminOrigin: config.adminAppOrigin,
      }),
    });
    if (!sent.ok) {
      console.error("inviteAdmin email send failed", sent.error);
    }

    return res.status(201).json({
      message: sent.ok
        ? "Invite sent"
        : "Invite created, but the email could not be delivered. Share the link instead.",
      id: invite.id.toString(),
      token,
      acceptUrl,
      expiresAt,
      emailSent: sent.ok,
      emailError: sent.ok ? undefined : sent.error,
    });
  } catch (err) {
    console.error("inviteAdmin error", err);
    return res.status(500).json({ message: "Failed to send invite" });
  }
};

// Public: lets the accept-invite screen show who invited you and which role you
// are getting before you type anything, and name the exact failure when the
// link is no good.
export const getInviteByToken = async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
      return res
        .status(400)
        .json({ code: "INVALID", message: "This invitation link is missing its token." });
    }

    const invite = await prisma.invitation.findUnique({ where: { token } });
    if (!invite) {
      return res.status(404).json({
        code: "INVALID",
        message:
          "This invitation is not valid. It may have been revoked, or the link was copied incompletely.",
      });
    }
    if (invite.acceptedAt) {
      return res.status(409).json({
        code: "ALREADY_ACCEPTED",
        message: "This invitation has already been used. Log in instead.",
        email: invite.email,
        role: invite.role,
      });
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({
        code: "EXPIRED",
        message: "This invitation has expired. Ask an admin to send a new one.",
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      });
    }

    const inviter = await loadInviter(invite.createdBy);

    return res.json({
      code: "VALID",
      email: invite.email,
      role: invite.role,
      roleLabel: roleLabel(invite.role),
      expiresAt: invite.expiresAt,
      invitedByName: inviter?.name ?? null,
      invitedByEmail: inviter?.email ?? null,
    });
  } catch (err) {
    console.error("getInviteByToken error", err);
    return res
      .status(500)
      .json({ code: "ERROR", message: "Could not load this invitation." });
  }
};

export const listInvites = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const invites = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json({
      invites: invites.map((inv) => ({
        id: inv.id.toString(),
        email: inv.email,
        role: inv.role,
        token: inv.token,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        createdAt: inv.createdAt,
        createdBy: inv.createdBy?.toString(),
      })),
    });
  } catch (err) {
    console.error("listInvites error", err);
    return res.status(500).json({ message: "Failed to load invites" });
  }
};

export const revokeInvite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    await prisma.invitation.deleteMany({ where: { id } });
    return res.json({ message: "Invite revoked" });
  } catch (err) {
    console.error("revokeInvite error", err);
    return res.status(500).json({ message: "Failed to revoke invite" });
  }
};

export const acceptInvite = async (req: Request, res: Response) => {
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { token, email, name, password } = parsed.data;

  if (!isPasswordStrong(password)) {
    return res.status(400).json({
      code: "WEAK_PASSWORD",
      message:
        "Password too weak. Use at least 8 chars, upper, lower, number, and symbol.",
    });
  }

  const invite = await prisma.invitation.findUnique({
    where: { token },
  });
  if (!invite) {
    return res.status(404).json({
      code: "INVALID",
      message:
        "This invitation is not valid. It may have been revoked, or the link was copied incompletely.",
    });
  }
  if (invite.acceptedAt) {
    return res.status(409).json({
      code: "ALREADY_ACCEPTED",
      message: "This invitation has already been used. Log in instead.",
    });
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    return res.status(410).json({
      code: "EXPIRED",
      message: "This invitation has expired. Ask an admin to send a new one.",
    });
  }
  if (email && email.toLowerCase() !== invite.email) {
    return res.status(400).json({
      code: "EMAIL_MISMATCH",
      message: "This invitation was issued to a different email address.",
    });
  }

  const emailLower = invite.email;
  const passwordHash = await hashPassword(password);

  // If the user already exists (often as a normal USER), promote/update them instead of failing.
  // This prevents "Invalid or expired invite" UX when the email already signed up previously.
  const existingUser = await prisma.user.findUnique({ where: { email: emailLower } });

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: passwordHash,
          name,
          role: invite.role,
          emailVerified: true,
        },
      })
    : await prisma.user.create({
        data: {
          email: emailLower,
          password: passwordHash,
          name,
          role: invite.role,
          emailVerified: true,
        },
      });

  // Keep the token on the row and mark it accepted. `acceptedAt` is what blocks
  // re-use, and keeping the token is what lets a second click on the same link
  // say "already accepted, go log in" instead of "invalid".
  await prisma.invitation.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });

  // Same session length admin login issues, so the invitee who just landed on
  // the dashboard isn't kicked back out two hours later.
  const { accessToken, refreshToken, deviceId, permissions } = await issueTokens(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    adminAccessTtlSeconds()
  );

  return res.json({
    user: {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    },
    accessToken,
    refreshToken,
    deviceId,
    permissions,
  });
};

export const listAdminUsers = async (_req: AuthenticatedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { NOT: { role: "USER" } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({
    users: users.map((u) => ({
      id: u.id.toString(),
      email: u.email,
      role: u.role,
      name: u.name,
      createdAt: u.createdAt,
    })),
  });
};

export const listAllUsers = async (_req: AuthenticatedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "desc" },
  });

  const ppvByUser = await prisma.ppvPurchase.groupBy({
    by: ["userId"],
    where: { status: "SUCCESS" },
    _sum: { amountNaira: true },
    _count: { _all: true },
  });
  const ppvSummary = new Map(
    ppvByUser.map((row) => [
      row.userId.toString(),
      { count: row._count._all, total: row._sum.amountNaira ?? 0 },
    ])
  );

  const statusForUser = async (userId: bigint, emailVerified: boolean) => {
    if (!emailVerified) return "Unverified";
    const lastSession = await prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    const lastLoginDate = lastSession?.createdAt ?? null;
    if (lastLoginDate) {
      const days =
        (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24);
      if (days > 30) return "Inactive";
    }
    return "Active";
  };

  const enriched = await Promise.all(
    users.map(async (u) => {
      const status = await statusForUser(u.id, u.emailVerified);
      const lastSession = await prisma.session.findFirst({
        where: { userId: u.id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      const profileCount = await prisma.profile.count({ where: { userId: u.id } });
      const ppv = ppvSummary.get(u.id.toString());
      return {
        id: u.id.toString(),
        email: u.email,
        role: u.role,
        name: u.name,
        createdAt: u.createdAt,
        totalWatchTime: null,
        ppvPurchases: ppv?.count ?? 0,
        totalSpent: ppv?.total ?? 0,
        status,
        lastLogin: lastSession?.createdAt ?? null,
        profileCount,
      };
    })
  );

  return res.json({
    users: enriched,
  });
};

export const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id ? BigInt(req.params.id) : null;
  const { role } = req.body as { role?: string };
  if (!userId || !role) {
    return res.status(400).json({ message: "Missing user id or role" });
  }
  if (role === "USER") {
    return res.status(400).json({ message: "Cannot set admin user to USER" });
  }
  await ensureNotLastSuperAdmin(userId);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  });
  return res.json({
    user: {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    },
  });
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.params.id ? BigInt(req.params.id) : null;
  if (!userId) {
    return res.status(400).json({ message: "Missing user id" });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  await ensureNotLastSuperAdmin(userId);
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    throw err;
  }
  return res.json({ message: "User removed" });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (user) {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: expiresAt },
    });
    const resetUrl = `${process.env.APP_ORIGIN ?? "https://www.wanzami.tv"}/reset-password?token=${token}&email=${encodeURIComponent(
      email
    )}`;
    await sendEmail({
      to: email,
      subject: "Reset your Wanzami password",
      html: resetPasswordTemplate({ name: user.name, resetUrl }),
    });
  }
  return res.json({ message: "If that account exists, a reset link has been sent." });
};

export const resetPassword = async (req: Request, res: Response) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { token, email, password } = parsed.data;
  const emailLower = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: emailLower } });
  if (
    !user ||
    !user.resetToken ||
    user.resetToken !== token ||
    !user.resetTokenExpires ||
    user.resetTokenExpires.getTime() < Date.now()
  ) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }
  if (!isPasswordStrong(password)) {
    return res.status(400).json({
      message: "Password too weak. Use at least 8 chars, upper, lower, number, and symbol.",
    });
  }
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      resetToken: null,
      resetTokenExpires: null,
      emailVerified: true,
    },
  });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  return res.json({ message: "Password updated. Please log in." });
};

export const appleAuthCallback = async (req: Request, res: Response) => {
  const { identityToken, name } = req.body as {
    identityToken?: string;
    name?: string;
  };
  if (!identityToken) {
    return res.status(400).json({ message: "Missing identityToken" });
  }
  try {
    const issued = await appleAuthCallbackService({ identityToken, name });
    return res.json(issued);
  } catch (err: any) {
    return res.status(401).json({ message: err?.message ?? "Apple sign-in failed" });
  }
};
