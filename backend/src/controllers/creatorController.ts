import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { CreatorAuthenticatedRequest } from "../middleware/creatorAuth.js";
import {
  signCreatorAccessToken,
  signCreatorRefreshToken,
  verifyCreatorRefreshToken,
} from "../auth/creatorJwt.js";
import { hashPassword } from "../utils/password.js";
import { isPasswordStrong } from "../utils/passwordStrength.js";
import {
  createMultipartUpload,
  presignPartUrlsForNumbers,
  completeMultipartUpload,
  putObjectBuffer,
} from "../upload/s3.js";
import type { CreatorNotificationType } from "@prisma/client";

const REFRESH_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const publicUrlFor = (key: string) =>
  config.mediaCdnBase
    ? `${config.mediaCdnBase}/${key}`
    : config.s3.bucket && config.s3.region
      ? `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`
      : undefined;

const notifyCreator = async (params: {
  creatorId: bigint;
  type: CreatorNotificationType;
  title: string;
  body: string;
  submissionId?: bigint;
}) => {
  try {
    await prisma.creatorNotification.create({
      data: {
        creatorId: params.creatorId,
        type: params.type,
        title: params.title,
        body: params.body,
        submissionId: params.submissionId,
      },
    });
  } catch {
    // Never let a notification failure block the action that triggered it.
  }
};

// ---------------------------------------------------------------------------
// Public: signup + auth. Account exists immediately, no review gate — the
// review happens later, per movie, via CreatorSubmission.
// ---------------------------------------------------------------------------

// The refresh token handed to the client is two parts joined by ".": a signed
// JWT carrying session identity, and a raw random string we verify against a
// bcrypt hash stored on the session row (so a stolen DB dump alone can't be
// replayed, and any session can be revoked by deleting its row).
const issueCreatorSession = async (creatorId: bigint, email: string) => {
  const accessToken = signCreatorAccessToken({ creatorId, email });
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TTL_MS);
  const rawRefreshToken = crypto.randomUUID() + crypto.randomUUID();
  const refreshHash = await bcrypt.hash(rawRefreshToken, 10);

  const session = await prisma.creatorSession.create({
    data: { creatorId, refreshToken: refreshHash, expiresAt: refreshExpiresAt },
  });

  const refreshToken = signCreatorRefreshToken({ creatorId, sessionId: session.id });
  return { accessToken, refreshToken: `${refreshToken}.${rawRefreshToken}` };
};

const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(1),
  bio: z.string().trim().max(2000).optional(),
  reelUrl: z.string().trim().url().optional().or(z.literal("")),
});

