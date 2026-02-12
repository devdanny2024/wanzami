import { Request, Response } from "express";
import { z } from "zod";
import { LiveEventStatus, LiveReplayStatus, LiveSourceStatus, LiveSourceType, Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { createIvsChannel } from "../services/ivsService.js";
import { config } from "../config.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { canPublishLiveEvent, pickPlayablePlaybackUrl } from "./livePlayback.js";

const createSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional(),
  thumbnailUrl: z.string().trim().url().optional(),
  scheduledStartAt: z.string().datetime().optional(),
});

const replayUpdateSchema = z.object({
  status: z.nativeEnum(LiveReplayStatus),
  playbackUrl: z.string().trim().url().optional().nullable(),
  replayAssetId: z.string().trim().min(1).max(255).optional().nullable(),
  note: z.string().trim().max(5000).optional().nullable(),
  readyAt: z.string().datetime().optional().nullable(),
});

const viewerCountUpdateSchema = z.object({
  viewerCount: z.number().int().min(0).max(1_000_000),
});

const publishUpdateSchema = z.object({
  isPublished: z.boolean(),
});

const sourceCreateSchema = z.object({
  type: z.nativeEnum(LiveSourceType),
  label: z.string().trim().min(1).max(120),
  status: z.nativeEnum(LiveSourceStatus).optional(),
  playbackUrl: z.string().trim().url().optional().nullable(),
  previewUrl: z.string().trim().url().optional().nullable(),
  metadata: z.record(z.any()).optional(),
  isActiveOutput: z.boolean().optional(),
});

const sourceUpdateSchema = z.object({
  type: z.nativeEnum(LiveSourceType).optional(),
  label: z.string().trim().min(1).max(120).optional(),
  status: z.nativeEnum(LiveSourceStatus).optional(),
  playbackUrl: z.string().trim().url().optional().nullable(),
  previewUrl: z.string().trim().url().optional().nullable(),
  metadata: z.record(z.any()).optional(),
  isActiveOutput: z.boolean().optional(),
});

const sourceSwitchSchema = z.object({
  sourceId: z.string().trim().min(1),
});

const parseEventId = (value?: string): bigint | null => {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const parseSourceId = (value?: string): bigint | null => {
  if (!value) return null;
  if (!/^\d+$/.test(value)) return null;
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const normalizeSourceForResponse = (source: any) => ({
  id: source.id.toString(),
  eventId: source.liveEventId?.toString(),
  type: source.type,
  label: source.label,
  status: source.status,
  playbackUrl: source.playbackUrl,
  previewUrl: source.previewUrl,
  metadata: source.metadata,
  isActiveOutput: Boolean(source.isActiveOutput),
  createdAt: source.createdAt,
  updatedAt: source.updatedAt,
});

const resolveActiveSource = (event: any) => {
  const sources: any[] = Array.isArray(event.sources) ? event.sources : [];
  return sources.find((source) => source.isActiveOutput) ?? null;
};

const toPublicEvent = (e: any) => {
  const activeSource = resolveActiveSource(e);
  const effectivePlaybackUrl = pickPlayablePlaybackUrl(e);

  return {
    id: e.id.toString(),
    title: e.title,
    description: e.description,
    thumbnailUrl: e.thumbnailUrl,
    status: e.status,
    isPublished: Boolean(e.isPublished),
    playbackUrl: effectivePlaybackUrl,
    scheduledStartAt: e.scheduledStartAt,
    createdAt: e.createdAt,
    startedAt: e.startedAt,
    endedAt: e.endedAt,
    viewerCount: e.viewerCount,
    activeSourceId: activeSource?.id ? activeSource.id.toString() : null,
    activeSource: activeSource ? normalizeSourceForResponse(activeSource) : null,
    replay: {
      status: e.replayStatus,
      playbackUrl: e.replayPlaybackUrl,
      assetId: e.replayAssetId,
      readyAt: e.replayReadyAt,
      note: e.replayNote,
    },
  };
};

const toAdminEvent = (e: any) => ({
  ...toPublicEvent(e),
  ingestEndpoint: e.ingestEndpoint,
  streamKey: e.ivsStreamKeyValue,
  ivsChannelArn: e.ivsChannelArn,
  ivsStreamKeyArn: e.ivsStreamKeyArn,
  sources: (e.sources ?? []).map(normalizeSourceForResponse),
});

const liveEventInclude = {
  sources: {
    orderBy: [{ isActiveOutput: "desc" as const }, { createdAt: "asc" as const }],
  },
};

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
  if (scheduledAt && scheduledAt.getTime() < Date.now() - 60_000) {
    return res.status(400).json({ message: "scheduledStartAt must be in the future" });
  }

  const safeName = `wanzami-${title.slice(0, 50).replace(/[^a-zA-Z0-9-_]/g, "-")}-${Date.now()}`;

  try {
    let ivs: Awaited<ReturnType<typeof createIvsChannel>> | null = null;
    try {
      ivs = await createIvsChannel({ name: safeName });
    } catch (ivsErr: any) {
      console.error("createLiveEvent ivs provisioning warning", ivsErr);
      // Do not block event creation when IVS provisioning is temporarily unavailable.
      ivs = null;
    }

    const created = await prisma.liveEvent.create({
      data: {
        title,
        description,
        thumbnailUrl,
        status: LiveEventStatus.SCHEDULED,
        isPublished: false,
        ivsChannelArn: ivs?.channelArn ?? null,
        ivsStreamKeyArn: ivs?.streamKeyArn ?? null,
        ivsStreamKeyValue: ivs?.streamKeyValue ?? null,
        ingestEndpoint: ivs?.ingestEndpoint ?? null,
        playbackUrl: ivs?.playbackUrl ?? null,
        scheduledStartAt: scheduledAt,
        createdByUserId: req.user?.userId ?? null,
      },
      include: liveEventInclude,
    });

    return res.json({ event: toAdminEvent(created) });
  } catch (err: any) {
    console.error("createLiveEvent error", err);
    return res.status(500).json({ message: "Failed to create live event", error: err?.message });
  }
};

export const getLiveEventAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId }, include: liveEventInclude });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  return res.json({ event: toAdminEvent(event) });
};

