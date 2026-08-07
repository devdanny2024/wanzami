import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma.js";
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
} from "../upload/s3.js";

const REFRESH_TTL_MS = 90 * 24 * 60 * 60 * 1000;

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
// Creator dashboard (requireCreatorAuth)
// ---------------------------------------------------------------------------

export const getCreatorMe = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const account = await prisma.creatorAccount.findUnique({ where: { id: creatorId } });
  if (!account) return res.status(404).json({ message: "Not found" });

  return res.json({
    id: account.id.toString(),
    name: account.name,
    email: account.email,
    status: account.status,
    bio: account.bio,
    reelUrl: account.reelUrl,
    onboarded: account.onboardedAt !== null,
    createdAt: account.createdAt,
  });
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
      id: s.id.toString(),
      title: s.title,
      synopsis: s.synopsis,
      status: s.status,
      reviewNote: s.reviewNote,
      createdAt: s.createdAt,
      metrics: s.linkedTitleId ? metricsByTitle.get(s.linkedTitleId.toString()) ?? null : null,
    })),
  });
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

const createSubmissionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  synopsis: z.string().trim().max(2000).optional(),
  contentType: z.string().trim().min(1).max(100).optional(),
});

export const createCreatorSubmission = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const parsed = createSubmissionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { title, synopsis, contentType } = parsed.data;

  try {
    const key = `creator-submissions/${creatorId}/${Date.now()}-${crypto.randomUUID()}`;
    const uploadId = await createMultipartUpload(key, contentType || "video/mp4");

    const submission = await prisma.creatorSubmission.create({
      data: { creatorId, title, synopsis: synopsis || null, fileKey: key, uploadId },
    });

    return res.status(201).json({
      submissionId: submission.id.toString(),
      key,
      uploadId,
    });
  } catch (err: any) {
    console.error("createCreatorSubmission error:", err);
    return res.status(500).json({ message: "Failed to start upload", error: err?.message });
  }
};

const partUrlsSchema = z.object({
  partNumbers: z.array(z.number().int().positive()).min(1).max(2000),
});

export const getSubmissionPartUrls = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const parsed = partUrlsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const submission = await prisma.creatorSubmission.findUnique({ where: { id } });
  if (!submission || submission.creatorId !== creatorId) {
    return res.status(404).json({ message: "Submission not found" });
  }
  if (!submission.fileKey || !submission.uploadId) {
    return res.status(409).json({ message: "Upload was not started for this submission" });
  }

  try {
    const parts = await presignPartUrlsForNumbers(
      submission.fileKey,
      submission.uploadId,
      parsed.data.partNumbers
    );
    return res.json({ parts });
  } catch (err: any) {
    console.error("getSubmissionPartUrls error:", err);
    return res.status(500).json({ message: "Failed to presign parts", error: err?.message });
  }
};

const completeSchema = z.object({
  parts: z.array(z.object({ partNumber: z.number().int().positive(), eTag: z.string().min(1) })).min(1),
});

export const completeCreatorSubmission = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing submission id" });

  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const submission = await prisma.creatorSubmission.findUnique({ where: { id } });
  if (!submission || submission.creatorId !== creatorId) {
    return res.status(404).json({ message: "Submission not found" });
  }
  if (!submission.fileKey || !submission.uploadId) {
    return res.status(409).json({ message: "Upload was not started for this submission" });
  }

  try {
    await completeMultipartUpload(
      submission.fileKey,
      submission.uploadId,
      parsed.data.parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.eTag }))
    );
    const updated = await prisma.creatorSubmission.update({
      where: { id },
      data: { status: "SUBMITTED" },
    });
    return res.json({ ok: true, status: updated.status });
  } catch (err: any) {
    console.error("completeCreatorSubmission error:", err);
    return res.status(500).json({ message: "Failed to complete upload", error: err?.message });
  }
};

// ---------------------------------------------------------------------------
// Admin: submission review queue (the only approval gate now)
// ---------------------------------------------------------------------------

export const listSubmissionsForReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const submissions = await prisma.creatorSubmission.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { id: true, name: true, email: true, bio: true, reelUrl: true } } },
      take: 200,
    });
    return res.json({
      submissions: submissions.map((s) => ({
        id: s.id.toString(),
        title: s.title,
        synopsis: s.synopsis,
        status: s.status,
        reviewNote: s.reviewNote,
        fileKey: s.fileKey,
        linkedTitleId: s.linkedTitleId?.toString() ?? null,
        createdAt: s.createdAt,
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
    return res.json({ ok: true, status: submission.status });
  } catch (err) {
    console.error("rejectSubmission error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
