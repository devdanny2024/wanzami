import { z } from "zod";
import { sendEmail } from "../utils/mailer.js";
import { emailQueue } from "../queues/emailQueue.js";
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
const dedupeRecipients = (recipients) => {
    const map = new Map();
    for (const r of recipients) {
        const key = r.email.toLowerCase();
        map.set(key, { ...map.get(key), ...r });
    }
    return Array.from(map.values());
};
const renderTemplate = (html, recipient) => html
    .replace(/{{\s*name\s*}}/gi, recipient.name ?? "Subscriber")
    .replace(/{{\s*email\s*}}/gi, recipient.email);
const sendBatch = async (recipients, subject, html) => {
    const results = await Promise.allSettled(recipients.map((recipient) => sendEmail({
        to: recipient.email,
        subject,
        html: renderTemplate(html, recipient),
    })));
    const failedRecipients = [];
    const queuedRecipients = [];
    const failedDetails = [];
    results.forEach((r, idx) => {
        const email = recipients[idx]?.email;
        if (!email)
            return;
        if (r.status === "rejected") {
            failedRecipients.push(email);
            const error = r.reason?.message ?? String(r.reason ?? "Unknown error");
            failedDetails.push({ email, error });
        }
        else {
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
export const sendTestEmails = async (req, res) => {
    const parsed = EmailPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const recipients = dedupeRecipients(parsed.data.recipients);
    if (recipients.length === 0) {
        return res.status(400).json({ message: "No valid recipients" });
    }
    const { queued, failed, queuedRecipients, failedRecipients, failedDetails } = await sendBatch(recipients, parsed.data.subject, parsed.data.html);
    return res.json({
        message: "Test emails dispatched",
        queued,
        failed,
        queuedRecipients,
        failedRecipients,
        failedDetails,
    });
};
export const sendCampaignEmails = async (req, res) => {
    const parsed = EmailPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
    const recipients = dedupeRecipients(parsed.data.recipients);
    if (recipients.length === 0) {
        return res.status(400).json({ message: "No valid recipients" });
    }
    const startIndex = Math.max(0, parsed.data.startIndex ?? 0);
    const batchSize = Math.max(1, parsed.data.batchSize ?? 50);
    const slice = recipients.slice(startIndex, startIndex + batchSize);
    const job = await emailQueue.add("send", {
        subject: parsed.data.subject,
        html: parsed.data.html,
        recipients: slice,
        startIndex,
        batchSize,
    });
    return res.json({
        message: "Emails enqueued for delivery",
        jobId: job.id,
        queuedCount: slice.length,
        totalRecipients: recipients.length,
        startIndex,
        batchSize,
    });
};
