import jwt from "jsonwebtoken";
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

const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
// iOS native Sign In with Apple uses the bundle ID as the audience
const APPLE_BUNDLE_ID = "tv.wanzami.app";

interface AppleJwk {
  kty: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
}

interface ApplePayload {
  iss: string;
  aud: string;
  sub: string;
  email?: string;
}

async function fetchApplePublicKey(kid: string): Promise<string> {
  const res = await fetch(APPLE_KEYS_URL);
  if (!res.ok) throw new Error("Failed to fetch Apple public keys");
  const { keys } = (await res.json()) as { keys: AppleJwk[] };
  const jwk = keys.find((k) => k.kid === kid);
  if (!jwk) throw new Error("Apple public key not found for kid: " + kid);
  const keyObject = crypto.createPublicKey({ key: jwk as any, format: "jwk" });
  return keyObject.export({ type: "spki", format: "pem" }) as string;
}

const computeRefreshExpiry = () => {
  const ms = durationToMs(config.refreshTokenTtl);
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + (ms || 7 * 24 * 60 * 60 * 1000));
  return expiresAt;
};

const getPermissionsForRole = (role: string) => ROLE_PERMISSIONS[role] ?? [];

export const appleAuthCallback = async (input: {
  identityToken: string;
  name?: string;
}) => {
  const decoded = jwt.decode(input.identityToken, { complete: true });
  if (!decoded || typeof decoded === "string") {
    throw new Error("Invalid Apple identity token");
  }

  const kid = decoded.header.kid as string | undefined;
  if (!kid) throw new Error("Missing kid in Apple token header");

  const publicKey = await fetchApplePublicKey(kid);

  let payload: ApplePayload;
  try {
    payload = jwt.verify(input.identityToken, publicKey, {
      algorithms: ["RS256"],
      issuer: "https://appleid.apple.com",
      audience: APPLE_BUNDLE_ID,
    }) as ApplePayload;
  } catch (err: any) {
    throw new Error(`Apple token verification failed: ${err.message}`);
  }

  const appleUserId = payload.sub;
  const email = payload.email?.toLowerCase();

  let user = await prisma.user.findFirst({
    where: email
      ? { OR: [{ appleId: appleUserId }, { email }] }
      : { appleId: appleUserId },
  });

  if (!user) {
    if (!email) throw new Error("Email required for first-time Apple sign-in");
    const userName = input.name?.trim() || email.split("@")[0];
    const passwordHash = await hashPassword(crypto.randomUUID() + "_apple");

    user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: userName,
        role: "USER",
        emailVerified: true,
        appleId: appleUserId,
      },
    });

    await prisma.profile.create({
      data: { userId: user.id, name: userName },
    });

    try {
      await sendEmail({
        to: user.email,
        subject: "Welcome to Wanzami",
        html: welcomeEmailTemplate({ name: user.name || user.email }),
      });
    } catch {}
  } else if (!user.appleId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { appleId: appleUserId, emailVerified: true },
    });
  }

  const profiles = await prisma.profile.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  if (!profiles.length) {
    await prisma.profile.create({
      data: { userId: user.id, name: user.name || "Primary" },
    });
  }

  const rawPrefs = ((profiles[0]?.preferences ?? {}) as any) as {
    preferredGenres?: string[];
  };
  const needsOnboarding =
    !Array.isArray(rawPrefs.preferredGenres) ||
    rawPrefs.preferredGenres.length === 0;

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

  // Evict oldest device if at limit
  const deviceCount = await prisma.device.count({ where: { userId: user.id } });
  if (deviceCount >= config.deviceLimit) {
    const oldest = await prisma.device.findMany({
      where: { userId: user.id },
      orderBy: { lastSeen: "asc" },
      take: deviceCount - config.deviceLimit + 1,
    });
    if (oldest.length) {
      await prisma.session.deleteMany({
        where: { userId: user.id, deviceId: { in: oldest.map((d) => d.deviceId) } },
      });
      await prisma.device.deleteMany({ where: { id: { in: oldest.map((d) => d.id) } } });
    }
  }

  await prisma.device.create({ data: { userId: user.id, deviceId } });
  await prisma.session.create({
    data: {
      userId: user.id,
      deviceId,
      refreshToken: refreshHash,
      expiresAt: computeRefreshExpiry(),
    },
  });

  return { accessToken, refreshToken, deviceId, needsOnboarding };
};
