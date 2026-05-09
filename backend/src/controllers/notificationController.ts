import { Response } from "express";
import { prisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { NotificationType, Prisma } from "@prisma/client";

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const cursor = req.query.cursor ? BigInt(req.query.cursor as string) : undefined;
  const limit = Math.min(Number(req.query.limit) || 30, 100);

  const notifications = await prisma.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;

  const unreadCount = await prisma.userNotification.count({
    where: { userId, isRead: false },
  });

  return res.json({
    notifications: items.map(formatNotification),
    unreadCount,
    nextCursor: hasMore ? items[items.length - 1].id.toString() : null,
  });
};

export const markNotificationRead = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing id" });

  await prisma.userNotification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });
  return res.json({ ok: true });
};

export const markAllNotificationsRead = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  await prisma.userNotification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return res.json({ ok: true });
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const count = await prisma.userNotification.count({
    where: { userId, isRead: false },
  });
  return res.json({ count });
};

function formatNotification(n: {
  id: bigint;
  userId: bigint;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string | null;
  metadata: unknown;
  isRead: boolean;
  createdAt: Date;
}) {
  return {
    id: n.id.toString(),
    type: n.type,
    title: n.title,
    body: n.body,
    imageUrl: n.imageUrl ?? null,
    metadata: n.metadata ?? null,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function createNotification(params: {
  userId: bigint;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl?: string;
  metadata?: Prisma.InputJsonObject;
}) {
  try {
    await prisma.userNotification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        imageUrl: params.imageUrl,
        metadata: params.metadata,
      },
    });
  } catch {
    // Non-critical — never block the calling flow
  }
}