export const creatorSignup = async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { name, email, password, bio, reelUrl } = parsed.data;

  if (!isPasswordStrong(password)) {
    return res.status(400).json({
      code: "WEAK_PASSWORD",
      message: "Password too weak. Use at least 8 chars, upper, lower, number, and symbol.",
    });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.creatorAccount.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  try {
    const passwordHash = await hashPassword(password);
    const account = await prisma.creatorAccount.create({
      data: {
        name,
        email: normalizedEmail,
        password: passwordHash,
        bio: bio || null,
        reelUrl: reelUrl || null,
      },
    });

    const tokens = await issueCreatorSession(account.id, account.email);
    return res.status(201).json({ ok: true, ...tokens });
  } catch (err) {
    console.error("creatorSignup error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const creatorLogin = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const account = await prisma.creatorAccount.findUnique({ where: { email: email.toLowerCase() } });
  if (!account) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (account.status === "SUSPENDED") {
    return res.status(403).json({ message: "This account is suspended" });
  }
  const matches = await bcrypt.compare(password, account.password);
  if (!matches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const tokens = await issueCreatorSession(account.id, account.email);
  return res.json({ ok: true, ...tokens });
};

export const refreshCreatorSession = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };
  // The JWT itself is dot-delimited (header.payload.signature), so only the
  // LAST dot separates it from the appended raw session secret.
  const sepIndex = refreshToken?.lastIndexOf(".") ?? -1;
  if (!refreshToken || sepIndex <= 0 || sepIndex === refreshToken.length - 1) {
    return res.status(400).json({ message: "Missing refresh token" });
  }
  const jwtPart = refreshToken.slice(0, sepIndex);
  const rawPart = refreshToken.slice(sepIndex + 1);

  try {
    const { creatorId, sessionId } = verifyCreatorRefreshToken(jwtPart);
    const session = await prisma.creatorSession.findUnique({ where: { id: sessionId } });
    if (!session || session.creatorId !== creatorId || session.expiresAt.getTime() < Date.now()) {
      return res.status(401).json({ message: "Session expired" });
    }
    const matches = await bcrypt.compare(rawPart, session.refreshToken);
    if (!matches) {
      return res.status(401).json({ message: "Session expired" });
    }
    const account = await prisma.creatorAccount.findUnique({ where: { id: creatorId } });
    if (!account || account.status !== "ACTIVE") {
      return res.status(401).json({ message: "Account no longer active" });
    }

    await prisma.creatorSession.delete({ where: { id: sessionId } });
    const tokens = await issueCreatorSession(account.id, account.email);
    return res.json({ ok: true, ...tokens });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

// ---------------------------------------------------------------------------
// Profile (requireCreatorAuth)
// ---------------------------------------------------------------------------

const formatAccount = (account: {
  id: bigint;
  name: string;
  email: string;
  status: string;
  bio: string | null;
  reelUrl: string | null;
  avatarUrl: string | null;
  instagram: string | null;
  youtube: string | null;
  twitter: string | null;
  website: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  onboardedAt: Date | null;
  createdAt: Date;
}) => ({
  id: account.id.toString(),
  name: account.name,
  email: account.email,
  status: account.status,
  bio: account.bio,
  reelUrl: account.reelUrl,
  avatarUrl: account.avatarUrl,
  instagram: account.instagram,
  youtube: account.youtube,
  twitter: account.twitter,
  website: account.website,
  bankName: account.bankName,
  bankAccountName: account.bankAccountName,
  bankAccountNumber: account.bankAccountNumber,
  onboarded: account.onboardedAt !== null,
  createdAt: account.createdAt,
});

export const getCreatorMe = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const account = await prisma.creatorAccount.findUnique({ where: { id: creatorId } });
  if (!account) return res.status(404).json({ message: "Not found" });

  return res.json(formatAccount(account));
};

export const completeCreatorOnboarding = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  await prisma.creatorAccount.update({
    where: { id: creatorId },
    data: { onboardedAt: new Date() },
  });
  return res.json({ ok: true });
};

const updateCredentialsSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().trim().email().optional(),
  newPassword: z.string().min(1).optional(),
});

export const updateCreatorCredentials = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const parsed = updateCredentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { currentPassword, newEmail, newPassword } = parsed.data;

  if (!newEmail && !newPassword) {
    return res.status(400).json({ message: "Provide a new email, a new password, or both" });
  }

  const account = await prisma.creatorAccount.findUnique({ where: { id: creatorId } });
  if (!account) return res.status(404).json({ message: "Not found" });

  const matches = await bcrypt.compare(currentPassword, account.password);
  if (!matches) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  const data: { email?: string; password?: string } = {};

  if (newEmail) {
    const normalized = newEmail.toLowerCase();
    if (normalized !== account.email) {
      const existing = await prisma.creatorAccount.findUnique({ where: { email: normalized } });
      if (existing) return res.status(409).json({ message: "That email is already in use" });
      data.email = normalized;
    }
  }

  if (newPassword) {
    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        code: "WEAK_PASSWORD",
        message: "Password too weak. Use at least 8 chars, upper, lower, number, and symbol.",
      });
    }
    data.password = await hashPassword(newPassword);
  }

  try {
    const updated = await prisma.creatorAccount.update({ where: { id: creatorId }, data });
    return res.json({ ok: true, email: updated.email });
  } catch (err) {
    console.error("updateCreatorCredentials error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
  reelUrl: z.string().trim().url().optional().or(z.literal("")),
  instagram: z.string().trim().max(200).optional().or(z.literal("")),
  youtube: z.string().trim().max(200).optional().or(z.literal("")),
  twitter: z.string().trim().max(200).optional().or(z.literal("")),
  website: z.string().trim().url().optional().or(z.literal("")),
});

export const updateCreatorProfile = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { name, bio, reelUrl, instagram, youtube, twitter, website } = parsed.data;

  try {
    const account = await prisma.creatorAccount.update({
      where: { id: creatorId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(bio !== undefined ? { bio: bio || null } : {}),
        ...(reelUrl !== undefined ? { reelUrl: reelUrl || null } : {}),
        ...(instagram !== undefined ? { instagram: instagram || null } : {}),
        ...(youtube !== undefined ? { youtube: youtube || null } : {}),
        ...(twitter !== undefined ? { twitter: twitter || null } : {}),
        ...(website !== undefined ? { website: website || null } : {}),
      },
    });
    return res.json(formatAccount(account));
  } catch (err) {
    console.error("updateCreatorProfile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const payoutDetailsSchema = z.object({
  bankName: z.string().trim().max(200).optional().or(z.literal("")),
  bankAccountName: z.string().trim().max(200).optional().or(z.literal("")),
  bankAccountNumber: z.string().trim().max(50).optional().or(z.literal("")),
});

