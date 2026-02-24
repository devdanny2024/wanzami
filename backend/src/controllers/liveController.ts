import { Request, Response } from "express";
import crypto from "crypto";
import { z } from "zod";
import { LiveEventStatus, LiveReplayStatus, LiveSourceStatus, LiveSourceType, LiveVisibility, Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { createIvsChannel, getIvsChannelPlaybackUrl } from "../services/ivsService.js";
import { config } from "../config.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { canPublishLiveEvent, pickPlayablePlaybackUrl } from "./livePlayback.js";

const createSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(5000).optional(),
  thumbnailUrl: z.string().trim().url().optional(),
  category: z.string().trim().max(120).optional(),
  scheduledStartAt: z.string().datetime().optional(),
  visibility: z.nativeEnum(LiveVisibility).optional(),
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

const adminEventUpdateSchema = z.object({
  visibility: z.nativeEnum(LiveVisibility).optional(),
  scheduledStartAt: z.string().datetime().nullable().optional(),
  category: z.string().trim().max(120).nullable().optional(),
  thumbnailUrl: z.string().trim().url().nullable().optional(),
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
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

const sourceRegisterThirdPartySchema = z.object({
  label: z.string().trim().min(1).max(120),
  provider: z.string().trim().min(1).max(60),
  transport: z.enum(["RTMP_PUSH", "SRT", "WHIP", "HLS_PULL", "CUSTOM"]).default("RTMP_PUSH"),
  sourceKey: z.string().trim().min(1).max(160).optional(),
  ingestUrl: z.string().trim().url().optional(),
  playbackUrl: z.string().trim().url().optional().nullable(),
  previewUrl: z.string().trim().url().optional().nullable(),
  metadata: z.record(z.any()).optional(),
  makeActive: z.boolean().optional(),
});

const sourceHeartbeatSchema = z.object({
  // Backward-compatible: keep accepting legacy ERROR state from older clients.
  // Internally we map ERROR -> DEGRADED.
  state: z.enum(["READY", "DEGRADED", "OFFLINE", "ERROR"]).optional(),
  latencyMs: z.number().int().min(0).max(120_000).optional(),
  bitrateKbps: z.number().int().min(0).max(10_000_000).optional(),
  droppedFrames: z.number().int().min(0).max(10_000_000).optional(),
  note: z.string().trim().max(500).optional(),
  playbackUrl: z.string().trim().url().optional().nullable(),
  previewUrl: z.string().trim().url().optional().nullable(),
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

const generateUnlistedSlug = () => crypto.randomBytes(9).toString("base64url");

let liveEventCompatColumnsEnsured = false;
const ensureLiveEventCompatColumns = async () => {
  if (liveEventCompatColumnsEnsured) return;
  try {
    // Backward-compatible guard for partially migrated environments.
    // Keep Live Studio operator flows available even when rollout order is behind.
    await prisma.$executeRawUnsafe('ALTER TABLE "LiveEvent" ADD COLUMN IF NOT EXISTS "category" TEXT;');
    await prisma.$executeRawUnsafe('ALTER TABLE "LiveEvent" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false;');
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "LiveVisibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;`);
    await prisma.$executeRawUnsafe('ALTER TABLE "LiveEvent" ADD COLUMN IF NOT EXISTS "visibility" "LiveVisibility" NOT NULL DEFAULT \'PRIVATE\';');
    await prisma.$executeRawUnsafe('ALTER TABLE "LiveEvent" ADD COLUMN IF NOT EXISTS "unlistedSlug" TEXT;');
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "LiveEvent_unlistedSlug_key" ON "LiveEvent"("unlistedSlug");');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "LiveEvent_isPublished_status_idx" ON "LiveEvent"("isPublished", "status");');
    liveEventCompatColumnsEnsured = true;
  } catch (err: any) {
    console.error("ensureLiveEventCompatColumns warning", {
      message: err?.message,
      code: err?.code,
    });
  }
};

const ensureUnlistedSlug = async (tx: Prisma.TransactionClient, eventId: bigint) => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = generateUnlistedSlug();
    try {
      const updated = await tx.liveEvent.update({
        where: { id: eventId },
        data: { unlistedSlug: slug },
      });
      return updated.unlistedSlug;
    } catch (err: any) {
      if (err?.code === "P2002") {
        continue; // unique collision
      }
      throw err;
    }
  }
  throw new Error("Failed to generate unique unlisted slug");
};

const resolveHeartbeatDerivedStatus = ({
  reportedStatus,
  ageMs,
  timeoutMs,
}: {
  reportedStatus: LiveSourceStatus;
  ageMs: number | null;
  timeoutMs: number;
}) => {
  // Manual OFFLINE always wins.
  if (reportedStatus === LiveSourceStatus.OFFLINE) return LiveSourceStatus.OFFLINE;

  // Explicit degraded/error from source remains degraded until next READY heartbeat.
  if (reportedStatus === LiveSourceStatus.DEGRADED || reportedStatus === LiveSourceStatus.ERROR) {
    return LiveSourceStatus.DEGRADED;
  }

  // No heartbeat yet: keep reported state.
  if (ageMs === null) return reportedStatus;

  if (ageMs > timeoutMs) return LiveSourceStatus.OFFLINE;
  if (ageMs > timeoutMs * 0.5) return LiveSourceStatus.DEGRADED;
  return LiveSourceStatus.READY;
};

const getSourceHealth = (source: any) => {
  const now = Date.now();
  const health = (source?.metadata as any)?.health ?? {};
  const lastHeartbeatRaw = health?.lastHeartbeatAt;
  const lastHeartbeatAt = lastHeartbeatRaw ? new Date(lastHeartbeatRaw) : null;
  const lastHeartbeatMs = lastHeartbeatAt && !Number.isNaN(lastHeartbeatAt.getTime()) ? lastHeartbeatAt.getTime() : null;
  const timeoutMs = Math.max(1_000, config.live.sourceHeartbeatTimeoutMs);
  const ageMs = lastHeartbeatMs ? Math.max(0, now - lastHeartbeatMs) : null;
  const effectiveStatus = resolveHeartbeatDerivedStatus({
    reportedStatus: source?.status,
    ageMs,
    timeoutMs,
  });

  return {
    lastHeartbeatAt,
    timeoutMs,
    ageMs,
    isTimedOut: effectiveStatus === LiveSourceStatus.OFFLINE,
    effectiveStatus,
    latencyMs: health?.latencyMs ?? null,
    bitrateKbps: health?.bitrateKbps ?? null,
    droppedFrames: health?.droppedFrames ?? null,
    note: health?.note ?? null,
  };
};

const normalizeSourceForResponse = (source: any) => {
  const health = getSourceHealth(source);
  return {
    id: source.id.toString(),
    eventId: source.liveEventId?.toString(),
    type: source.type,
    label: source.label,
    status: health.effectiveStatus,
    reportedStatus: source.status,
    playbackUrl: source.playbackUrl,
    previewUrl: source.previewUrl,
    metadata: source.metadata,
    isActiveOutput: Boolean(source.isActiveOutput),
    health: {
      lastHeartbeatAt: health.lastHeartbeatAt,
      timeoutMs: health.timeoutMs,
      ageMs: health.ageMs,
      isTimedOut: health.isTimedOut,
      latencyMs: health.latencyMs,
      bitrateKbps: health.bitrateKbps,
      droppedFrames: health.droppedFrames,
      note: health.note,
    },
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};

const resolveActiveSource = (event: any) => {
  const sources: any[] = Array.isArray(event.sources) ? event.sources : [];
  return sources.find((source) => source.isActiveOutput) ?? null;
};

const isSourceSwitchSafeForLive = (source: any) => {
  if (!source) return false;
  const health = getSourceHealth(source);
  if (health.effectiveStatus !== LiveSourceStatus.READY) return false;
  return Boolean(source.playbackUrl?.trim());
};

const toPublicEvent = (e: any) => {
  const activeSource = resolveActiveSource(e);
  const effectivePlaybackUrl = pickPlayablePlaybackUrl(e);

  return {
    id: e.id.toString(),
    title: e.title,
    description: e.description,
    thumbnailUrl: e.thumbnailUrl,
    category: e.category,
    status: e.status,
    isPublished: Boolean(e.isPublished),
    visibility: e.visibility ?? (e.isPublished ? LiveVisibility.PUBLIC : LiveVisibility.PRIVATE),
    unlistedSlug: e.unlistedSlug ?? null,
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

const isInfraTransientError = (err: any) => {
  const code = String(err?.code ?? "").toUpperCase();
  const message = String(err?.message ?? "").toUpperCase();
  return (
    code.includes("ETIMEDOUT") ||
    code.includes("ECONNREFUSED") ||
    code.includes("EHOSTUNREACH") ||
    message.includes("ETIMEDOUT") ||
    message.includes("REDIS") ||
    err instanceof Prisma.PrismaClientRustPanicError
  );
};

const logLiveNonFatal = (scope: string, err: any) => {
  console.error(`[live] ${scope} non-fatal error`, {
    message: err?.message,
    code: err?.code,
    name: err?.name,
  });
};

const sendLiveGracefulFallback = (res: Response, scope: string, err: any) => {
  logLiveNonFatal(scope, err);
  if (isInfraTransientError(err)) {
    return res.status(503).json({
      message: "Live Studio is temporarily degraded. Please retry shortly.",
      code: "LIVE_INFRA_DEGRADED",
    });
  }
  return res.status(500).json({ message: "Live operation failed", code: "LIVE_OPERATION_FAILED" });
};

const ensureSourcePlaybackLinkage = async (event: any, playbackUrl: string) => {
  const normalizedPlaybackUrl = playbackUrl.trim();
  if (!normalizedPlaybackUrl) return event;

  await prisma.$transaction(async (tx) => {
    await tx.liveEvent.update({
      where: { id: event.id },
      data: { playbackUrl: normalizedPlaybackUrl },
    });

    const activeSource = resolveActiveSource(event);
    if (activeSource) {
      if (!activeSource.playbackUrl?.trim()) {
        await tx.liveEventSource.update({
          where: { id: activeSource.id },
          data: { playbackUrl: normalizedPlaybackUrl },
        });
      }
      return;
    }

    const fallbackSource = (event.sources ?? [])[0];
    if (fallbackSource) {
      await tx.liveEventSource.updateMany({
        where: { liveEventId: event.id, isActiveOutput: true },
        data: { isActiveOutput: false },
      });
      await tx.liveEventSource.update({
        where: { id: fallbackSource.id },
        data: {
          isActiveOutput: true,
          playbackUrl: fallbackSource.playbackUrl?.trim() ? undefined : normalizedPlaybackUrl,
        },
      });
      return;
    }

    await tx.liveEventSource.create({
      data: {
        liveEventId: event.id,
        type: LiveSourceType.CONTROL_DECK,
        label: "Primary Stream",
        status: LiveSourceStatus.READY,
        playbackUrl: normalizedPlaybackUrl,
        isActiveOutput: true,
      },
    });
  });

  return prisma.liveEvent.findUnique({ where: { id: event.id }, include: liveEventInclude });
};

const ensurePublishCandidatePlayback = async (event: any) => {
  let publishCandidate = event;
  let effectivePlaybackUrl = pickPlayablePlaybackUrl(publishCandidate)?.trim();

  if (!effectivePlaybackUrl && publishCandidate.ivsChannelArn) {
    try {
      const ivsPlaybackUrl = await getIvsChannelPlaybackUrl(publishCandidate.ivsChannelArn);
      if (ivsPlaybackUrl?.trim()) {
        effectivePlaybackUrl = ivsPlaybackUrl.trim();
      }
    } catch (ivsErr: any) {
      console.error("ensurePublishCandidatePlayback describe channel warning", ivsErr);
    }
  }

  if (effectivePlaybackUrl) {
    const linked = await ensureSourcePlaybackLinkage(publishCandidate, effectivePlaybackUrl);
    if (linked) publishCandidate = linked;
  }

  return publishCandidate;
};

export const createLiveEvent = async (req: AuthenticatedRequest, res: Response) => {
  await ensureLiveEventCompatColumns();
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const { title, description, thumbnailUrl, category, scheduledStartAt, visibility } = parsed.data;
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

    const resolvedVisibility = visibility ?? LiveVisibility.PRIVATE;
    const resolvedIsPublished = resolvedVisibility !== LiveVisibility.PRIVATE;

    const createdBase = await prisma.$transaction(async (tx) => {
      const initial = await tx.liveEvent.create({
        data: {
          title,
          description,
          thumbnailUrl,
          category,
          status: LiveEventStatus.SCHEDULED,
          isPublished: resolvedIsPublished,
          visibility: resolvedVisibility,
          ivsChannelArn: ivs?.channelArn ?? null,
          ivsStreamKeyArn: ivs?.streamKeyArn ?? null,
          ivsStreamKeyValue: ivs?.streamKeyValue ?? null,
          ingestEndpoint: ivs?.ingestEndpoint ?? null,
          playbackUrl: ivs?.playbackUrl ?? null,
          scheduledStartAt: scheduledAt,
          createdByUserId: req.user?.userId ?? null,
        },
      });

      if (resolvedVisibility === LiveVisibility.UNLISTED && !initial.unlistedSlug) {
        await ensureUnlistedSlug(tx, initial.id);
      }

      return initial;
    });

    try {
      const created = await prisma.liveEvent.findUniqueOrThrow({ where: { id: createdBase.id }, include: liveEventInclude });
      return res.json({ event: toAdminEvent(created) });
    } catch (fetchErr: any) {
      // Do not fail creation if post-create enrichment/query is degraded.
      logLiveNonFatal("createLiveEvent.postCreateFetch", fetchErr);
      return res.status(201).json({ event: toAdminEvent({ ...createdBase, sources: [] }) });
    }
  } catch (err: any) {
    logLiveNonFatal("createLiveEvent", err);
    return sendLiveGracefulFallback(res, "createLiveEvent", err);
  }
};

export const getLiveEventAdmin = async (req: Request, res: Response) => {
  try {
    await ensureLiveEventCompatColumns();
    const eventId = parseEventId(req.params.id);
    if (!eventId) return res.status(400).json({ message: "Invalid event id" });

    const event = await prisma.liveEvent.findUnique({ where: { id: eventId }, include: liveEventInclude });
    if (!event) return res.status(404).json({ message: "Live event not found" });

    return res.json({ event: toAdminEvent(event) });
  } catch (err: any) {
    return sendLiveGracefulFallback(res, "getLiveEventAdmin", err);
  }
};

export const listLiveEventsAdmin = async (_req: Request, res: Response) => {
  try {
    await ensureLiveEventCompatColumns();
    const events = await prisma.liveEvent.findMany({
      include: liveEventInclude,
      orderBy: [{ createdAt: "desc" }],
      take: 100,
    });

    return res.json({ events: events.map(toAdminEvent) });
  } catch (err: any) {
    logLiveNonFatal("listLiveEventsAdmin", err);

    // Never hard-crash the Admin Live Studio list surface.
    // Return empty-state payload so operators can still access the page while infra/schema issues are being resolved.
    return res.status(200).json({
      events: [],
      degraded: true,
      message: "Live Studio data is temporarily degraded."
    });
  }
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

export const updateLiveEventAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const parsed = adminEventUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId }, include: liveEventInclude });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  // scheduledStartAt validation (allow null to clear)
  let nextScheduled: Date | null | undefined = undefined;
  if (Object.prototype.hasOwnProperty.call(parsed.data, "scheduledStartAt")) {
    const raw = parsed.data.scheduledStartAt;
    if (!raw) {
      nextScheduled = null;
    } else {
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid scheduledStartAt" });
      }
      if (d.getTime() < Date.now() - 60_000) {
        return res.status(400).json({ message: "scheduledStartAt must be in the future" });
      }
      nextScheduled = d;
    }
  }

  let nextVisibility: LiveVisibility | undefined = undefined;
  let nextIsPublished: boolean | undefined = undefined;

  if (parsed.data.visibility) {
    nextVisibility = parsed.data.visibility;
    nextIsPublished = parsed.data.visibility !== LiveVisibility.PRIVATE;

    // If we are moving into a published state, validate publish constraints (playback/url readiness).
    if (nextIsPublished) {
      const publishCandidate = await ensurePublishCandidatePlayback(event);
      const canPublish = canPublishLiveEvent(publishCandidate);
      if (!canPublish) {
        return res.status(409).json({
          message: "Cannot publish event without a playback URL. Configure IVS channel playback or add a source playback URL first.",
          code: "LIVE_EVENT_PUBLISH_BLOCKED",
        });
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedEvent = await tx.liveEvent.update({
      where: { id: eventId },
      data: {
        ...(nextScheduled !== undefined ? { scheduledStartAt: nextScheduled } : {}),
        ...(nextVisibility !== undefined ? { visibility: nextVisibility } : {}),
        ...(nextIsPublished !== undefined ? { isPublished: nextIsPublished } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsed.data, "category")
          ? { category: parsed.data.category ? parsed.data.category.trim() : null }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(parsed.data, "thumbnailUrl") ? { thumbnailUrl: parsed.data.thumbnailUrl } : {}),
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsed.data, "description") ? { description: parsed.data.description } : {}),
      },
    });

    if (updatedEvent.visibility === LiveVisibility.UNLISTED && !updatedEvent.unlistedSlug) {
      await ensureUnlistedSlug(tx, eventId);
    }

    return tx.liveEvent.findUniqueOrThrow({ where: { id: eventId }, include: liveEventInclude });
  });

  return res.json({ event: toAdminEvent(updated) });
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
    let publishCandidate = await ensurePublishCandidatePlayback(event);
    let canPublish = canPublishLiveEvent(publishCandidate);

    if (!canPublish) {
      const hasIvsProvisioning = Boolean(
        publishCandidate.ivsChannelArn ||
          publishCandidate.ivsStreamKeyArn ||
          publishCandidate.ivsStreamKeyValue ||
          publishCandidate.ingestEndpoint,
      );

      if (!hasIvsProvisioning) {
        const safeName = `wanzami-${publishCandidate.title.slice(0, 50).replace(/[^a-zA-Z0-9-_]/g, "-")}-${Date.now()}`;
        try {
          const ivs = await createIvsChannel({ name: safeName });
          publishCandidate = await prisma.liveEvent.update({
            where: { id: eventId },
            data: {
              ivsChannelArn: ivs.channelArn,
              ivsStreamKeyArn: ivs.streamKeyArn,
              ivsStreamKeyValue: ivs.streamKeyValue,
              ingestEndpoint: ivs.ingestEndpoint,
              playbackUrl: ivs.playbackUrl,
            },
            include: liveEventInclude,
          });
          publishCandidate = await ensurePublishCandidatePlayback(publishCandidate);
        } catch (ivsErr: any) {
          console.error("updateLiveEventPublishAdmin ivs provisioning warning", ivsErr);
        }
      }

      canPublish = canPublishLiveEvent(publishCandidate);
    }

    if (!canPublish) {
      return res.status(409).json({
        message: "Cannot publish event without a playback URL. Configure IVS channel playback or add a source playback URL first.",
        code: "LIVE_EVENT_PUBLISH_BLOCKED",
      });
    }
  }

  const nextVisibility = parsed.data.isPublished
    ? (event.visibility === LiveVisibility.UNLISTED ? LiveVisibility.UNLISTED : LiveVisibility.PUBLIC)
    : LiveVisibility.PRIVATE;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedEvent = await tx.liveEvent.update({
      where: { id: eventId },
      data: {
        isPublished: parsed.data.isPublished,
        visibility: nextVisibility,
      },
      include: liveEventInclude,
    });

    if (updatedEvent.visibility === LiveVisibility.UNLISTED && !updatedEvent.unlistedSlug) {
      await ensureUnlistedSlug(tx, eventId);
    }

    return updatedEvent;
  });

  return res.json({ event: toAdminEvent(updated) });
};

