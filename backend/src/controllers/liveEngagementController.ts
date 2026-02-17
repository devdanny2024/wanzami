import { Request, Response } from "express";
import { LiveVisibility } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const liveDb = prisma as any;

const chatCreateSchema = z.object({
  message: z.string().trim().min(1).max(500),
});

const reactionCreateSchema = z.object({
  type: z.string().trim().min(1).max(32).regex(/^[a-zA-Z0-9_+-]+$/),
});

const moderationSchema = z.object({
  isHidden: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});

const muteSchema = z.object({
  userId: z.string().trim().min(1),
  reason: z.string().trim().max(240).optional(),
  mutedMinutes: z.number().int().min(1).max(24 * 60).default(30),
});

const parseBigIntId = (value?: string): bigint | null => {
  if (!value || !/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const ensureLiveEventViewable = async (eventId: bigint) => {
  const event = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!event) return { status: 404 as const, message: "Live event not found" };
  if (!event.isPublished) return { status: 403 as const, message: "Live event is not published" };
  if (event.visibility === LiveVisibility.PRIVATE) {
    return { status: 403 as const, message: "Live event is private" };
  }
  return { event } as const;
};

export const listLiveChatMessages = async (req: Request, res: Response) => {
  const eventId = parseBigIntId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const guard = await ensureLiveEventViewable(eventId);
  if ("status" in guard) { const g = guard as { status: number; message: string }; return res.status(g.status).json({ message: g.message }); }

  const cursor = req.query.cursor ? parseBigIntId(String(req.query.cursor)) : null;
  const limit = Math.max(1, Math.min(Number(req.query.limit ?? 40) || 40, 100));

  const messages = await liveDb.liveChatMessage.findMany({
    where: {
      liveEventId: eventId,
      isDeleted: false,
      isHidden: false,
    },
    include: {
      user: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { id: "desc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit,
  });

  return res.json({
    messages: messages.reverse().map((m: any) => ({
      id: m.id.toString(),
      eventId: m.liveEventId.toString(),
      userId: m.userId.toString(),
      userName: m.user?.name ?? "Viewer",
      userRole: m.user?.role ?? "USER",
      message: m.message,
      isPinned: m.isPinned,
      createdAt: m.createdAt,
    })),
    nextCursor: messages.length === limit ? messages[messages.length - 1]?.id.toString() : null,
  });
};

export const listLiveChatMessagesAdmin = async (req: Request, res: Response) => {
  const eventId = parseBigIntId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  const limit = Math.max(1, Math.min(Number(req.query.limit ?? 100) || 100, 200));
  const messages = await liveDb.liveChatMessage.findMany({
    where: { liveEventId: eventId },
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return res.json({
    messages: messages.map((m: any) => ({
      id: m.id.toString(),
      eventId: m.liveEventId.toString(),
      userId: m.userId.toString(),
      userName: m.user?.name ?? "Viewer",
      userRole: m.user?.role ?? "USER",
      message: m.message,
      isHidden: m.isHidden,
      isDeleted: m.isDeleted,
      isPinned: m.isPinned,
      createdAt: m.createdAt,
    })),
  });
};

export const createLiveChatMessage = async (req: AuthenticatedRequest, res: Response) => {
  const eventId = parseBigIntId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });
  if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });
  const userId = parseBigIntId(String(req.user.userId));
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const guard = await ensureLiveEventViewable(eventId);
  if ("status" in guard) { const g = guard as { status: number; message: string }; return res.status(g.status).json({ message: g.message }); }

  const parsed = chatCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const mute = await liveDb.liveChatModeration.findFirst({
    where: { liveEventId: eventId, userId, mutedUntil: { gt: new Date() } },
    orderBy: { mutedUntil: "desc" },
  });
  if (mute) {
    return res.status(403).json({ message: "You are temporarily muted in this live chat", mutedUntil: mute.mutedUntil });
  }

  const created = await liveDb.liveChatMessage.create({
    data: {
      liveEventId: eventId,
      userId,
      message: parsed.data.message,
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return res.status(201).json({
    message: {
      id: created.id.toString(),
      eventId: created.liveEventId.toString(),
      userId: created.userId.toString(),
      userName: created.user?.name ?? "Viewer",
      userRole: created.user?.role ?? "USER",
      message: created.message,
      isPinned: created.isPinned,
      createdAt: created.createdAt,
    },
  });
};

export const sendLiveReaction = async (req: AuthenticatedRequest, res: Response) => {
  const eventId = parseBigIntId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });
  if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });
  const userId = parseBigIntId(String(req.user.userId));
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const guard = await ensureLiveEventViewable(eventId);
  if ("status" in guard) { const g = guard as { status: number; message: string }; return res.status(g.status).json({ message: g.message }); }

  const parsed = reactionCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const reactionType = parsed.data.type.toLowerCase();

  await prisma.$transaction(async (tx: any) => {
    await tx.liveReactionEvent.create({
      data: {
        liveEventId: eventId,
        userId,
        reactionType,
      },
    });

    await tx.liveReactionAggregate.upsert({
      where: { liveEventId_reactionType: { liveEventId: eventId, reactionType } },
      update: { count: { increment: 1 } },
      create: {
        liveEventId: eventId,
        reactionType,
        count: 1,
      },
    });
  });

  return res.status(201).json({ ok: true });
};