export const updateCreatorPayoutDetails = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const parsed = payoutDetailsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { bankName, bankAccountName, bankAccountNumber } = parsed.data;

  try {
    const account = await prisma.creatorAccount.update({
      where: { id: creatorId },
      data: {
        bankName: bankName || null,
        bankAccountName: bankAccountName || null,
        bankAccountNumber: bankAccountNumber || null,
      },
    });
    return res.json(formatAccount(account));
  } catch (err) {
    console.error("updateCreatorPayoutDetails error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Small-file proxy upload, mirrors the admin asset endpoint: the media
// bucket has no CORS policy for creator.wanzami.tv, so the browser can't PUT
// straight to it. Images and PDFs only — the master file and trailer are
// large enough that they still need the direct multipart flow below.
const ALLOWED_ASSET_TYPES = ["image/", "application/pdf"];
const isAllowedAssetType = (contentType: string) => ALLOWED_ASSET_TYPES.some((t) => contentType.startsWith(t));

export const uploadCreatorAvatar = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const body = req.body as Buffer | undefined;
  if (!Buffer.isBuffer(body) || body.length === 0) {
    return res.status(400).json({ message: "Request body must be the file bytes" });
  }
  const contentType = req.get("content-type") || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return res.status(400).json({ message: "Only image uploads are supported here" });
  }

  const key = `creator-avatars/${creatorId}/${Date.now()}-${crypto.randomUUID()}`;
  try {
    await putObjectBuffer(key, body, contentType);
    const avatarUrl = publicUrlFor(key);
    await prisma.creatorAccount.update({ where: { id: creatorId }, data: { avatarUrl } });
    return res.json({ avatarUrl });
  } catch (err: any) {
    console.error("uploadCreatorAvatar error", err);
    return res.status(500).json({ message: "Failed to upload avatar", error: err?.message });
  }
};

// ---------------------------------------------------------------------------
// Submissions — draft-first wizard (requireCreatorAuth)
// ---------------------------------------------------------------------------

const formatSubmission = (s: {
  id: bigint;
  title: string;
  synopsis: string | null;
  genres: string[];
  cast: string[];
  crew: string[];
  language: string | null;
  maturityRating: string | null;
  runtimeMinutes: number | null;
  releaseDate: Date | null;
  suggestedPpvPriceNaira: number | null;
  fileKey: string | null;
  trailerKey: string | null;
  posterUrl: string | null;
  rightsDeclared: boolean;
  rightsDeclaredName: string | null;
  rightsDeclaredAt: Date | null;
  status: string;
  reviewNote: string | null;
  linkedTitleId: bigint | null;
  submittedAt: Date | null;
  createdAt: Date;
  documents?: { id: bigint; kind: string; fileName: string; createdAt: Date }[];
}) => ({
  id: s.id.toString(),
  title: s.title,
  synopsis: s.synopsis,
  genres: s.genres,
  cast: s.cast,
  crew: s.crew,
  language: s.language,
  maturityRating: s.maturityRating,
  runtimeMinutes: s.runtimeMinutes,
  releaseDate: s.releaseDate,
  suggestedPpvPriceNaira: s.suggestedPpvPriceNaira,
  hasMasterFile: !!s.fileKey,
  hasTrailer: !!s.trailerKey,
  posterUrl: s.posterUrl,
  rightsDeclared: s.rightsDeclared,
  rightsDeclaredName: s.rightsDeclaredName,
  rightsDeclaredAt: s.rightsDeclaredAt,
  status: s.status,
  reviewNote: s.reviewNote,
  linkedTitleId: s.linkedTitleId?.toString() ?? null,
  submittedAt: s.submittedAt,
  createdAt: s.createdAt,
  documents: s.documents?.map((d) => ({ id: d.id.toString(), kind: d.kind, fileName: d.fileName, createdAt: d.createdAt })),
});

export const listCreatorSubmissions = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const submissions = await prisma.creatorSubmission.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
  });

  // Only approved, catalogue-linked submissions have real numbers to show.
  const linkedTitleIds = submissions
    .filter((s) => s.status === "APPROVED" && s.linkedTitleId)
    .map((s) => s.linkedTitleId as bigint);

  const metricsByTitle = new Map<string, { purchases: number; revenueNaira: number }>();
  if (linkedTitleIds.length) {
    const grouped = await prisma.ppvPurchase.groupBy({
      by: ["titleId"],
      where: { titleId: { in: linkedTitleIds }, status: "SUCCESS" },
      _sum: { amountNaira: true },
      _count: { _all: true },
    });
    for (const row of grouped) {
      metricsByTitle.set(row.titleId.toString(), {
        purchases: row._count._all,
        revenueNaira: row._sum.amountNaira ?? 0,
      });
    }
  }

  return res.json({
    submissions: submissions.map((s) => ({
      ...formatSubmission(s),
      metrics: s.linkedTitleId ? metricsByTitle.get(s.linkedTitleId.toString()) ?? null : null,
    })),
  });
};