export const getLiveEventPublic = async (req: Request, res: Response) => {
  await ensureLiveEventCompatColumns();
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const event = await prisma.liveEvent.findFirst({
    where: {
      id: eventId,
      isPublished: true,
      visibility: LiveVisibility.PUBLIC,
    },
    include: liveEventInclude,
  });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  return res.json({ event: toPublicEvent(event) });
};

export const getLiveEventUnlistedPublic = async (req: Request, res: Response) => {
  await ensureLiveEventCompatColumns();
  const slug = typeof req.params.slug === "string" ? req.params.slug.trim() : "";
  if (!slug) return res.status(400).json({ message: "Invalid unlisted slug" });

  const event = await prisma.liveEvent.findFirst({
    where: {
      unlistedSlug: slug,
      isPublished: true,
      visibility: LiveVisibility.UNLISTED,
    },
    include: liveEventInclude,
  });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  return res.json({ event: toPublicEvent(event) });
};

export const listLiveEventsPublic = async (_req: Request, res: Response) => {
  try {
    await ensureLiveEventCompatColumns();
    const events = await prisma.liveEvent.findMany({
      include: liveEventInclude,
      where: {
        isPublished: true,
        visibility: LiveVisibility.PUBLIC,
        status: { in: [LiveEventStatus.SCHEDULED, LiveEventStatus.LIVE, LiveEventStatus.ENDED] },
      },
      orderBy: [{ status: "asc" }, { scheduledStartAt: "asc" }, { createdAt: "desc" }],
      take: 30,
    });

    return res.json({ events: events.map(toPublicEvent) });
  } catch (err: any) {
    return sendLiveGracefulFallback(res, "listLiveEventsPublic", err);
  }
};

