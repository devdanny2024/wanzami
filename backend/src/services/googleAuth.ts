import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { ROLE_PERMISSIONS } from "../auth/permissions.js";
import { signAccessToken, signRefreshToken } from "../auth/jwt.js";
import { durationToMs } from "../utils/time.js";
import { hashPassword } from "../utils/password.js";
import { sendEmail } from "../utils/mailer.js";
import { welcomeEmailTemplate } from "../templates/welcomeEmailTemplate.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const computeRefreshExpiry = () => {
  const ms = durationToMs(config.refreshTokenTtl);
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + (ms || 7 * 24 * 60 * 60 * 1000));
  return expiresAt;
};

const getPermissionsForRole = (role: string) => ROLE_PERMISSIONS[role] ?? [];

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

const ensureProfileExists = async (userId: bigint, name: string) => {
  const existing = await prisma.profile.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (existing.length) return existing;
  const created = await prisma.profile.create({
    data: { userId, name: name || "Primary" },
  });
  return [created];
};

export const googleAuthUrl = async (redirectUri?: string) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth not configured");
  }
  const effectiveRedirect = redirectUri || GOOGLE_REDIRECT_URI;
  const state = crypto.randomUUID();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", effectiveRedirect);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
};

type GoogleCallbackInput = {
  code: string;
  state?: string;
  redirectUri?: string;
};

export const googleAuthCallback = async (input: GoogleCallbackInput) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Google OAuth not configured");
  }
  const redirectUri = input.redirectUri || GOOGLE_REDIRECT_URI;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}));
    throw new Error((err as any)?.error || "Google token exchange failed");
  }

  const tokens = (await tokenRes.json()) as { access_token: string };
  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    throw new Error("Failed to fetch Google profile");
  }
  const profile = (await profileRes.json()) as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!profile.email) {
    throw new Error("Google profile missing email");
  }

  const emailLower = profile.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email: emailLower } });
  let isNew = false;

  if (!user) {
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const passwordHash = await hashPassword(randomPassword);
    user = await prisma.user.create({
      data: {
        email: emailLower,
        password: passwordHash,
        name: profile.name || emailLower,
        role: "USER",
        emailVerified: profile.email_verified ?? true,
      },
    });
    await ensureProfileExists(user.id, profile.name || "Primary");
    isNew = true;
  } else if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, name: user.name || profile.name || emailLower },
    });
  }

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

  if (isNew) {
    try {
      await sendEmail({
        to: emailLower,
        subject: "Welcome to Wanzami",
        html: welcomeEmailTemplate({ name: user.name }),
      });
    } catch (err) {
      console.error("Failed to send welcome email (Google)", err);
    }
  }

  return { accessToken, refreshToken, deviceId };
};