const requireOwnedDraft = async (creatorId: bigint, id: bigint) => {
  const submission = await prisma.creatorSubmission.findUnique({ where: { id }, include: { documents: true } });
  if (!submission || submission.creatorId !== creatorId) return null;
  return submission;
};

export const getCreatorSubmission = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const submission = await requireOwnedDraft(creatorId, id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });
  return res.json(formatSubmission(submission));
};

const createDraftSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const createDraftSubmission = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const parsed = createDraftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  try {
    const submission = await prisma.creatorSubmission.create({
      data: { creatorId, title: parsed.data.title },
      include: { documents: true },
    });
    return res.status(201).json(formatSubmission(submission));
  } catch (err) {
    console.error("createDraftSubmission error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateDraftSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  synopsis: z.string().trim().max(2000).optional().or(z.literal("")),
  genres: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  cast: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
  crew: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
  language: z.string().trim().max(40).optional().or(z.literal("")),
  maturityRating: z.string().trim().max(20).optional().or(z.literal("")),
  runtimeMinutes: z.number().int().positive().max(1000).optional(),
  releaseDate: z.string().trim().optional().or(z.literal("")),
  suggestedPpvPriceNaira: z.number().int().nonnegative().max(1000000).optional(),
  rightsDeclared: z.boolean().optional(),
  rightsDeclaredName: z.string().trim().max(200).optional().or(z.literal("")),
});

