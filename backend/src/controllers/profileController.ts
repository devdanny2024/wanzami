import { Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { config } from "../config.js";

const profileSchema = z.object({
  name: z.string().min(1).max(64),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  kidMode: z.boolean().optional(),
  language: z.string().min(2).max(8).optional(),
  autoplay: z.boolean().optional(),
  preferences: z.record(z.any()).optional(),
});

const billingSchema = z.object({
  provider: z.enum(["PAYSTACK", "FLUTTERWAVE"]),
  providerCustomerId: z.string().optional(),
  planCode: z.string().optional(),
  status: z.string().optional(),
  billingEmail: z.string().email().optional(),
  paymentMethodBrand: z.string().optional(),
  paymentMethodLast4: z.string().max(4).optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  nextPaymentAt: z.coerce.date().optional(),
});

const deviceProfileSchema = z.object({
  profileId: z.coerce.bigint(),
});

const MAX_PROFILES = 4;

const upsertDeviceForUser = async (userId: bigint, deviceId: string) => {
  const existing = await prisma.device.findUnique({
    where: { userId_deviceId: { userId, deviceId } },
  });
  if (existing) {
    return prisma.device.update({
      where: { id: existing.id },
      data: { lastSeen: new Date() },
    });
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

export const listProfiles = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const profiles = await prisma.profile.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: "asc" },
  });
  if (!profiles.length) {
    const created = await prisma.profile.create({
      data: { userId: req.user.userId, name: "Primary" },
    });
    return res.json({
      profiles: [
        {
          id: created.id.toString(),
          name: created.name,
          avatarUrl: created.avatarUrl,
          kidMode: created.kidMode,
          language: created.language,
          autoplay: created.autoplay,
          preferences: created.preferences,
        },
      ],
    });
  }
  return res.json({
    profiles: profiles.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      avatarUrl: p.avatarUrl,
      kidMode: p.kidMode,
      language: p.language,
      autoplay: p.autoplay,
      preferences: p.preferences,
    })),
  });
};

export const createProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const existingCount = await prisma.profile.count({
    where: { userId: req.user.userId },
  });
  if (existingCount >= MAX_PROFILES) {
    return res.status(400).json({ message: "Profile limit reached" });
  }

  const profile = await prisma.profile.create({
    data: {
      userId: req.user.userId,
      name: parsed.data.name,
      avatarUrl: parsed.data.avatarUrl || null,
      kidMode: parsed.data.kidMode ?? false,
      language: parsed.data.language ?? "en",
      autoplay: parsed.data.autoplay ?? true,
      preferences: parsed.data.preferences,
    },
  });

  return res.status(201).json({
    profile: {
      id: profile.id.toString(),
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      kidMode: profile.kidMode,
      language: profile.language,
      autoplay: profile.autoplay,
      preferences: profile.preferences,
    },
  });
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const profileId = req.params.id ? BigInt(req.params.id) : null;
  if (!profileId) {
    return res.status(400).json({ message: "Missing profile id" });
  }
  const parsed = profileSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: req.user.userId },
  });
  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      name: parsed.data.name ?? profile.name,
      avatarUrl:
        parsed.data.avatarUrl !== undefined ? parsed.data.avatarUrl || null : profile.avatarUrl,
      kidMode: parsed.data.kidMode ?? profile.kidMode,
      language: parsed.data.language ?? profile.language,
      autoplay: parsed.data.autoplay ?? profile.autoplay,
      preferences: parsed.data.preferences ?? profile.preferences,
    },
  });

  return res.json({
    profile: {
      id: updated.id.toString(),
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      kidMode: updated.kidMode,
      language: updated.language,
      autoplay: updated.autoplay,
      preferences: updated.preferences,
    },
  });
};

export const deleteProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const profileId = req.params.id ? BigInt(req.params.id) : null;
  if (!profileId) {
    return res.status(400).json({ message: "Missing profile id" });
  }

  const profiles = await prisma.profile.findMany({
    where: { userId: req.user.userId },
  });
  if (profiles.length <= 1) {
    return res.status(400).json({ message: "Cannot delete the last profile" });
  }
  const target = profiles.find((p) => p.id === profileId);
  if (!target) {
    return res.status(404).json({ message: "Profile not found" });
  }

  await prisma.deviceProfile.deleteMany({
    where: { profileId, userId: req.user.userId },
  });
  await prisma.profile.delete({ where: { id: profileId } });

  return res.json({ message: "Profile deleted" });
};

