import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { createIvsChannel } from "../services/ivsService.js";
import { LiveEventStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const createLiveEvent = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const { title, description, thumbnailUrl } = parsed.data;
  const safeName = `wanzami-${title.slice(0, 50).replace(/[^a-zA-Z0-9-_]/g, "-")}-${Date.now()}`;

  try {
    const ivs = await createIvsChannel({ name: safeName });
    const created = await prisma.liveEvent.create({
      data: {
        title,
        description,
        thumbnailUrl,
        status: LiveEventStatus.SCHEDULED,
        ivsChannelArn: ivs.channelArn,
        ivsStreamKeyArn: ivs.streamKeyArn,
        ivsStreamKeyValue: ivs.streamKeyValue,
        ingestEndpoint: ivs.ingestEndpoint,
        playbackUrl: ivs.playbackUrl,
        createdByUserId: req.user?.userId ?? null,
      },
    });

    return res.json({
      event: {
        id: created.id.toString(),
        title: created.title,
        description: created.description,
        thumbnailUrl: created.thumbnailUrl,
        status: created.status,
        ingestEndpoint: created.ingestEndpoint,
        playbackUrl: created.playbackUrl,
        streamKey: created.ivsStreamKeyValue,
        createdAt: created.createdAt,
      },
    });
  } catch (err: any) {
    console.error("createLiveEvent error", err);
    return res.status(500).json({ message: "Failed to create live event", error: err?.message });
  }
};

export const listLiveEventsAdmin = async (_req: Request, res: Response) => {
  const events = await prisma.liveEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return res.json({
    events: events.map((e) => ({
      id: e.id.toString(),
      title: e.title,
      description: e.description,
      thumbnailUrl: e.thumbnailUrl,
      status: e.status,
      ingestEndpoint: e.ingestEndpoint,
      playbackUrl: e.playbackUrl,
      streamKey: e.ivsStreamKeyValue,
      createdAt: e.createdAt,
      startedAt: e.startedAt,
      endedAt: e.endedAt,
    })),
  });
};

export const listLiveEventsPublic = async (_req: Request, res: Response) => {
  const events = await prisma.liveEvent.findMany({
    where: { status: { in: [LiveEventStatus.SCHEDULED, LiveEventStatus.LIVE] } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return res.json({
    events: events.map((e) => ({
      id: e.id.toString(),
      title: e.title,
      description: e.description,
      thumbnailUrl: e.thumbnailUrl,
      status: e.status,
      playbackUrl: e.playbackUrl,
      createdAt: e.createdAt,
      startedAt: e.startedAt,
    })),
  });
};

export const startLiveEvent = async (req: Request, res: Response) => {
  const eventId = req.params.id ? BigInt(req.params.id) : null;
  if (!eventId) return res.status(400).json({ message: "Missing event id" });

  const updated = await prisma.liveEvent.update({
    where: { id: eventId },
    data: {
      status: LiveEventStatus.LIVE,
      startedAt: new Date(),
    },
  });

  return res.json({
    event: {
      id: updated.id.toString(),
      status: updated.status,
      startedAt: updated.startedAt,
    },
  });
};

export const endLiveEvent = async (req: Request, res: Response) => {
  const eventId = req.params.id ? BigInt(req.params.id) : null;
  if (!eventId) return res.status(400).json({ message: "Missing event id" });

  const updated = await prisma.liveEvent.update({
    where: { id: eventId },
    data: {
      status: LiveEventStatus.ENDED,
      endedAt: new Date(),
    },
  });

  return res.json({
    event: {
      id: updated.id.toString(),
      status: updated.status,
      endedAt: updated.endedAt,
    },
  });
};