export const updateDraftSubmission = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const submission = await requireOwnedDraft(creatorId, id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });
  if (submission.status !== "DRAFT") {
    return res.status(409).json({ message: "This submission is no longer editable" });
  }

  const parsed = updateDraftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const p = parsed.data;

  try {
    const updated = await prisma.creatorSubmission.update({
      where: { id },
      data: {
        ...(p.title !== undefined ? { title: p.title } : {}),
        ...(p.synopsis !== undefined ? { synopsis: p.synopsis || null } : {}),
        ...(p.genres !== undefined ? { genres: p.genres } : {}),
        ...(p.cast !== undefined ? { cast: p.cast } : {}),
        ...(p.crew !== undefined ? { crew: p.crew } : {}),
        ...(p.language !== undefined ? { language: p.language || null } : {}),
        ...(p.maturityRating !== undefined ? { maturityRating: p.maturityRating || null } : {}),
        ...(p.runtimeMinutes !== undefined ? { runtimeMinutes: p.runtimeMinutes } : {}),
        ...(p.releaseDate !== undefined ? { releaseDate: p.releaseDate ? new Date(p.releaseDate) : null } : {}),
        ...(p.suggestedPpvPriceNaira !== undefined ? { suggestedPpvPriceNaira: p.suggestedPpvPriceNaira } : {}),
        ...(p.rightsDeclared !== undefined
          ? { rightsDeclared: p.rightsDeclared, rightsDeclaredAt: p.rightsDeclared ? new Date() : null }
          : {}),
        ...(p.rightsDeclaredName !== undefined ? { rightsDeclaredName: p.rightsDeclaredName || null } : {}),
      },
      include: { documents: true },
    });
    return res.json(formatSubmission(updated));
  } catch (err) {
    console.error("updateDraftSubmission error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteDraftSubmission = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const submission = await requireOwnedDraft(creatorId, id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });
  if (submission.status !== "DRAFT") {
    return res.status(409).json({ message: "Only drafts can be deleted" });
  }

  await prisma.creatorSubmission.delete({ where: { id } });
  return res.json({ ok: true });
};

// --- Master file + trailer: direct multipart upload to R2 (needs the R2 CORS
// policy set for creator.wanzami.tv; too large to proxy through the API). ---

const startUploadSchema = z.object({
  contentType: z.string().trim().min(1).max(100).optional(),
});

const startAssetUpload = (prefix: "creator-submissions" | "creator-trailers", keyField: "fileKey" | "trailerKey", uploadIdField: "uploadId" | "trailerUploadId") =>
  async (req: CreatorAuthenticatedRequest, res: Response) => {
    const creatorId = req.creator?.creatorId;
    if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
    const id = req.params.id ? BigInt(req.params.id) : null;
    if (!id) return res.status(400).json({ message: "Missing submission id" });

    const submission = await requireOwnedDraft(creatorId, id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    if (submission.status !== "DRAFT") {
      return res.status(409).json({ message: "This submission is no longer editable" });
    }

    const parsed = startUploadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    try {
      const key = `${prefix}/${creatorId}/${Date.now()}-${crypto.randomUUID()}`;
      const uploadId = await createMultipartUpload(key, parsed.data.contentType || "video/mp4");
      await prisma.creatorSubmission.update({
        where: { id },
        data: { [keyField]: key, [uploadIdField]: uploadId },
      });
      return res.status(201).json({ key, uploadId });
    } catch (err: any) {
      console.error("startAssetUpload error:", err);
      return res.status(500).json({ message: "Failed to start upload", error: err?.message });
    }
  };

export const startMasterUpload = startAssetUpload("creator-submissions", "fileKey", "uploadId");
export const startTrailerUpload = startAssetUpload("creator-trailers", "trailerKey", "trailerUploadId");

const partUrlsSchema = z.object({
  partNumbers: z.array(z.number().int().positive()).min(1).max(2000),
});

const getAssetPartUrls = (keyField: "fileKey" | "trailerKey", uploadIdField: "uploadId" | "trailerUploadId") =>
  async (req: CreatorAuthenticatedRequest, res: Response) => {
    const creatorId = req.creator?.creatorId;
    if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
    const id = req.params.id ? BigInt(req.params.id) : null;
    if (!id) return res.status(400).json({ message: "Missing submission id" });

    const parsed = partUrlsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const submission = await requireOwnedDraft(creatorId, id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    const key = submission[keyField];
    const uploadId = submission[uploadIdField];
    if (!key || !uploadId) {
      return res.status(409).json({ message: "Upload was not started for this submission" });
    }

    try {
      const parts = await presignPartUrlsForNumbers(key, uploadId, parsed.data.partNumbers);
      return res.json({ parts });
    } catch (err: any) {
      console.error("getAssetPartUrls error:", err);
      return res.status(500).json({ message: "Failed to presign parts", error: err?.message });
    }
  };

export const getMasterPartUrls = getAssetPartUrls("fileKey", "uploadId");
export const getTrailerPartUrls = getAssetPartUrls("trailerKey", "trailerUploadId");

const completeUploadSchema = z.object({
  parts: z.array(z.object({ partNumber: z.number().int().positive(), eTag: z.string().min(1) })).min(1),
});

const completeAssetUpload = (keyField: "fileKey" | "trailerKey", uploadIdField: "uploadId" | "trailerUploadId") =>
  async (req: CreatorAuthenticatedRequest, res: Response) => {
    const creatorId = req.creator?.creatorId;
    if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
    const id = req.params.id ? BigInt(req.params.id) : null;
    if (!id) return res.status(400).json({ message: "Missing submission id" });

    const parsed = completeUploadSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

    const submission = await requireOwnedDraft(creatorId, id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });
    const key = submission[keyField];
    const uploadId = submission[uploadIdField];
    if (!key || !uploadId) {
      return res.status(409).json({ message: "Upload was not started for this submission" });
    }

    try {
      await completeMultipartUpload(
        key,
        uploadId,
        parsed.data.parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.eTag }))
      );
      return res.json({ ok: true });
    } catch (err: any) {
      console.error("completeAssetUpload error:", err);
      return res.status(500).json({ message: "Failed to complete upload", error: err?.message });
    }
  };

export const completeMasterUpload = completeAssetUpload("fileKey", "uploadId");
export const completeTrailerUpload = completeAssetUpload("trailerKey", "trailerUploadId");

export const uploadSubmissionPoster = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const submission = await requireOwnedDraft(creatorId, id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });

  const body = req.body as Buffer | undefined;
  if (!Buffer.isBuffer(body) || body.length === 0) {
    return res.status(400).json({ message: "Request body must be the file bytes" });
  }
  const contentType = req.get("content-type") || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return res.status(400).json({ message: "Only image uploads are supported here" });
  }

  const key = `creator-posters/${creatorId}/${Date.now()}-${crypto.randomUUID()}`;
  try {
    await putObjectBuffer(key, body, contentType);
    const posterUrl = publicUrlFor(key);
    await prisma.creatorSubmission.update({ where: { id }, data: { posterUrl } });
    return res.json({ posterUrl });
  } catch (err: any) {
    console.error("uploadSubmissionPoster error", err);
    return res.status(500).json({ message: "Failed to upload poster", error: err?.message });
  }
};

