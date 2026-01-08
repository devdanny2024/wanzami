import { Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const createTicketSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

const replySchema = z.object({
  message: z.string().min(1).max(5000),
});

export const createSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = createTicketSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid ticket payload", issues: parsed.error.issues });
  }

  const { email, subject, message } = parsed.data;

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

  const where =
    status && ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)
      ? { status: status as any }
      : {};

  const tickets = await prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Number.isFinite(limit) && limit > 0 && limit <= 200 ? limit : 50,
  });

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
    select: { id: true },
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

