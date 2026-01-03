import { z } from "zod";
import { sendEmail } from "../utils/mailer.js";
const RecipientSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
});
const EmailPayloadSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    html: z.string().min(1, "Email body is required"),
    recipients: z.array(RecipientSchema).min(1, "At least one recipient is required"),
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
    results.forEach((r, idx) => {
        const email = recipients[idx]?.email;
        if (!email)
            return;
        if (r.status === "rejected") {
            failedRecipients.push(email);
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
    const { queued, failed, queuedRecipients, failedRecipients } = await sendBatch(recipients, parsed.data.subject, parsed.data.html);
    return res.json({
        message: "Test emails dispatched",
        queued,
        failed,
        queuedRecipients,
        failedRecipients,
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
    const { queued, failed, queuedRecipients, failedRecipients } = await sendBatch(recipients, parsed.data.subject, parsed.data.html);
    return res.json({
        message: "Emails queued for delivery",
        queued,
        failed,
        queuedRecipients,
        failedRecipients,
    });
};
