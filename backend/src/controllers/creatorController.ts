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
import { sendEmail } from "../utils/mailer.js";
import { creatorInviteTemplate } from "../templates/creatorInviteTemplate.js";
import {
  createMultipartUpload,
  presignPartUrlsForNumbers,
  completeMultipartUpload,
} from "../upload/s3.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const buildSetPasswordUrl = (token: string) =>
  `${config.creatorAppOrigin}/set-password?token=${encodeURIComponent(token)}`;

// ---------------------------------------------------------------------------
// Public: application
// ---------------------------------------------------------------------------

const applySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
  bio: z.string().trim().min(20).max(2000),
  reelUrl: z.string().trim().url().optional().or(z.literal("")),
  instagram: z.string().trim().max(200).optional(),
  youtube: z.string().trim().max(200).optional(),
});

export const submitApplication = async (req: Request, res: Response) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { name, email, phone, bio, reelUrl, instagram, youtube } = parsed.data;

  try {
    const application = await prisma.creatorApplication.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        bio,
        reelUrl: reelUrl || null,
        instagram: instagram || null,
        youtube: youtube || null,
      },
    });
    return res.status(201).json({ ok: true, id: application.id.toString() });
  } catch (err) {
    console.error("submitApplication error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// Admin: review queue
// ---------------------------------------------------------------------------

export const listApplications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const applications = await prisma.creatorApplication.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: { account: { select: { status: true } } },
      take: 200,
    });
    return res.json({
      applications: applications.map((a) => ({
        id: a.id.toString(),
        name: a.name,
        email: a.email,
        phone: a.phone,
        bio: a.bio,
        reelUrl: a.reelUrl,
        instagram: a.instagram,
        youtube: a.youtube,
        status: a.status,
        reviewNote: a.reviewNote,
        reviewedAt: a.reviewedAt,
        createdAt: a.createdAt,
        accountStatus: a.account?.status ?? null,
      })),
    });
  } catch (err) {
    console.error("listApplications error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const approveApplication = async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing application id" });

  try {
    const application = await prisma.creatorApplication.findUnique({
      where: { id },
      include: { account: true },
    });
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.account) {
      return res.status(409).json({ message: "This application already has an account" });
    }

    const token = crypto.randomUUID();
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);

    const [, account] = await prisma.$transaction([
      prisma.creatorApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedBy: req.user?.userId,
          reviewedAt: new Date(),
        },
      }),
      prisma.creatorAccount.create({
        data: {
          applicationId: id,
          email: application.email,
          name: application.name,
          inviteToken: token,
          inviteExpiresAt,
        },
      }),
    ]);

    const sent = await sendEmail({
      to: application.email,
      subject: "Your Wanzami creator application was approved",
      html: creatorInviteTemplate({
        name: application.name,
        email: application.email,
        setPasswordUrl: buildSetPasswordUrl(token),
        creatorOrigin: config.creatorAppOrigin,
      }),
    });

    return res.json({ ok: true, accountId: account.id.toString(), emailSent: sent.ok });
  } catch (err) {
    console.error("approveApplication error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const rejectApplication = async (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing application id" });
  const { note } = req.body as { note?: string };

  try {
    await prisma.creatorApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedBy: req.user?.userId,
        reviewedAt: new Date(),
        reviewNote: note || null,
      },
    });
    return res.json({ ok: true });
  } catch (err) {
    console.error("rejectApplication error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------------------------------------------------------------------
// Public: creator account setup + auth
// ---------------------------------------------------------------------------

export const getCreatorInviteByToken = async (req: Request, res: Response) => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) return res.status(400).json({ code: "INVALID", message: "Missing token" });

  const account = await prisma.creatorAccount.findUnique({ where: { inviteToken: token } });
  if (!account) {
    return res.status(404).json({ code: "INVALID", message: "This invite link is not valid" });
  }
  if (account.status !== "PENDING_SETUP") {
    return res.status(409).json({ code: "ALREADY_ACCEPTED", message: "This invite has already been used. Log in instead." });
  }
  if (!account.inviteExpiresAt || account.inviteExpiresAt.getTime() < Date.now()) {
    return res.status(410).json({ code: "EXPIRED", message: "This invite has expired" });
  }

  return res.json({ code: "VALID", email: account.email, name: account.name });
};

const setPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

export const setCreatorPassword = async (req: Request, res: Response) => {
  const parsed = setPasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { token, password } = parsed.data;

  if (!isPasswordStrong(password)) {
    return res.status(400).json({
      code: "WEAK_PASSWORD",
      message: "Password too weak. Use at least 8 chars, upper, lower, number, and symbol.",
    });
  }

  const account = await prisma.creatorAccount.findUnique({ where: { inviteToken: token } });
  if (!account) {
    return res.status(404).json({ code: "INVALID", message: "This invite link is not valid" });
  }
  if (account.status !== "PENDING_SETUP") {
    return res.status(409).json({ code: "ALREADY_ACCEPTED", message: "This invite has already been used. Log in instead." });
  }
  if (!account.inviteExpiresAt || account.inviteExpiresAt.getTime() < Date.now()) {
    return res.status(410).json({ code: "EXPIRED", message: "This invite has expired" });
  }

  const passwordHash = await hashPassword(password);
  await prisma.creatorAccount.update({
    where: { id: account.id },
    data: {
      password: passwordHash,
      status: "ACTIVE",
      inviteToken: null,
      inviteExpiresAt: null,
    },
  });

  const tokens = await issueCreatorSession(account.id, account.email);
  return res.json({ ok: true, ...tokens });
};

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

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const creatorLogin = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const account = await prisma.creatorAccount.findUnique({ where: { email: email.toLowerCase() } });
  if (!account || !account.password) {
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

  const account = await prisma.creatorAccount.findUnique({
    where: { id: creatorId },
    include: { application: true },
  });
  if (!account) return res.status(404).json({ message: "Not found" });

  return res.json({
    id: account.id.toString(),
    name: account.name,
    email: account.email,
    status: account.status,
    bio: account.application.bio,
    reelUrl: account.application.reelUrl,
    createdAt: account.createdAt,
  });
};

export const listCreatorSubmissions = async (req: CreatorAuthenticatedRequest, res: Response) => {
  const creatorId = req.creator?.creatorId;
  if (!creatorId) return res.status(401).json({ message: "Unauthorized" });

  const submissions = await prisma.creatorSubmission.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
  });
  return res.json({
    submissions: submissions.map((s) => ({
      id: s.id.toString(),
      title: s.title,
      synopsis: s.synopsis,
      status: s.status,
      reviewNote: s.reviewNote,
      createdAt: s.createdAt,
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
