import nodemailer from "nodemailer";
import { config } from "../config.js";

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM ?? "Wanzami <no-reply@wanzami.com>";

const transporter =
  host && user && pass
    ? nodemailer.createTransport({
        host,
        port,
        auth: { user, pass },
        secure: port === 465,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      })
    : null;

// Email is best-effort everywhere it's called from (signup, verification,
// welcome, receipts, etc.) — a slow or down SMTP server must never hang or
// crash the request that triggered it, so this never throws. Callers that
// don't check the return value are safe by default; callers that need to
// know about failures (e.g. bulk campaign sends) can check `ok`.
export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> => {
  if (!transporter) {
    console.log(
      `[MAILER MOCK] To: ${options.to}\nSubject: ${options.subject}\n${options.html}`
    );
    return { ok: true };
  }
  try {
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return { ok: true };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error(`[MAILER] Failed to send to ${options.to}:`, message);
    return { ok: false, error: message };
  }
};