export const listLiveReactions = async (req: Request, res: Response) => {
  const eventId = parseBigIntId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const guard = await ensureLiveEventViewable(eventId);
  if ("status" in guard) { const g = guard as { status: number; message: string }; return res.status(g.status).json({ message: g.message }); }

  const [totals, latest] = await Promise.all([
    liveDb.liveReactionAggregate.findMany({ where: { liveEventId: eventId }, orderBy: { count: "desc" } }),
    liveDb.liveReactionEvent.findMany({
      where: { liveEventId: eventId },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  return res.json({
    totals: totals.map((item: any) => ({ type: item.reactionType, count: item.count })),
    latest: latest.map((item: any) => ({
      id: item.id.toString(),
      type: item.reactionType,
      createdAt: item.createdAt,
      user: item.user ? { id: item.user.id.toString(), name: item.user.name } : null,
    })),
  });
};

export const getLiveEngagementSnapshot = async (req: Request, res: Response) => {
  const eventId = parseBigIntId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const guard = await ensureLiveEventViewable(eventId);
  if ("status" in guard) { const g = guard as { status: number; message: string }; return res.status(g.status).json({ message: g.message }); }

  const sinceRaw = typeof req.query.since === "string" ? req.query.since : undefined;
  const since = sinceRaw ? new Date(sinceRaw) : null;
  const validSince = since && !Number.isNaN(since.getTime()) ? since : null;

  const [messages, totals, latestReactions] = await Promise.all([
    liveDb.liveChatMessage.findMany({
      where: {
        liveEventId: eventId,
        isDeleted: false,
        isHidden: false,
        ...(validSince ? { createdAt: { gt: validSince } } : {}),
      },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "asc" },
      take: validSince ? 150 : 50,
    }),
    liveDb.liveReactionAggregate.findMany({ where: { liveEventId: eventId } }),
    liveDb.liveReactionEvent.findMany({
      where: {
        liveEventId: eventId,
        ...(validSince ? { createdAt: { gt: validSince } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true } } },
      take: 60,
    }),
  ]);

  return res.json({
    serverTime: new Date().toISOString(),
    messages: messages.map((m: any) => ({
      id: m.id.toString(),
      eventId: m.liveEventId.toString(),
      userId: m.userId.toString(),
      userName: m.user?.name ?? "Viewer",
      userRole: m.user?.role ?? "USER",
      message: m.message,
      isPinned: m.isPinned,
      createdAt: m.createdAt,
    })),
    reactionTotals: totals.map((item: any) => ({ type: item.reactionType, count: item.count })),
    recentReactions: latestReactions.map((item: any) => ({
      id: item.id.toString(),
      type: item.reactionType,
      createdAt: item.createdAt,
      user: item.user ? { id: item.user.id.toString(), name: item.user.name } : null,
    })),
  });
};

export const moderateLiveChatMessage = async (req: Request, res: Response) => {
  const eventId = parseBigIntId(req.params.id);
  const messageId = parseBigIntId(req.params.messageId);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });
  if (!messageId) return res.status(400).json({ message: "Invalid message id" });

  const parsed = moderationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const message = await liveDb.liveChatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.liveEventId !== eventId) {
    return res.status(404).json({ message: "Live chat message not found" });
  }

  const updated = await liveDb.liveChatMessage.update({
    where: { id: messageId },
    data: {
      isHidden: parsed.data.isHidden,
      isPinned: parsed.data.isPinned,
      moderatedAt: new Date(),
    },
  });

  return res.json({
    message: {
      id: updated.id.toString(),
      isHidden: updated.isHidden,
      isPinned: updated.isPinned,
      moderatedAt: updated.moderatedAt,
    },
  });
};

export const deleteLiveChatMessage = async (req: Request, res: Response) => {
  const eventId = parseBigIntId(req.params.id);
  const messageId = parseBigIntId(req.params.messageId);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });
  if (!messageId) return res.status(400).json({ message: "Invalid message id" });

  const message = await liveDb.liveChatMessage.findUnique({ where: { id: messageId } });
  if (!message || message.liveEventId !== eventId) {
    return res.status(404).json({ message: "Live chat message not found" });
  }

  await liveDb.liveChatMessage.update({ where: { id: messageId }, data: { isDeleted: true, moderatedAt: new Date() } });
  return res.status(204).send();
};

export const muteLiveChatUser = async (req: AuthenticatedRequest, res: Response) => {
  const eventId = parseBigIntId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const parsed = muteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });

  const userId = parseBigIntId(parsed.data.userId);
  if (!userId) return res.status(400).json({ message: "Invalid user id" });

  const mutedMinutes = parsed.data.mutedMinutes ?? 30;
  const mutedUntil = new Date(Date.now() + mutedMinutes * 60_000);

  const moderatorId = req.user?.userId ? parseBigIntId(String(req.user.userId)) : null;

  const record = await liveDb.liveChatModeration.create({
    data: {
      liveEventId: eventId,
      userId,
      reason: parsed.data.reason,
      mutedUntil,
      moderatedBy: moderatorId ?? undefined,
    },
  });

  return res.status(201).json({
    moderation: {
      id: record.id.toString(),
      userId: record.userId.toString(),
      mutedUntil: record.mutedUntil,
      reason: record.reason,
    },
  });
};