export const uploadSubmissionDocument = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const submission = await requireOwnedDraft(creatorId, id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });

  const body = req.body as Buffer | undefined;
  if (!Buffer.isBuffer(body) || body.length === 0) {
    return res.status(400).json({ message: "Request body must be the file bytes" });
  }
  const contentType = req.get("content-type") || "application/octet-stream";
  if (!isAllowedAssetType(contentType)) {
    return res.status(400).json({ message: "Only image or PDF documents are supported here" });
  }

  // Query params, not custom headers: the browser talks to this API directly
  // (no same-origin proxy like Admin has), and a custom request header would
  // need a CORS preflight allowlist change affecting every origin. Query
  // params carry no such requirement.
  const kind = (typeof req.query.kind === "string" ? req.query.kind : "other").replace(/[^a-z0-9_-]/gi, "").slice(0, 40) || "other";
  const fileName = (typeof req.query.filename === "string" ? req.query.filename : "document").slice(0, 200);
  const key = `creator-documents/${creatorId}/${Date.now()}-${crypto.randomUUID()}`;

  try {
    await putObjectBuffer(key, body, contentType);
    const doc = await prisma.creatorDocument.create({
      data: { submissionId: id, kind, fileName, fileKey: key },
    });
    return res.status(201).json({ id: doc.id.toString(), kind: doc.kind, fileName: doc.fileName, createdAt: doc.createdAt });
  } catch (err: any) {
    console.error("uploadSubmissionDocument error", err);
    return res.status(500).json({ message: "Failed to upload document", error: err?.message });
  }
};

export const deleteSubmissionDocument = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  const docId = req.params.docId ? BigInt(req.params.docId) : null;
  if (!id || !docId) return res.status(400).json({ message: "Missing id" });

  const submission = await requireOwnedDraft(creatorId, id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });

  const doc = await prisma.creatorDocument.findUnique({ where: { id: docId } });
  if (!doc || doc.submissionId !== id) return res.status(404).json({ message: "Document not found" });

  await prisma.creatorDocument.delete({ where: { id: docId } });
  return res.json({ ok: true });
};

export const submitSubmissionForReview = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const submission = await requireOwnedDraft(creatorId, id);
  if (!submission) return res.status(404).json({ message: "Submission not found" });
  if (submission.status !== "DRAFT") {
    return res.status(409).json({ message: "This submission has already been submitted" });
  }

  const missing: string[] = [];
  if (!submission.synopsis) missing.push("synopsis");
  if (!submission.fileKey) missing.push("master film file");
  if (!submission.rightsDeclared || !submission.rightsDeclaredName) missing.push("rights declaration");
  if (submission.documents.length === 0) missing.push("at least one rights document");
  if (missing.length) {
    return res.status(400).json({ message: `Missing before you can submit: ${missing.join(", ")}` });
  }

  const updated = await prisma.creatorSubmission.update({
    where: { id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
    include: { documents: true },
  });

  await notifyCreator({
    creatorId,
    type: "SUBMISSION_RECEIVED",
    title: "Submission received",
    body: `"${updated.title}" is in the queue for review.`,
    submissionId: id,
  });

  return res.json(formatSubmission(updated));
};

type DailyRow = { day: Date; purchases: bigint; revenueNaira: bigint | null };

