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
    } else if (!r.value.ok) {
      failedRecipients.push(email);
      failedDetails.push({ email, error: r.value.error ?? "Unknown error" });
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

/* ---------------------------------------------------------------------------
   Campaign control. A live send is 495 recipients queued in batches, so the
   operator needs to see it moving and be able to stop it without going
   through an engineer.
--------------------------------------------------------------------------- */

const summariseFailure = (job: any) => ({
  id: job.id,
  batch: job.data?.startIndex ?? 0,
  recipients: Array.isArray(job.data?.recipients) ? job.data.recipients.length : 0,
  reason: job.failedReason ?? "Unknown error",
  attempts: job.attemptsMade,
});

export const campaignStatus = async (_req: Request, res: Response) => {
  const [counts, paused, active, failed, completed] = await Promise.all([
    emailQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed"),
    emailQueue.isPaused(),
    emailQueue.getActive(0, 9),
    emailQueue.getFailed(0, 19),
    emailQueue.getCompleted(0, 49),
  ]);

  // Each job carries a batch of recipients, so job counts alone understate the
  // real progress. Sum the batch sizes instead.
  const recipientsIn = (jobs: any[]) =>
    jobs.reduce(
      (sum, j) => sum + (Array.isArray(j.data?.recipients) ? j.data.recipients.length : 0),
      0
    );

  const sent = completed.reduce((sum, j) => {
    const v = j.returnvalue as { queued?: number } | undefined;
    return sum + (v?.queued ?? 0);
  }, 0);
  const failedRecipients = completed.reduce((sum, j) => {
    const v = j.returnvalue as { failed?: number } | undefined;
    return sum + (v?.failed ?? 0);
  }, 0);

  return res.json({
    paused,
    counts,
    sent,
    failedRecipients,
    inFlight: recipientsIn(active),
    remaining: recipientsIn(await emailQueue.getWaiting(0, 999)),
    subject: (active[0]?.data?.subject ?? completed[0]?.data?.subject) ?? null,
    failures: failed.map(summariseFailure),
  });
};

export const pauseCampaign = async (_req: Request, res: Response) => {
  await emailQueue.pause();
  return res.json({ paused: true });
};

export const resumeCampaign = async (_req: Request, res: Response) => {
  await emailQueue.resume();
  return res.json({ paused: false });
};

// Drops everything not yet started. Batches already handed to the worker will
// finish, so this stops the bleeding rather than rewinding it.
export const cancelCampaign = async (_req: Request, res: Response) => {
  const waiting = await emailQueue.getWaiting(0, 9999);
  const delayed = await emailQueue.getDelayed(0, 9999);
  let dropped = 0;
  for (const job of [...waiting, ...delayed]) {
    try {
      await job.remove();
      dropped += 1;
    } catch {
      // Job started between listing and removal; leave it to finish.
    }
  }
  await emailQueue.pause();
  return res.json({ dropped, paused: true });
};

export const retryFailedBatches = async (_req: Request, res: Response) => {
  const failed = await emailQueue.getFailed(0, 999);
  let retried = 0;
  for (const job of failed) {
    try {
      await job.retry();
      retried += 1;
    } catch {
      // Ignore jobs that can no longer be retried.
    }
  }
  return res.json({ retried });
};
