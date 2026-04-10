import { Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail } from "../utils/mailer.js";
import { enqueueEmailJob, emailQueue } from "../queues/emailQueue.js";
import { prisma } from "../prisma.js";
import { buildPlatformRefreshEmailTemplate } from "../templates/platformRefreshEmailTemplate.js";
import { hashPassword } from "../utils/password.js";

const RecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const EmailPayloadSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  html: z.string().min(1, "Email body is required"),
  recipients: z.array(RecipientSchema).min(1, "At least one recipient is required"),
  startIndex: z.coerce.number().int().min(0).optional(),
  batchSize: z.coerce.number().int().min(1).optional(),
});

const AudienceImportSchema = z.object({
  recipients: z.array(RecipientSchema).min(1, "At least one recipient is required"),
});

const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

type Recipient = z.infer<typeof RecipientSchema>;

const dedupeRecipients = (recipients: Recipient[]) => {
  const map = new Map<string, Recipient>();
  for (const r of recipients) {
    const key = r.email.toLowerCase().trim();
    map.set(key, { ...map.get(key), ...r, email: key });
  }
  return Array.from(map.values());
};

const renderTemplate = (html: string, recipient: Recipient) =>
  html
    .replace(/{{\s*name\s*}}/gi, recipient.name ?? "Subscriber")
    .replace(/{{\s*email\s*}}/gi, recipient.email);

const sendBatch = async (recipients: Recipient[], subject: string, html: string) => {
  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendEmail({
        to: recipient.email,
        subject,
        html: renderTemplate(html, recipient),
      })
    )
  );

  const failedRecipients: string[] = [];
  const queuedRecipients: string[] = [];
  const failedDetails: Array<{ email: string; error: string }> = [];
  results.forEach((r, idx) => {
    const email = recipients[idx]?.email;
    if (!email) return;
    if (r.status === "rejected") {
      failedRecipients.push(email);
      const error = (r.reason as any)?.message ?? String((r.reason as any) ?? "Unknown error");
      failedDetails.push({ email, error });
    } else {
      queuedRecipients.push(email);
    }
  });

  return {
    queued: queuedRecipients.length,
    failed: failedRecipients.length,
    queuedRecipients,
    failedRecipients,
    failedDetails,
  };
};

export const sendTestEmails = async (req: Request, res: Response) => {
  const parsed = EmailPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }

  const recipients = dedupeRecipients(parsed.data.recipients);
  if (recipients.length === 0) {
    return res.status(400).json({ message: "No valid recipients" });
  }

  const { queued, failed, queuedRecipients, failedRecipients, failedDetails } = await sendBatch(
    recipients,
    parsed.data.subject,
    parsed.data.html
  );
  return res.json({
    message: "Test emails dispatched",
    queued,
    failed,
    queuedRecipients,
    failedRecipients,
    failedDetails,
  });
};

export const sendCampaignEmails = async (req: Request, res: Response) => {
  const parsed = EmailPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }

  const recipients = dedupeRecipients(parsed.data.recipients);
  if (recipients.length === 0) {
    return res.status(400).json({ message: "No valid recipients" });
  }

  const startIndex = Math.max(0, parsed.data.startIndex ?? 0);
  const requestedBatchSize = Math.max(1, parsed.data.batchSize ?? 50);
  const batchSize = Math.min(requestedBatchSize, 50);

  const jobs = [];
  let offset = startIndex;
  let batchIndex = 0;
  while (offset < recipients.length) {
    const slice = recipients.slice(offset, offset + batchSize);
    if (!slice.length) break;

    const delayMs = batchIndex * 60 * 60 * 1000; // space batches hourly
    const result = await enqueueEmailJob(
      "send",
      {
        subject: parsed.data.subject,
        html: parsed.data.html,
        recipients: slice,
        startIndex: offset,
        batchSize,
      },
      {
        delay: delayMs,
      }
    );

    if (!result.ok) {
      return res.status(202).json({
        message: "Email queue is temporarily unavailable. Already accepted batches will run when Redis recovers.",
        queuedCount: jobs.reduce((sum, j) => sum + j.count, 0),
        totalRecipients: recipients.length,
        failedAtStartIndex: offset,
        reason: result.reason,
        jobs,
      });
    }

    jobs.push({ id: result.id, startIndex: offset, count: slice.length, delayMs });

    offset += batchSize;
    batchIndex += 1;
  }

  return res.json({
    message: "Emails enqueued for delivery in hourly batches",
    jobs,
    queuedCount: recipients.length,
    totalRecipients: recipients.length,
    startIndex,
    batchSize,
  });
};

export const getEmailTemplate = async (req: Request, res: Response) => {
  const key = String(req.params.key || "").trim().toLowerCase();

  if (key === "platform-refresh" || key === "wanzami-refresh" || key === "product-update") {
    const template = buildPlatformRefreshEmailTemplate();
    return res.json({
      key,
      subject: template.subject,
      html: template.html,
    });
  }

  return res.status(404).json({ message: "Template not found" });
};

export const listUserRecipients = async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "asc" },
    select: {
      email: true,
      name: true,
    },
  });

  const recipients = users
    .filter((u) => !!u.email)
    .map((u) => ({
      email: u.email,
      name: u.name ?? undefined,
    }));

  return res.json({
    recipients,
    total: recipients.length,
  });
};

export const importUserRecipients = async (req: Request, res: Response) => {
  const parsed = AudienceImportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }

  const recipients = dedupeRecipients(parsed.data.recipients);
  if (recipients.length === 0) {
    return res.status(400).json({ message: "No valid recipients" });
  }

  const placeholderPassword = await hashPassword(`ImportedAudienceOnly!-${crypto.randomUUID()}`);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const recipient of recipients) {
    const email = recipient.email.trim().toLowerCase();
    const name = recipient.name?.trim() || email.split("@")[0] || "Subscriber";

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const data: { name?: string; role?: "USER" } = {};
      if ((!existing.name || !existing.name.trim()) && name) data.name = name;
      // Never downgrade privileged users during audience import.
      if (Object.keys(data).length > 0) {
        await prisma.user.update({ where: { email }, data });
        updated += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    await prisma.user.create({
      data: {
        email,
        password: placeholderPassword,
        name,
        role: "USER",
        emailVerified: false,
      },
    });
    created += 1;
  }

  const total = await prisma.user.count({ where: { role: "USER" } });
  return res.json({
    message: "Audience import complete",
    imported: recipients.length,
    created,
    updated,
    skipped,
    total,
  });
};

export const listSentRecipientHistory = async (req: Request, res: Response) => {
  const parsed = HistoryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid query", issues: parsed.error.issues });
  }

  const limit = parsed.data.limit ?? 200;
  const completedJobs = await emailQueue.getCompleted(0, limit - 1);
  const unique = new Set<string>();
  const jobs = completedJobs.map((job) => {
    const queuedRecipients = Array.isArray(job.returnvalue?.queuedRecipients)
      ? job.returnvalue.queuedRecipients.filter(Boolean)
      : [];
    const recipients = queuedRecipients.length
      ? queuedRecipients
      : Array.isArray(job.data?.recipients)
      ? job.data.recipients.map((r) => r?.email).filter(Boolean)
      : [];

    recipients.forEach((email: string) => unique.add(String(email).trim().toLowerCase()));

    return {
      id: job.id,
      name: job.name,
      subject: job.data?.subject,
      queuedRecipients: recipients,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  });

  return res.json({
    jobs,
    uniqueRecipients: Array.from(unique.values()),
    uniqueCount: unique.size,
  });
};
