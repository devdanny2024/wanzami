import { Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { sendEmail } from "../utils/mailer.js";
import { config } from "../config.js";
import { emailQueue } from "../queues/emailQueue.js";

// Keep Zod around for reply validation, but handle ticket creation
// with more permissive, hand-rolled validation so we never block
// real users on overly strict schemas.
const createTicketSchema = z.object({
  email: z.string().email().transform((v) => v.trim()),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(3).max(5000),
});

const replySchema = z.object({
  message: z.string().min(1).max(5000),
});

export const createSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  const body = (req.body ?? {}) as any;

  const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
  if (!emailRaw || !emailRaw.includes("@")) {
    return res.status(400).json({ message: "Invalid ticket payload", issues: [{ path: ["email"], message: "Valid email is required" }] });
  }

  let subject = typeof body.subject === "string" ? body.subject.trim() : "";
  if (!subject) subject = "Support request";

  let message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) message = "(no message provided)";

  const email = emailRaw;

  const userId = req.user?.userId ?? null;

  const ticket = await prisma.supportTicket.create({
    data: {
      email,
      subject,
      message,
      userId: userId ?? undefined,
      messages: {
        create: {
          userId: userId ?? undefined,
          isAdmin: false,
          message,
        },
      },
    },
  });

  // Fire-and-forget email notification to support.
  void sendEmail({
    to: config.supportEmail,
    subject: `[Support] New ticket from ${email}`,
    html: `<p><strong>From:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, "<br/>")}</p>`,
  }).catch(() => {});

  return res.status(201).json({
    ticket: {
      id: ticket.id.toString(),
      email: ticket.email,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      lastReplyAt: ticket.lastReplyAt,
    },
  });
};

export const listSupportTickets = async (req: AuthenticatedRequest, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const limit = Number(req.query.limit ?? "50");
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const email = typeof req.query.email === "string" ? req.query.email.trim() : "";
  const days = req.query.days ? Number(req.query.days) : NaN;

  const where: any = {};

  if (status && ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
    where.status = status;
  }

  if (email) {
    where.email = { contains: email, mode: "insensitive" };
  }

  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
    ];
  }

  if (!Number.isNaN(days) && days > 0) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: since };
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(limit) && limit > 0 && limit <= 200 ? limit : 50,
  });

  const countsRaw = await prisma.supportTicket.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<string, number> = {};
  for (const row of countsRaw) {
    const key = row.status;
    const value =
      typeof row._count === "object" && row._count
        ? (row._count as any)._all ?? 0
        : 0;
    counts[key] = value;
  }

  return res.json({
    tickets: tickets.map((t) => ({
      id: t.id.toString(),
      email: t.email,
      subject: t.subject,
      message: t.message,
      status: t.status,
      priority: t.priority,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      lastReplyAt: t.lastReplyAt,
    })),
    counts,
  });
};

export const updateSupportTicketStatus = async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = req.params.id;
  const status = req.body?.status as string | undefined;

  if (!ticketId || !/^\d+$/.test(ticketId)) {
    return res.status(400).json({ message: "Invalid ticket id" });
  }

  if (!status || !["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const updated = await prisma.supportTicket.update({
    where: { id: BigInt(ticketId) },
    data: {
      status: status as any,
      updatedAt: new Date(),
    },
  });

  return res.json({
    ticket: {
      id: updated.id.toString(),
      email: updated.email,
      subject: updated.subject,
      message: updated.message,
      status: updated.status,
      priority: updated.priority,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      lastReplyAt: updated.lastReplyAt,
    },
  });
};

export const listSupportTicketMessages = async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = req.params.id;
  if (!ticketId || !/^\d+$/.test(ticketId)) {
    return res.status(400).json({ message: "Invalid ticket id" });
  }

  const messages = await prisma.supportTicketMessage.findMany({
    where: { ticketId: BigInt(ticketId) },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  return res.json({
    messages: messages.map((m) => ({
      id: m.id.toString(),
      ticketId: m.ticketId.toString(),
      message: m.message,
      isAdmin: m.isAdmin,
      createdAt: m.createdAt,
      userEmail: m.user?.email ?? null,
      userName: m.user?.name ?? null,
    })),
  });
};

export const addSupportTicketReply = async (req: AuthenticatedRequest, res: Response) => {
  const ticketId = req.params.id;
  if (!ticketId || !/^\d+$/.test(ticketId)) {
    return res.status(400).json({ message: "Invalid ticket id" });
  }

  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid reply payload", issues: parsed.error.issues });
  }

  const { message } = parsed.data;
  const userId = req.user?.userId ?? null;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: BigInt(ticketId) },
    select: { id: true, email: true, subject: true },
  });
  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const created = await prisma.supportTicketMessage.create({
    data: {
      ticketId: ticket.id,
      userId: userId ?? undefined,
      isAdmin: true,
      message,
    },
  });

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      lastReplyAt: created.createdAt,
      updatedAt: new Date(),
    },
  });

  // Notify the customer that an admin has replied, best-effort.
  if (ticket.email) {
    void emailQueue
      .add("send", {
        subject: `Re: ${ticket.subject}`,
        html: `<p>Our support team has replied to your ticket:</p>
<p>${message.replace(/\n/g, "<br/>")}</p>`,
        recipients: [{ email: ticket.email, name: ticket.email }],
      })
      .catch(() => {});
  }

  return res.status(201).json({
    message: {
      id: created.id.toString(),
      ticketId: created.ticketId.toString(),
      message: created.message,
      isAdmin: created.isAdmin,
      createdAt: created.createdAt,
    },
  });
};