export const getSubmissionAnalytics = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const submission = await prisma.creatorSubmission.findUnique({ where: { id } });
  if (!submission || submission.creatorId !== creatorId) {
    return res.status(404).json({ message: "Submission not found" });
  }
  if (submission.status !== "APPROVED" || !submission.linkedTitleId) {
    return res.json({ daily: [] });
  }

  // Group by calendar day in Postgres rather than in JS: 30 days is small, but
  // this keeps the shape right if that window ever grows.
  const rows = await prisma.$queryRaw<DailyRow[]>`
    SELECT date_trunc('day', "createdAt") AS day,
           count(*)::bigint AS purchases,
           sum("amountNaira")::bigint AS "revenueNaira"
    FROM "PpvPurchase"
    WHERE "titleId" = ${submission.linkedTitleId}
      AND status = 'SUCCESS'
      AND "createdAt" >= now() - interval '30 days'
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  return res.json({
    daily: rows.map((r) => ({
      date: r.day.toISOString().slice(0, 10),
      purchases: Number(r.purchases),
      revenueNaira: Number(r.revenueNaira ?? 0),
    })),
  });
};

// ---------------------------------------------------------------------------
// Notifications (requireCreatorAuth)
// ---------------------------------------------------------------------------

export const listCreatorNotifications = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const [notifications, unreadCount] = await Promise.all([
    prisma.creatorNotification.findMany({
      where: { creatorId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.creatorNotification.count({ where: { creatorId, isRead: false } }),
  ]);

  return res.json({
    unreadCount,
    notifications: notifications.map((n) => ({
      id: n.id.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      submissionId: n.submissionId?.toString() ?? null,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
  });
};

export const markNotificationRead = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing id" });

  await prisma.creatorNotification.updateMany({
    where: { id, creatorId },
    data: { isRead: true },
  });
  return res.json({ ok: true });
};

export const markAllNotificationsRead = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  await prisma.creatorNotification.updateMany({
    where: { creatorId, isRead: false },
    data: { isRead: true },
  });
  return res.json({ ok: true });
};

// ---------------------------------------------------------------------------
// Earnings (requireCreatorAuth)
// ---------------------------------------------------------------------------

export const getCreatorEarnings = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const submissions = await prisma.creatorSubmission.findMany({
    where: { creatorId, status: "APPROVED", linkedTitleId: { not: null } },
    select: { id: true, title: true, linkedTitleId: true },
  });
  const titleIds = submissions.map((s) => s.linkedTitleId as bigint);

  const [grouped, payouts] = await Promise.all([
    titleIds.length
      ? prisma.ppvPurchase.groupBy({
          by: ["titleId"],
          where: { titleId: { in: titleIds }, status: "SUCCESS" },
          _sum: { amountNaira: true },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    prisma.creatorPayout.findMany({ where: { creatorId }, orderBy: { paidAt: "desc" } }),
  ]);

  const revenueByTitle = new Map(grouped.map((g) => [g.titleId.toString(), g._sum.amountNaira ?? 0]));
  const byTitle = submissions.map((s) => ({
    submissionId: s.id.toString(),
    title: s.title,
    revenueNaira: revenueByTitle.get((s.linkedTitleId as bigint).toString()) ?? 0,
  }));

  const totalEarnedNaira = byTitle.reduce((sum, t) => sum + t.revenueNaira, 0);
  const totalPaidNaira = payouts.reduce((sum, p) => sum + p.amountNaira, 0);

  return res.json({
    totalEarnedNaira,
    totalPaidNaira,
    balanceNaira: totalEarnedNaira - totalPaidNaira,
    byTitle,
    payouts: payouts.map((p) => ({
      id: p.id.toString(),
      amountNaira: p.amountNaira,
      note: p.note,
      paidAt: p.paidAt,
    })),
  });
};

// ---------------------------------------------------------------------------
// Public creator profile (no auth)
// ---------------------------------------------------------------------------

export const getPublicCreatorProfile = async (req: Request, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing creator id" });

  const account = await prisma.creatorAccount.findUnique({ where: { id } });
  if (!account || account.status !== "ACTIVE") return res.status(404).json({ message: "Not found" });

  const submissions = await prisma.creatorSubmission.findMany({
    where: { creatorId: id, status: "APPROVED", linkedTitleId: { not: null } },
    select: { linkedTitleId: true },
  });
  const titleIds = submissions.map((s) => s.linkedTitleId as bigint);
  const titles = titleIds.length
    ? await prisma.title.findMany({
        where: { id: { in: titleIds }, archived: false },
        select: { id: true, name: true, posterUrl: true, thumbnailUrl: true },
      })
    : [];

  return res.json({
    id: account.id.toString(),
    name: account.name,
    bio: account.bio,
    avatarUrl: account.avatarUrl,
    instagram: account.instagram,
    youtube: account.youtube,
    twitter: account.twitter,
    website: account.website,
    titles: titles.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      posterUrl: t.posterUrl,
      thumbnailUrl: t.thumbnailUrl,
    })),
  });
};

// Looks up which creator (if any) owns a given catalogue title, for the
// public title page's "About the creator" section on wanzami.tv.
export const getPublicCreatorForTitle = async (req: Request, res: Response) => {
  const titleId = req.params.titleId ? BigInt(req.params.titleId) : null;
  if (!titleId) return res.status(400).json({ message: "Missing title id" });

  const submission = await prisma.creatorSubmission.findFirst({
    where: { linkedTitleId: titleId, status: "APPROVED" },
    include: { creator: true },
  });
  if (!submission || submission.creator.status !== "ACTIVE") {
    return res.json({ creator: null });
  }

  return res.json({
    creator: {
      id: submission.creator.id.toString(),
      name: submission.creator.name,
      bio: submission.creator.bio,
      avatarUrl: submission.creator.avatarUrl,
      instagram: submission.creator.instagram,
      youtube: submission.creator.youtube,
      twitter: submission.creator.twitter,
      website: submission.creator.website,
    },
  });
};

// ---------------------------------------------------------------------------
// Admin: submission review queue (the only approval gate now)
// ---------------------------------------------------------------------------

export const listSubmissionsForReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const submissions = await prisma.creatorSubmission.findMany({
      where: status ? { status: status as any } : { status: { not: "DRAFT" } },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { id: true, name: true, email: true, bio: true, reelUrl: true } },
        documents: true,
      },
      take: 200,
    });
    return res.json({
      submissions: submissions.map((s) => ({
        ...formatSubmission(s),
        documents: s.documents.map((d) => ({
          id: d.id.toString(),
          kind: d.kind,
          fileName: d.fileName,
          url: publicUrlFor(d.fileKey),
          createdAt: d.createdAt,
        })),
        creator: {
          id: s.creator.id.toString(),
          name: s.creator.name,
          email: s.creator.email,
          bio: s.creator.bio,
          reelUrl: s.creator.reelUrl,
        },
      })),
    });
  } catch (err) {
    console.error("listSubmissionsForReview error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const approveSubmissionSchema = z.object({
  linkedTitleId: z.string().trim().min(1).optional(),
  reviewNote: z.string().trim().max(2000).optional(),
});

export const approveSubmission = async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const parsed = approveSubmissionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  try {
    const submission = await prisma.creatorSubmission.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewNote: parsed.data.reviewNote || null,
        linkedTitleId: parsed.data.linkedTitleId ? BigInt(parsed.data.linkedTitleId) : undefined,
      },
    });
    await notifyCreator({
      creatorId: submission.creatorId,
      type: "SUBMISSION_APPROVED",
      title: "Your film was approved",
      body: `"${submission.title}" is approved${parsed.data.linkedTitleId ? " and live in the catalogue" : ""}.`,
      submissionId: id,
    });
    return res.json({ ok: true, status: submission.status });
  } catch (err) {
    console.error("approveSubmission error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectSubmission = async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });
  const { note } = req.body as { note?: string };

  try {
    const submission = await prisma.creatorSubmission.update({
      where: { id },
      data: { status: "REJECTED", reviewNote: note || null },
    });
    await notifyCreator({
      creatorId: submission.creatorId,
      type: "SUBMISSION_REJECTED",
      title: "Update on your submission",
      body: `"${submission.title}" was not approved${note ? `: ${note}` : "."}`,
      submissionId: id,
    });
    return res.json({ ok: true, status: submission.status });
  } catch (err) {
    console.error("rejectSubmission error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const markSubmissionInReview = async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  try {
    const submission = await prisma.creatorSubmission.update({
      where: { id },
      data: { status: "IN_REVIEW" },
    });
    await notifyCreator({
      creatorId: submission.creatorId,
      type: "SUBMISSION_IN_REVIEW",
      title: "Your submission is being reviewed",
      body: `"${submission.title}" is now in review.`,
      submissionId: id,
    });
    return res.json({ ok: true, status: submission.status });
  } catch (err) {
    console.error("markSubmissionInReview error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// Admin: payouts
// ---------------------------------------------------------------------------

export const listCreatorPayoutsAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.params.creatorId ? BigInt(req.params.creatorId) : null;
  if (!creatorId) return res.status(400).json({ message: "Missing creator id" });

  const payouts = await prisma.creatorPayout.findMany({ where: { creatorId }, orderBy: { paidAt: "desc" } });
  return res.json({
    payouts: payouts.map((p) => ({
      id: p.id.toString(),
      amountNaira: p.amountNaira,
      note: p.note,
      paidAt: p.paidAt,
    })),
  });
};

const createPayoutSchema = z.object({
  amountNaira: z.number().int().positive(),
  note: z.string().trim().max(500).optional(),
});

export const createCreatorPayoutAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.params.creatorId ? BigInt(req.params.creatorId) : null;
  if (!creatorId) return res.status(400).json({ message: "Missing creator id" });

  const parsed = createPayoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  try {
    const payout = await prisma.creatorPayout.create({
      data: {
        creatorId,
        amountNaira: parsed.data.amountNaira,
        note: parsed.data.note || null,
        createdBy: req.user?.userId,
      },
    });
    await notifyCreator({
      creatorId,
      type: "PAYOUT_LOGGED",
      title: "Payout sent",
      body: `₦${parsed.data.amountNaira.toLocaleString()} marked as paid${parsed.data.note ? `: ${parsed.data.note}` : "."}`,
    });
    return res.status(201).json({ id: payout.id.toString(), amountNaira: payout.amountNaira, note: payout.note, paidAt: payout.paidAt });
  } catch (err) {
    console.error("createCreatorPayoutAdmin error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
