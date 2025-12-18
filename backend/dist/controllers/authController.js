import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, } from "../auth/jwt.js";
import { ROLE_PERMISSIONS } from "../auth/permissions.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { durationToMs } from "../utils/time.js";
import { sendEmail } from "../utils/mailer.js";
import { resolveCountry } from "../utils/country.js";
import { verifyEmailTemplate } from "../templates/verifyEmailTemplate.js";
import { isPasswordStrong } from "../utils/passwordStrength.js";
import { googleAuthUrl as googleAuthUrlService, googleAuthCallback as googleAuthCallbackService, } from "../services/googleAuth.js";
import { welcomeEmailTemplate } from "../templates/welcomeEmailTemplate.js";
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
    token: z.string(),
    email: z.string().email(),
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
const getPermissionsForRole = (role) => ROLE_PERMISSIONS[role] ?? [];
const computeRefreshExpiry = () => {
    const ms = durationToMs(config.refreshTokenTtl);
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + (ms || 7 * 24 * 60 * 60 * 1000));
    return expiresAt;
};
const farFutureDate = () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year for "remember me"
const isIndefinite = (d) => d.getFullYear() > 2099;
const formatProfile = (p) => ({
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
const getProfilesForUser = async (userId) => {
    const profiles = await prisma.profile.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
    });
    if (profiles.length)
        return profiles.map(formatProfile);
    const created = await prisma.profile.create({
        data: { userId, name: "Primary" },
    });
    return [formatProfile(created)];
};
const upsertDevice = async (userId, deviceId) => {
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
const issueTokens = async (user) => {
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
export const signup = async (req, res) => {
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
    const verifyUrl = `${process.env.APP_ORIGIN ?? "http://localhost:3000"}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
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
    }
    catch (err) {
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
export const googleAuthUrl = async (req, res) => {
    const redirectUri = req.query.redirectUri || process.env.GOOGLE_REDIRECT_URI;
    try {
        const url = await googleAuthUrlService(redirectUri);
        return res.json({ url });
    }
    catch (err) {
        return res.status(500).json({ message: err?.message ?? "Failed to build Google URL" });
    }
};
// Google OAuth: handle callback, issue app tokens
export const googleAuthCallback = async (req, res) => {
    const { code, state, redirectUri } = req.body;
    if (!code)
        return res.status(400).json({ message: "Missing code" });
    try {
        const issued = await googleAuthCallbackService({ code, state, redirectUri });
        return res.json(issued);
    }
    catch (err) {
        const codeVal = err?.code;
        const msg = err?.message ?? "Google auth failed";
        if (codeVal === "ACCOUNT_NOT_FOUND_FOR_GOOGLE") {
            return res.status(404).json({ code: codeVal, message: msg });
        }
        return res.status(400).json({ message: msg });
    }
};
export const completeOnboarding = async (req, res) => {
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
    const existingPrefs = profile.preferences ?? {};
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
export const login = async (req, res) => {
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
    }, config.adminAccessTokenTtl);
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
export const adminLogin = async (req, res) => {
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
    const adminTtlSeconds = adminTtlMs > 0 ? Math.floor(adminTtlMs / 1000) : Math.floor(durationToMs(config.accessTokenTtl) / 1000) || 60 * 60;
    const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions,
        deviceId: resolvedDeviceId,
    }, adminTtlSeconds);
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
export const me = async (req, res) => {
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
export const refresh = async (req, res) => {
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
    }
    catch (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
};
export const logout = async (req, res) => {
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
            }
            catch {
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
export const verifyEmail = async (req, res) => {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const { token, email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user ||
        user.verificationToken !== token ||
        !user.verificationTokenExpires ||
        user.verificationTokenExpires.getTime() < Date.now()) {
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
export const resendVerification = async (req, res) => {
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
    const verifyUrl = `${process.env.APP_ORIGIN ?? "http://localhost:3000"}/verify-email?token=${newToken}&email=${encodeURIComponent(email)}`;
    await sendEmail({
        to: email,
        subject: "Verify your Wanzami account",
        html: verifyEmailTemplate({ name: user.name, verifyUrl }),
    });
    return res.json({ message: "Verification email resent." });
};
export const updateDeviceLabel = async (req, res) => {
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
    }
    else {
        await prisma.device.update({
            where: { id: device.id },
            data: { label, lastSeen: new Date() },
        });
    }
    return res.json({ message: "Device saved", deviceId: targetDeviceId, label });
};
const ensureNotLastSuperAdmin = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return;
    if (user.role !== "SUPER_ADMIN")
        return;
    const count = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (count <= 1) {
        throw new Error("Cannot remove the last SUPER_ADMIN");
    }
};
export const inviteAdmin = async (req, res) => {
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
    const acceptUrl = `${process.env.ADMIN_APP_ORIGIN ?? "http://localhost:3001"}/admin/accept-invite?token=${token}&email=${encodeURIComponent(emailLower)}`;
    await sendEmail({
        to: emailLower,
        subject: "You're invited to Wanzami Admin",
        html: verifyEmailTemplate({ name: emailLower, verifyUrl: acceptUrl }),
    });
    return res.status(201).json({ message: "Invite sent", token });
};
export const listInvites = async (_req, res) => {
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
export const revokeInvite = async (req, res) => {
    const id = Number(req.params.id);
    if (!id)
        return res.status(400).json({ message: "Invalid id" });
    await prisma.invitation.deleteMany({ where: { id } });
    return res.json({ message: "Invite revoked" });
};
export const acceptInvite = async (req, res) => {
    const parsed = acceptInviteSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const { token, email, name, password } = parsed.data;
    const emailLower = email.toLowerCase();
    if (!isPasswordStrong(password)) {
        return res.status(400).json({
            message: "Password too weak. Use at least 8 chars, upper, lower, number, and symbol.",
        });
    }
    const invite = await prisma.invitation.findUnique({
        where: { token },
    });
    if (!invite ||
        invite.email !== emailLower ||
        invite.expiresAt.getTime() < Date.now() ||
        invite.acceptedAt) {
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
    const { accessToken, refreshToken, deviceId, permissions } = await issueTokens({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
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
        deviceId,
        permissions,
    });
};
export const listAdminUsers = async (_req, res) => {
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
export const listAllUsers = async (_req, res) => {
    const users = await prisma.user.findMany({
        where: { role: "USER" },
        orderBy: { createdAt: "desc" },
    });
    const statusForUser = async (userId, emailVerified) => {
        if (!emailVerified)
            return "Unverified";
        const lastSession = await prisma.session.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        const lastLoginDate = lastSession?.createdAt ?? null;
        if (lastLoginDate) {
            const days = (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24);
            if (days > 30)
                return "Inactive";
        }
        return "Active";
    };
    const enriched = await Promise.all(users.map(async (u) => {
        const status = await statusForUser(u.id, u.emailVerified);
        const lastSession = await prisma.session.findFirst({
            where: { userId: u.id },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
        });
        const profileCount = await prisma.profile.count({ where: { userId: u.id } });
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
            profileCount,
        };
    }));
    return res.json({
        users: enriched,
    });
};
export const updateUserRole = async (req, res) => {
    const userId = req.params.id ? BigInt(req.params.id) : null;
    const { role } = req.body;
    if (!userId || !role) {
        return res.status(400).json({ message: "Missing user id or role" });
    }
    if (role === "USER") {
        return res.status(400).json({ message: "Cannot set admin user to USER" });
    }
    await ensureNotLastSuperAdmin(userId);
    const user = await prisma.user.update({
        where: { id: userId },
        data: { role: role },
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
export const deleteUser = async (req, res) => {
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
    }
    catch (err) {
        if (err?.code === "P2025") {
            return res.status(404).json({ message: "User not found" });
        }
        throw err;
    }
    return res.json({ message: "User removed" });
};
export const forgotPassword = async (req, res) => {
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
        const resetUrl = `${process.env.ADMIN_APP_ORIGIN ?? "http://localhost:3001"}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        await sendEmail({
            to: email,
            subject: "Reset your Wanzami password",
            html: verifyEmailTemplate({ name: user.name, verifyUrl: resetUrl }),
        });
    }
    return res.json({ message: "If that account exists, a reset link has been sent." });
};
export const resetPassword = async (req, res) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const { token, email, password } = parsed.data;
    const emailLower = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user ||
        !user.resetToken ||
        user.resetToken !== token ||
        !user.resetTokenExpires ||
        user.resetTokenExpires.getTime() < Date.now()) {
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
