import { Response } from "express";
import { prisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { sendBroadcast } from "../services/pushService.js";

export const sendBroadcastNotification = async (req: AuthenticatedRequest, res: Response) => {
  const { title, body, imageUrl } = req.body ?? {};
  if (!title || !body) {
    return res.status(400).json({ message: "title and body are required" });
  }

  try {
    await sendBroadcast({ title, body, imageUrl: imageUrl || undefined });
    const recipientCount = await prisma.deviceToken.count();

    const record = await prisma.pushBroadcast.create({
      data: {
        title,
        body,
        imageUrl: imageUrl || null,
        sentBy: req.user?.userId,
        recipientCount,
      },
    });

    return res.json({ ok: true, broadcast: formatBroadcast(record) });
  } catch (err) {
    console.error("sendBroadcastNotification error:", err);
    return res.status(500).json({ message: "Failed to send broadcast" });
  }
};

export const listBroadcastHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const broadcasts = await prisma.pushBroadcast.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return res.json({ broadcasts: broadcasts.map(formatBroadcast) });
  } catch (err) {
    console.error("listBroadcastHistory error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

function formatBroadcast(b: {
  id: bigint;
  title: string;
  body: string;
  imageUrl: string | null;
  sentBy: bigint | null;
  recipientCount: number;
  createdAt: Date;
}) {
  return {
    id: b.id.toString(),
    title: b.title,
    body: b.body,
    imageUrl: b.imageUrl,
    sentBy: b.sentBy?.toString() ?? null,
    recipientCount: b.recipientCount,
    createdAt: b.createdAt.toISOString(),
  };
}
