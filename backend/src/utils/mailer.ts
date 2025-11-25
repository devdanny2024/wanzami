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
      })
    : null;

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!transporter) {
    console.log(
      `[MAILER MOCK] To: ${options.to}\nSubject: ${options.subject}\n${options.html}`
    );
    return;
  }
  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
};