export const listLiveEventsAdmin = async (_req: Request, res: Response) => {
  const events = await prisma.liveEvent.findMany({
    include: liveEventInclude,
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return res.json({ events: events.map(toAdminEvent) });
};

export const deleteLiveEventAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  try {
    const existing = await prisma.liveEvent.findUnique({ where: { id: eventId } });
    if (!existing) {
      return res.status(404).json({ message: "Live event not found" });
    }

    if (existing.status === LiveEventStatus.LIVE) {
      return res.status(409).json({
        message: "Cannot delete a live event. End it first before deleting.",
        code: "LIVE_EVENT_DELETE_BLOCKED",
      });
    }

    await prisma.liveEvent.delete({ where: { id: eventId } });
    return res.status(200).json({ message: "Live event deleted" });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return res.status(404).json({ message: "Live event not found" });
    }
    console.error("deleteLiveEventAdmin error", err);
    return res.status(500).json({ message: "Failed to delete live event", error: err?.message });
  }
};

export const updateLiveEventPublishAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const parsed = publishUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId }, include: liveEventInclude });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  if (parsed.data.isPublished) {
    const canPublish = canPublishLiveEvent(event);
    if (!canPublish) {
      return res.status(409).json({
        message: "Cannot publish event without a playback URL. Configure IVS channel playback or add a source playback URL first.",
        code: "LIVE_EVENT_PUBLISH_BLOCKED",
      });
    }
  }

  const updated = await prisma.liveEvent.update({
    where: { id: eventId },
    data: { isPublished: parsed.data.isPublished },
    include: liveEventInclude,
  });

  return res.json({ event: toAdminEvent(updated) });
};

export const getLiveEventPublic = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const event = await prisma.liveEvent.findFirst({
    where: {
      id: eventId,
      isPublished: true,
    },
    include: liveEventInclude,
  });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  return res.json({ event: toPublicEvent(event) });
};

export const listLiveEventsPublic = async (_req: Request, res: Response) => {
  const events = await prisma.liveEvent.findMany({
    include: liveEventInclude,
    where: {
      isPublished: true,
      status: { in: [LiveEventStatus.SCHEDULED, LiveEventStatus.LIVE, LiveEventStatus.ENDED] },
    },
    orderBy: [{ status: "asc" }, { scheduledStartAt: "asc" }, { createdAt: "desc" }],
    take: 30,
  });

  return res.json({ events: events.map(toPublicEvent) });
};

