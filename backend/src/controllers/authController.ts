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
import { verifyEmailTemplate } from "../templates/verifyEmailTemplate.js";
import { isPasswordStrong } from "../utils/passwordStrength.js";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  deviceId: z.string().optional(),
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
  token: z.string(),
  email: z.string().email(),
  name: z.string().min(2),
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
  new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);

const isIndefinite = (d: Date) => d.getFullYear() > 2099;

const upsertDevice = async (userId: bigint, deviceId: string) => {
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
    return existing;
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

  return prisma.device.create({
    data: { userId, deviceId },
  });
};

const issueTokens = async (user: {
  id: bigint;
  email: string;
  role: string;
  name: string;
}) => {
  const deviceId = crypto.randomUUID();
  const permissions = getPermissionsForRole(user.role);

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions,
    deviceId,
  });
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

  const { email, password, name } = parsed.data;
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

  const verifyUrl = `${process.env.APP_ORIGIN ?? "http://localhost:3000"}/verify-email?token=${verificationToken}&email=${encodeURIComponent(
    email
  )}`;
  await sendEmail({
    to: email,
    subject: "Verify your Wanzami account",
    html: verifyEmailTemplate({ name, verifyUrl }),
  });

  return res.status(201).json({
    user: {
      id: user.id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      emailVerified: user.emailVerified,
    },
    message: "Account created. Check your email to verify your account.",
  });
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
  await upsertDevice(user.id, resolvedDeviceId);

  const permissions = getPermissionsForRole(user.role);
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions,
    deviceId: resolvedDeviceId,
  });
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
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions,
    deviceId: resolvedDeviceId,
  });
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
  });
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

  const verifyUrl = `${process.env.APP_ORIGIN ?? "http://localhost:3000"}/verify-email?token=${newToken}&email=${encodeURIComponent(
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

export const inviteAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { email, role } = parsed.data;
  const emailLower = email.toLowerCase();

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.invitation.create({
    data: {
      email: emailLower,
      role,
      token,
      expiresAt,
      createdBy: req.user?.userId ?? 0n,
    },
  });

  const acceptUrl = `${process.env.ADMIN_APP_ORIGIN ?? "http://localhost:3001"}/admin/accept-invite?token=${token}&email=${encodeURIComponent(
    emailLower
  )}`;

  await sendEmail({
    to: emailLower,
    subject: "You're invited to Wanzami Admin",
    html: verifyEmailTemplate({ name: emailLower, verifyUrl: acceptUrl }),
  });

  return res.status(201).json({ message: "Invite sent", token });
};

export const listInvites = async (_req: AuthenticatedRequest, res: Response) => {
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
};

export const revokeInvite = async (req: AuthenticatedRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });
  await prisma.invitation.deleteMany({ where: { id } });
  return res.json({ message: "Invite revoked" });
};

export const acceptInvite = async (req: Request, res: Response) => {
  const parsed = acceptInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { token, email, name, password } = parsed.data;
  const emailLower = email.toLowerCase();

  if (!isPasswordStrong(password)) {
    return res.status(400).json({
      message:
        "Password too weak. Use at least 8 chars, upper, lower, number, and symbol.",
    });
  }

  const invite = await prisma.invitation.findUnique({
    where: { token },
  });
  if (
    !invite ||
    invite.email !== emailLower ||
    invite.expiresAt.getTime() < Date.now() ||
    invite.acceptedAt
  ) {
    return res.status(400).json({ message: "Invalid or expired invite" });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: emailLower,
      password: passwordHash,
      name,
      role: invite.role,
      emailVerified: true,
    },
  });

  await prisma.invitation.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date(), token: crypto.randomUUID() },
  });

  const { accessToken, refreshToken, deviceId, permissions } = await issueTokens(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    }
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
      return {
        id: u.id.toString(),
        email: u.email,
        role: u.role,
        name: u.name,
        createdAt: u.createdAt,
        totalWatchTime: null,
        ppvPurchases: null,
        totalSpent: null,
        status,
        lastLogin: lastSession?.createdAt ?? null,
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
