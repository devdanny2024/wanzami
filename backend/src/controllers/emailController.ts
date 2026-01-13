import { Request, Response } from "express";
import { z } from "zod";
import { sendEmail } from "../utils/mailer.js";
import { emailQueue } from "../queues/emailQueue.js";
import { prisma } from "../prisma.js";

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

type Recipient = z.infer<typeof RecipientSchema>;

const dedupeRecipients = (recipients: Recipient[]) => {
  const map = new Map<string, Recipient>();
  for (const r of recipients) {
    const key = r.email.toLowerCase();
    map.set(key, { ...map.get(key), ...r });
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
    const job = await emailQueue.add(
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
    jobs.push({ id: job.id, startIndex: offset, count: slice.length, delayMs });

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