export const startLiveEvent = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const initialSourceIdRaw = typeof req.body?.sourceId === "string" ? req.body.sourceId : undefined;
  const initialSourceId = initialSourceIdRaw ? parseSourceId(initialSourceIdRaw) : null;
  if (initialSourceIdRaw && !initialSourceId) {
    return res.status(400).json({ message: "Invalid source id" });
  }

  const current = await prisma.liveEvent.findUnique({ where: { id: eventId }, include: liveEventInclude });
  if (!current) return res.status(404).json({ message: "Live event not found" });

  if (!current.isPublished) {
    return res.status(409).json({
      message: "Event must be published before going live",
      code: "LIVE_EVENT_NOT_PUBLISHED",
    });
  }

  if (current.status === LiveEventStatus.LIVE) {
    return res.status(409).json({ message: "Event is already live" });
  }
  if (current.status === LiveEventStatus.ENDED) {
    return res.status(409).json({ message: "Cannot start an ended event" });
  }

  if (initialSourceId) {
    const selected = current.sources.find((source) => source.id === initialSourceId);
    if (!selected) {
      return res.status(404).json({ message: "Selected source not found for this event" });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (initialSourceId) {
      await tx.liveEventSource.updateMany({
        where: { liveEventId: eventId, isActiveOutput: true },
        data: { isActiveOutput: false },
      });
      const activatedSource = await tx.liveEventSource.update({
        where: { id: initialSourceId },
        data: {
          isActiveOutput: true,
          playbackUrl: current.playbackUrl && !current.sources.find((source) => source.id === initialSourceId)?.playbackUrl
            ? current.playbackUrl
            : undefined,
        },
      });

      if (activatedSource.playbackUrl) {
        await tx.liveEvent.update({
          where: { id: eventId },
          data: { playbackUrl: activatedSource.playbackUrl },
        });
      }
    }

    return tx.liveEvent.update({
      where: { id: eventId },
      data: {
        status: LiveEventStatus.LIVE,
        startedAt: new Date(),
        endedAt: null,
      },
      include: liveEventInclude,
    });
  });

  return res.json({ event: toAdminEvent(updated) });
};

export const endLiveEvent = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const current = await prisma.liveEvent.findUnique({ where: { id: eventId }, include: liveEventInclude });
  if (!current) return res.status(404).json({ message: "Live event not found" });

  if (current.status === LiveEventStatus.ENDED) {
    return res.json({ event: toAdminEvent(current), alreadyEnded: true });
  }

  if (current.status !== LiveEventStatus.LIVE && current.status !== LiveEventStatus.SCHEDULED) {
    return res.status(409).json({
      message: `Event in state ${current.status} cannot be ended`,
      code: "INVALID_LIVE_EVENT_STATE",
      currentState: current.status,
      allowedStates: [LiveEventStatus.LIVE, LiveEventStatus.SCHEDULED],
      targetState: LiveEventStatus.ENDED,
    });
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
    include: liveEventInclude,
  });

  return res.json({
    event: toAdminEvent(updated),
    transition: {
      from: current.status,
      to: LiveEventStatus.ENDED,
    },
  });
};

export const updateLiveEventViewerCountAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const parsed = viewerCountUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const current = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!current) return res.status(404).json({ message: "Live event not found" });

  if (current.status !== LiveEventStatus.LIVE) {
    return res.status(409).json({ message: "Viewer count can only be updated while event is live" });
  }

  const updated = await prisma.liveEvent.update({
    where: { id: eventId },
    data: {
      viewerCount: parsed.data.viewerCount,
    },
    include: liveEventInclude,
  });

  return res.json({ event: toAdminEvent(updated) });
};

export const updateLiveEventReplayAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const parsed = replayUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const current = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!current) return res.status(404).json({ message: "Live event not found" });

  const { status, playbackUrl, replayAssetId, note, readyAt } = parsed.data;

  if (current.status !== LiveEventStatus.ENDED) {
    return res.status(409).json({ message: "Replay metadata can only be updated after event has ended" });
  }

  const nextPlaybackUrl = playbackUrl !== undefined ? playbackUrl : current.replayPlaybackUrl;
  if (status === LiveReplayStatus.READY && !nextPlaybackUrl) {
    return res.status(400).json({ message: "playbackUrl is required when replay status is READY" });
  }

  if (status !== LiveReplayStatus.READY && readyAt) {
    return res.status(400).json({ message: "readyAt is only allowed when replay status is READY" });
  }

  let replayReadyAt: Date | null = null;
  if (status === LiveReplayStatus.READY) {
    if (readyAt === undefined) {
      replayReadyAt = current.replayReadyAt ?? new Date();
    } else if (readyAt === null) {
      replayReadyAt = new Date();
    } else {
      replayReadyAt = new Date(readyAt);
    }

    if (Number.isNaN(replayReadyAt.getTime())) {
      return res.status(400).json({ message: "Invalid readyAt" });
    }
  }

  const updated = await prisma.liveEvent.update({
    where: { id: eventId },
    data: {
      replayStatus: status,
      replayPlaybackUrl: nextPlaybackUrl,
      replayAssetId: replayAssetId !== undefined ? replayAssetId : current.replayAssetId,
      replayReadyAt,
      replayNote: note !== undefined ? note : current.replayNote,
    },
    include: liveEventInclude,
  });

  return res.json({ event: toAdminEvent(updated) });
};