export const startLiveEvent = async (req: Request, res: Response) => {
  try {
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

      if (!isSourceSwitchSafeForLive(selected)) {
        return res.status(409).json({
          message: "Cannot start live with selected source unless it is READY and has a playback URL.",
          code: "LIVE_SOURCE_SWITCH_BLOCKED",
        });
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
  } catch (err: any) {
    return sendLiveGracefulFallback(res, "startLiveEvent", err);
  }
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
  try {
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
  } catch (err: any) {
    return sendLiveGracefulFallback(res, "listLiveEventSourcesAdmin", err);
  }
};

export const registerLiveEventThirdPartySourceAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });

  const parsed = sourceRegisterThirdPartySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  const now = new Date();
  const payloadMeta = parsed.data.metadata ?? {};
  const nextMetadata = {
    ...payloadMeta,
    thirdParty: {
      provider: parsed.data.provider,
      transport: parsed.data.transport,
      sourceKey: parsed.data.sourceKey ?? null,
      ingestUrl: parsed.data.ingestUrl ?? null,
      registeredAt: now.toISOString(),
    },
    health: {
      lastHeartbeatAt: null,
      latencyMs: null,
      bitrateKbps: null,
      droppedFrames: null,
      note: null,
    },
  };

  const shouldActivate = Boolean(parsed.data.makeActive);
  const initialStatus = parsed.data.playbackUrl ? LiveSourceStatus.READY : LiveSourceStatus.OFFLINE;

  if (event.status === LiveEventStatus.LIVE && shouldActivate && !isSourceSwitchSafeForLive({ status: initialStatus, playbackUrl: parsed.data.playbackUrl })) {
    return res.status(409).json({
      message: "Cannot activate a source while live unless it is READY and has a playback URL.",
      code: "LIVE_SOURCE_SWITCH_BLOCKED",
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    if (shouldActivate) {
      await tx.liveEventSource.updateMany({
        where: { liveEventId: eventId, isActiveOutput: true },
        data: { isActiveOutput: false },
      });
    }

    const source = await tx.liveEventSource.create({
      data: {
        liveEventId: eventId,
        type: LiveSourceType.RTMP,
        label: parsed.data.label,
        status: initialStatus,
        playbackUrl: parsed.data.playbackUrl ?? null,
        previewUrl: parsed.data.previewUrl ?? null,
        metadata: nextMetadata,
        isActiveOutput: shouldActivate,
      },
    });

    if (source.playbackUrl && shouldActivate) {
      await tx.liveEvent.update({ where: { id: eventId }, data: { playbackUrl: source.playbackUrl } });
    }

    return source;
  });

  return res.status(201).json({ source: normalizeSourceForResponse(created) });
};