export const listDevicesWithProfiles = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const devices = await prisma.device.findMany({
    where: { userId: req.user.userId },
    include: {
      deviceProfile: {
        include: { profile: true },
      },
    },
    orderBy: { lastSeen: "desc" },
  });

  return res.json({
    devices: devices.map((d) => ({
      id: d.id.toString(),
      deviceId: d.deviceId,
      label: d.label,
      createdAt: d.createdAt,
      lastSeen: d.lastSeen,
      profile: d.deviceProfile
        ? {
            id: d.deviceProfile.profile.id.toString(),
            name: d.deviceProfile.profile.name,
            avatarUrl: d.deviceProfile.profile.avatarUrl,
            kidMode: d.deviceProfile.profile.kidMode,
          }
        : null,
    })),
  });
};

export const setDeviceProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const deviceId = req.params.deviceId;
  if (!deviceId) {
    return res.status(400).json({ message: "Missing device id" });
  }

  const parsed = deviceProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const profileId = parsed.data.profileId;

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId: req.user.userId },
  });
  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  const device = await upsertDeviceForUser(req.user.userId, deviceId);

  const deviceProfile = await prisma.deviceProfile.upsert({
    where: { deviceRecordId: device.id },
    update: { profileId: profile.id, lastUsedAt: new Date() },
    create: {
      userId: req.user.userId,
      deviceRecordId: device.id,
      profileId: profile.id,
    },
    include: { profile: true, device: true },
  });

  return res.json({
    device: {
      id: deviceProfile.device.id.toString(),
      deviceId: deviceProfile.device.deviceId,
      label: deviceProfile.device.label,
      profile: {
        id: deviceProfile.profile.id.toString(),
        name: deviceProfile.profile.name,
        avatarUrl: deviceProfile.profile.avatarUrl,
        kidMode: deviceProfile.profile.kidMode,
      },
    },
  });
};

export const getBilling = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const billing = await prisma.billingAccount.findUnique({
    where: { userId: req.user.userId },
  });

  if (!billing) {
    return res.json({ billing: null });
  }

  return res.json({
    billing: {
      id: billing.id.toString(),
      provider: billing.provider,
      providerCustomerId: billing.providerCustomerId,
      planCode: billing.planCode,
      status: billing.status,
      billingEmail: billing.billingEmail,
      paymentMethodBrand: billing.paymentMethodBrand,
      paymentMethodLast4: billing.paymentMethodLast4,
      country: billing.country,
      postalCode: billing.postalCode,
      nextPaymentAt: billing.nextPaymentAt,
    },
  });
};

export const upsertBilling = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const parsed = billingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const data = parsed.data;
  const billing = await prisma.billingAccount.upsert({
    where: { userId: req.user.userId },
    create: {
      userId: req.user.userId,
      provider: data.provider,
      providerCustomerId: data.providerCustomerId,
      planCode: data.planCode,
      status: data.status ?? "active",
      billingEmail: data.billingEmail,
      paymentMethodBrand: data.paymentMethodBrand,
      paymentMethodLast4: data.paymentMethodLast4,
      country: data.country,
      postalCode: data.postalCode,
      nextPaymentAt: data.nextPaymentAt,
    },
    update: {
      provider: data.provider,
      providerCustomerId: data.providerCustomerId,
      planCode: data.planCode,
      status: data.status ?? "active",
      billingEmail: data.billingEmail,
      paymentMethodBrand: data.paymentMethodBrand,
      paymentMethodLast4: data.paymentMethodLast4,
      country: data.country,
      postalCode: data.postalCode,
      nextPaymentAt: data.nextPaymentAt,
    },
  });

  return res.json({
    billing: {
      id: billing.id.toString(),
      provider: billing.provider,
      providerCustomerId: billing.providerCustomerId,
      planCode: billing.planCode,
      status: billing.status,
      billingEmail: billing.billingEmail,
      paymentMethodBrand: billing.paymentMethodBrand,
      paymentMethodLast4: billing.paymentMethodLast4,
      country: billing.country,
      postalCode: billing.postalCode,
      nextPaymentAt: billing.nextPaymentAt,
    },
  });
};
