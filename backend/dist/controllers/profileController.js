import { z } from "zod";
import { prisma } from "../prisma.js";
import { resolveCountry } from "../utils/country.js";
import { auditLog } from "../utils/audit.js";
import { config } from "../config.js";
const AVATAR_CHOICES = [
    "/avatars/avatar1.svg",
    "/avatars/avatar2.svg",
    "/avatars/avatar3.svg",
    "/avatars/avatar4.svg",
    "/avatars/avatar5.svg",
    "/avatars/avatar6.svg",
];
const pickRandomAvatar = () => AVATAR_CHOICES[Math.floor(Math.random() * AVATAR_CHOICES.length)];
const profileSchema = z.object({
    name: z.string().min(1).max(64),
    // Allow hosted URLs or relative asset paths (e.g., /avatars/avatar1.svg)
    avatarUrl: z
        .string()
        .min(1)
        .max(512)
        .optional()
        .or(z.literal("")),
    kidMode: z.boolean().optional(),
    language: z.string().min(2).max(8).optional(),
    autoplay: z.boolean().optional(),
    country: z.string().min(2).max(32).optional(),
    birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
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
const upsertDeviceForUser = async (userId, deviceId) => {
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
export const listProfiles = async (req, res) => {
    if (!req.user?.userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const profiles = await prisma.profile.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: "asc" },
    });
    if (!profiles.length) {
        const created = await prisma.profile.create({
            data: {
                userId: req.user.userId,
                name: "Primary",
                avatarUrl: pickRandomAvatar(),
                country: resolveCountry(req),
            },
        });
        return res.json({
            profiles: [
                {
                    id: created.id.toString(),
                    name: created.name,
                    avatarUrl: created.avatarUrl,
                    kidMode: created.kidMode,
                    language: created.language,
                    country: created.country,
                    autoplay: created.autoplay,
                    preferences: created.preferences,
                },
            ],
        });
    }
    const hydrated = await Promise.all(profiles.map(async (p) => {
        if (!p.avatarUrl) {
            const avatar = pickRandomAvatar();
            await prisma.profile.update({
                where: { id: p.id },
                data: { avatarUrl: avatar },
            });
            return { ...p, avatarUrl: avatar };
        }
        return p;
    }));
    return res.json({
        profiles: hydrated.map((p) => ({
            id: p.id.toString(),
            name: p.name,
            avatarUrl: p.avatarUrl,
            kidMode: p.kidMode,
            language: p.language,
            country: p.country,
            birthYear: p.birthYear,
            autoplay: p.autoplay,
            preferences: p.preferences,
        })),
    });
};
export const createProfile = async (req, res) => {
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
            avatarUrl: parsed.data.avatarUrl || pickRandomAvatar(),
            kidMode: parsed.data.kidMode ?? false,
            language: parsed.data.language ?? "en",
            autoplay: parsed.data.autoplay ?? true,
            country: parsed.data.country ? parsed.data.country.toUpperCase() : resolveCountry(req),
            birthYear: parsed.data.birthYear,
            preferences: parsed.data.preferences !== undefined ? parsed.data.preferences : undefined,
        },
    });
    return res.status(201).json({
        profile: {
            id: profile.id.toString(),
            name: profile.name,
            avatarUrl: profile.avatarUrl,
            kidMode: profile.kidMode,
            language: profile.language,
            country: profile.country,
            birthYear: profile.birthYear,
            autoplay: profile.autoplay,
            preferences: profile.preferences,
        },
    });
};
export const updateProfile = async (req, res) => {
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
            avatarUrl: parsed.data.avatarUrl !== undefined
                ? parsed.data.avatarUrl || pickRandomAvatar()
                : profile.avatarUrl,
            kidMode: parsed.data.kidMode ?? profile.kidMode,
            language: parsed.data.language ?? profile.language,
            autoplay: parsed.data.autoplay ?? profile.autoplay,
            country: parsed.data.country !== undefined
                ? parsed.data.country.toUpperCase()
                : profile.country,
            birthYear: parsed.data.birthYear !== undefined
                ? parsed.data.birthYear
                : profile.birthYear,
            preferences: parsed.data.preferences !== undefined
                ? parsed.data.preferences
                : profile.preferences ?? undefined,
        },
    });
    void auditLog({
        action: "PROFILE_UPDATE",
        resource: updated.id.toString(),
        detail: { fields: Object.keys(parsed.data) },
    });
    return res.json({
        profile: {
            id: updated.id.toString(),
            name: updated.name,
            avatarUrl: updated.avatarUrl,
            kidMode: updated.kidMode,
            language: updated.language,
            country: updated.country,
            birthYear: updated.birthYear,
            autoplay: updated.autoplay,
            preferences: updated.preferences,
        },
    });
};
export const deleteProfile = async (req, res) => {
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
export const listDevicesWithProfiles = async (req, res) => {
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
                    country: d.deviceProfile.profile.country,
                    birthYear: d.deviceProfile.profile.birthYear,
                }
                : null,
        })),
    });
};
export const setDeviceProfile = async (req, res) => {
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
                country: deviceProfile.profile.country,
                birthYear: deviceProfile.profile.birthYear,
            },
        },
    });
};
export const getBilling = async (req, res) => {
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
export const upsertBilling = async (req, res) => {
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