export const listLiveEventSourcesAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const event = await prisma.liveEvent.findUnique({
    where: { id: eventId },
    include: liveEventInclude,
  });

  if (!event) return res.status(404).json({ message: "Live event not found" });

  return res.json({
    eventId: event.id.toString(),
    activeSourceId: resolveActiveSource(event)?.id?.toString() ?? null,
    sources: event.sources.map(normalizeSourceForResponse),
  });
};

export const createLiveEventSourceAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const parsed = sourceCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  const { type, label, status, playbackUrl, previewUrl, metadata, isActiveOutput } = parsed.data;

  const created = await prisma.$transaction(async (tx) => {
    if (isActiveOutput) {
      await tx.liveEventSource.updateMany({
        where: { liveEventId: eventId, isActiveOutput: true },
        data: { isActiveOutput: false },
      });
    }

    const nextSource = await tx.liveEventSource.create({
      data: {
        liveEventId: eventId,
        type,
        label,
        status: status ?? LiveSourceStatus.READY,
        playbackUrl: playbackUrl ?? null,
        previewUrl: previewUrl ?? null,
        metadata: metadata ?? undefined,
        isActiveOutput: Boolean(isActiveOutput),
      },
    });

    if (nextSource.playbackUrl) {
      await tx.liveEvent.update({
        where: { id: eventId },
        data: { playbackUrl: nextSource.playbackUrl },
      });
    }

    return nextSource;
  });

  return res.status(201).json({ source: normalizeSourceForResponse(created) });
};

export const updateLiveEventSourceAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  const sourceId = parseSourceId(req.params.sourceId);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });
  if (!sourceId) return res.status(400).json({ message: "Invalid source id" });

  const parsed = sourceUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const source = await prisma.liveEventSource.findUnique({ where: { id: sourceId } });
  if (!source || source.liveEventId !== eventId) {
    return res.status(404).json({ message: "Live source not found" });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (parsed.data.isActiveOutput) {
      await tx.liveEventSource.updateMany({
        where: { liveEventId: eventId, isActiveOutput: true },
        data: { isActiveOutput: false },
      });
    }

    const nextSource = await tx.liveEventSource.update({
      where: { id: sourceId },
      data: {
        type: parsed.data.type,
        label: parsed.data.label,
        status: parsed.data.status,
        playbackUrl: parsed.data.playbackUrl,
        previewUrl: parsed.data.previewUrl,
        metadata: parsed.data.metadata,
        isActiveOutput: parsed.data.isActiveOutput,
      },
    });

    if (nextSource.playbackUrl) {
      await tx.liveEvent.update({
        where: { id: eventId },
        data: { playbackUrl: nextSource.playbackUrl },
      });
    }

    return nextSource;
  });

  return res.json({ source: normalizeSourceForResponse(updated) });
};

export const deleteLiveEventSourceAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  const sourceId = parseSourceId(req.params.sourceId);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });
  if (!sourceId) return res.status(400).json({ message: "Invalid source id" });

  const source = await prisma.liveEventSource.findUnique({ where: { id: sourceId } });
  if (!source || source.liveEventId !== eventId) {
    return res.status(404).json({ message: "Live source not found" });
  }

  await prisma.liveEventSource.delete({ where: { id: sourceId } });

  return res.status(204).send();
};

export const switchLiveEventSourceAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const parsed = sourceSwitchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const sourceId = parseSourceId(parsed.data.sourceId);
  if (!sourceId) return res.status(400).json({ message: "Invalid source id" });

  const source = await prisma.liveEventSource.findUnique({ where: { id: sourceId } });
  if (!source || source.liveEventId !== eventId) {
    return res.status(404).json({ message: "Live source not found" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.liveEventSource.updateMany({
      where: { liveEventId: eventId, isActiveOutput: true },
      data: { isActiveOutput: false },
    });

    const switchedSource = await tx.liveEventSource.update({
      where: { id: sourceId },
      data: { isActiveOutput: true },
    });

    if (switchedSource.playbackUrl) {
      await tx.liveEvent.update({
        where: { id: eventId },
        data: { playbackUrl: switchedSource.playbackUrl },
      });
    }
  });

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId }, include: liveEventInclude });
  return res.json({
    eventId: eventId.toString(),
    activeSourceId: sourceId.toString(),
    event: event ? toAdminEvent(event) : null,
  });
};