export const heartbeatLiveEventSourceAdmin = async (req: Request, res: Response) => {
  const eventId = parseEventId(req.params.id);
  const sourceId = parseSourceId(req.params.sourceId);
  if (!eventId) return res.status(400).json({ message: "Invalid event id" });
  if (!sourceId) return res.status(400).json({ message: "Invalid source id" });

  const parsed = sourceHeartbeatSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  const source = await prisma.liveEventSource.findUnique({ where: { id: sourceId } });
  if (!source || source.liveEventId !== eventId) {
    return res.status(404).json({ message: "Live source not found" });
  }

  const now = new Date();
  const sourceMeta = (source.metadata as any) ?? {};
  const requestedState = parsed.data.state;
  const nextStatus = requestedState
    ? requestedState === "ERROR"
      ? LiveSourceStatus.DEGRADED
      : (requestedState as LiveSourceStatus)
    : LiveSourceStatus.READY;

  const mergedMetadata = {
    ...sourceMeta,
    health: {
      ...((sourceMeta.health as any) ?? {}),
      lastHeartbeatAt: now.toISOString(),
      latencyMs: parsed.data.latencyMs ?? ((sourceMeta.health as any)?.latencyMs ?? null),
      bitrateKbps: parsed.data.bitrateKbps ?? ((sourceMeta.health as any)?.bitrateKbps ?? null),
      droppedFrames: parsed.data.droppedFrames ?? ((sourceMeta.health as any)?.droppedFrames ?? null),
      note: parsed.data.note ?? ((sourceMeta.health as any)?.note ?? null),
    },
  };

  const updated = await prisma.$transaction(async (tx) => {
    const nextSource = await tx.liveEventSource.update({
      where: { id: sourceId },
      data: {
        status: nextStatus,
        metadata: mergedMetadata,
        playbackUrl: parsed.data.playbackUrl !== undefined ? parsed.data.playbackUrl : source.playbackUrl,
        previewUrl: parsed.data.previewUrl !== undefined ? parsed.data.previewUrl : source.previewUrl,
      },
    });

    if (nextSource.isActiveOutput && nextSource.playbackUrl) {
      await tx.liveEvent.update({
        where: { id: eventId },
        data: { playbackUrl: nextSource.playbackUrl },
      });
    }

    return nextSource;
  });

  return res.json({ source: normalizeSourceForResponse(updated) });
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

  if (
    event.status === LiveEventStatus.LIVE &&
    isActiveOutput &&
    !isSourceSwitchSafeForLive({ status: status ?? LiveSourceStatus.READY, playbackUrl: playbackUrl ?? null })
  ) {
    return res.status(409).json({
      message: "Cannot activate a source while live unless it is READY and has a playback URL.",
      code: "LIVE_SOURCE_SWITCH_BLOCKED",
    });
  }

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

  const event = await prisma.liveEvent.findUnique({ where: { id: eventId } });
  if (!event) return res.status(404).json({ message: "Live event not found" });

  if (parsed.data.isActiveOutput === false && source.isActiveOutput) {
    if (event.status === LiveEventStatus.LIVE) {
      return res.status(409).json({
        message: "Cannot deactivate the active source while event is live. Switch to another source or end stream first.",
        code: "LIVE_SOURCE_DEACTIVATE_BLOCKED",
      });
    }
  }

  if (event.status === LiveEventStatus.LIVE && parsed.data.isActiveOutput) {
    const candidate = {
      status: parsed.data.status ?? source.status,
      playbackUrl: parsed.data.playbackUrl !== undefined ? parsed.data.playbackUrl : source.playbackUrl,
    };

    if (!isSourceSwitchSafeForLive(candidate)) {
      return res.status(409).json({
        message: "Cannot activate a source while live unless it is READY and has a playback URL.",
        code: "LIVE_SOURCE_SWITCH_BLOCKED",
      });
    }
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

  const [event, source] = await Promise.all([
    prisma.liveEvent.findUnique({ where: { id: eventId } }),
    prisma.liveEventSource.findUnique({ where: { id: sourceId } }),
  ]);

  if (!event) {
    return res.status(404).json({ message: "Live event not found" });
  }

  if (!source || source.liveEventId !== eventId) {
    return res.status(404).json({ message: "Live source not found" });
  }

  if (event.status === LiveEventStatus.LIVE && source.isActiveOutput) {
    return res.status(409).json({
      message: "Cannot remove the active source while event is live. Switch source or end stream first.",
      code: "LIVE_SOURCE_DELETE_BLOCKED",
    });
  }

  await prisma.liveEventSource.delete({ where: { id: sourceId } });

  return res.status(204).send();
};

export const switchLiveEventSourceAdmin = async (req: Request, res: Response) => {
  try {
    const eventId = parseEventId(req.params.id);
    if (!eventId) return res.status(400).json({ message: "Invalid event id" });

    const parsed = sourceSwitchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten() });
    }

    const sourceId = parseSourceId(parsed.data.sourceId);
    if (!sourceId) return res.status(400).json({ message: "Invalid source id" });

    const [event, source] = await Promise.all([
      prisma.liveEvent.findUnique({ where: { id: eventId } }),
      prisma.liveEventSource.findUnique({ where: { id: sourceId } }),
    ]);

    if (!event) {
      return res.status(404).json({ message: "Live event not found" });
    }

    if (!source || source.liveEventId !== eventId) {
      return res.status(404).json({ message: "Live source not found" });
    }

    if (event.status === LiveEventStatus.LIVE && !isSourceSwitchSafeForLive(source)) {
      return res.status(409).json({
        message: "Cannot switch to this source while live unless it is READY and has a playback URL.",
        code: "LIVE_SOURCE_SWITCH_BLOCKED",
      });
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

    const refreshedEvent = await prisma.liveEvent.findUnique({ where: { id: eventId }, include: liveEventInclude });
    return res.json({
      eventId: eventId.toString(),
      activeSourceId: sourceId.toString(),
      event: refreshedEvent ? toAdminEvent(refreshedEvent) : null,
    });
  } catch (err: any) {
    return sendLiveGracefulFallback(res, "switchLiveEventSourceAdmin", err);
  }
};



