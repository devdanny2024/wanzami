import { Request, Response } from "express";
import { z } from "zod";
import { LiveEventStatus, LiveReplayStatus } from "@prisma/client";
import { prisma } from "../prisma.js";
import { createIvsChannel } from "../services/ivsService.js";
import { config } from "../config.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.string().url().optional(),
  scheduledStartAt: z.string().datetime().optional(),
});

const toPublicEvent = (e: any) => ({
  id: e.id.toString(),
  title: e.title,
  description: e.description,
  thumbnailUrl: e.thumbnailUrl,
  status: e.status,
  playbackUrl: e.playbackUrl,
  scheduledStartAt: e.scheduledStartAt,
  createdAt: e.createdAt,
  startedAt: e.startedAt,
  endedAt: e.endedAt,
  viewerCount: e.viewerCount,
  replay: {
    status: e.replayStatus,
    playbackUrl: e.replayPlaybackUrl,
    readyAt: e.replayReadyAt,
    note: e.replayNote,
  },
});

const toAdminEvent = (e: any) => ({
  ...toPublicEvent(e),
  ingestEndpoint: e.ingestEndpoint,
  streamKey: e.ivsStreamKeyValue,
  ivsChannelArn: e.ivsChannelArn,
  ivsStreamKeyArn: e.ivsStreamKeyArn,
});

export const createLiveEvent = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const { title, description, thumbnailUrl, scheduledStartAt } = parsed.data;
  const scheduledAt = scheduledStartAt ? new Date(scheduledStartAt) : null;
  if (scheduledAt && Number.isNaN(scheduledAt.getTime())) {
    return res.status(400).json({ message: "Invalid scheduledStartAt" });
  }

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
        scheduledStartAt: scheduledAt,
        createdByUserId: req.user?.userId ?? null,
      },
    });

    return res.json({ event: toAdminEvent(created) });
  } catch (err: any) {
    console.error("createLiveEvent error", err);
    return res.status(500).json({ message: "Failed to create live event", error: err?.message });
  }
};

const parseEventId = (value?: string): bigint | null => {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

export const getLiveEventAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  return res.json({ event: toAdminEvent(event) });
};

export const listLiveEventsAdmin = async (_req: Request, res: Response) => {
  const events = await prisma.liveEvent.findMany({
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return res.json({ events: events.map(toAdminEvent) });
};

export const getLiveEventPublic = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  return res.json({ event: toPublicEvent(event) });
};

export const listLiveEventsPublic = async (_req: Request, res: Response) => {
  const events = await prisma.liveEvent.findMany({
    where: { status: { in: [LiveEventStatus.SCHEDULED, LiveEventStatus.LIVE, LiveEventStatus.ENDED] } },
    orderBy: [{ status: "asc" }, { scheduledStartAt: "asc" }, { createdAt: "desc" }],
    take: 30,
  });

  return res.json({ events: events.map(toPublicEvent) });
};

export const startLiveEvent = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const current = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!current) return res.status(404).json({ message: "Live event not found" });

  if (current.status === LiveEventStatus.LIVE) {
    return res.status(409).json({ message: "Event is already live" });
  }
  if (current.status === LiveEventStatus.ENDED) {
    return res.status(409).json({ message: "Cannot start an ended event" });
  }

  const updated = await prisma.liveEvent.update({
    where: { id: eventId },
    data: {
      status: LiveEventStatus.LIVE,
      startedAt: new Date(),
      endedAt: null,
    },
  });

  return res.json({ event: toAdminEvent(updated) });
};

export const endLiveEvent = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const current = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!current) return res.status(404).json({ message: "Live event not found" });

  if (current.status !== LiveEventStatus.LIVE) {
    return res.status(409).json({ message: "Only live events can be ended" });
  }

  const replayStatus = config.ivs.recordingEnabled
    ? LiveReplayStatus.PROCESSING
    : LiveReplayStatus.PENDING_INFRA;

  const updated = await prisma.liveEvent.update({
    where: { id: eventId },
    data: {
      status: LiveEventStatus.ENDED,
      endedAt: new Date(),
      replayStatus,
      replayNote: config.ivs.recordingEnabled
        ? "Recording is being processed into replay/VOD."
        : "Replay recording pipeline is not configured yet (IVS recording + media processing).",
    },
  });

  return res.json({ event: toAdminEvent(updated) });
};
