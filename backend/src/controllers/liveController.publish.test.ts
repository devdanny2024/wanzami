import test from "node:test";
import assert from "node:assert/strict";
import { LiveEventStatus, LiveSourceStatus, LiveSourceType } from "@prisma/client";
import { prisma } from "../prisma.js";
import { updateLiveEventPublishAdmin } from "./liveController.js";

const createMockResponse = () => {
  const response: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response;
};

test("updateLiveEventPublishAdmin links playback to a source before publish", async () => {
  const originalFindUnique = prisma.liveEvent.findUnique;
  const originalLiveEventUpdate = prisma.liveEvent.update;
  const originalTransaction = prisma.$transaction;

  const eventId = BigInt(42);
  const sourceId = BigInt(501);

  const eventState: any = {
    id: eventId,
    title: "Creator Camera Session",
    description: null,
    thumbnailUrl: null,
    status: LiveEventStatus.SCHEDULED,
    isPublished: false,
    playbackUrl: "https://example.com/live.m3u8",
    ingestEndpoint: "rtmps://example.com/app",
    ivsChannelArn: null,
    ivsStreamKeyArn: null,
    ivsStreamKeyValue: "key",
    scheduledStartAt: null,
    createdAt: new Date(),
    startedAt: null,
    endedAt: null,
    viewerCount: 0,
    replayStatus: "NONE",
    replayPlaybackUrl: null,
    replayAssetId: null,
    replayReadyAt: null,
    replayNote: null,
    sources: [] as any[],
  };

  (prisma.liveEvent as any).findUnique = async () => ({ ...eventState, sources: [...eventState.sources] });

  (prisma.$transaction as any) = async (fn: any) => {
    const tx = {
      liveEvent: {
        update: async ({ data }: any) => {
          Object.assign(eventState, data);
          return { ...eventState };
        },
      },
      liveEventSource: {
        updateMany: async () => ({ count: 0 }),
        update: async ({ where, data }: any) => {
          const idx = eventState.sources.findIndex((source: any) => source.id === where.id);
          if (idx >= 0) {
            eventState.sources[idx] = { ...eventState.sources[idx], ...data };
          }
          return { ...eventState.sources[idx] };
        },
        create: async ({ data }: any) => {
          const created = {
            id: sourceId,
            liveEventId: eventId,
            type: data.type ?? LiveSourceType.CONTROL_DECK,
            label: data.label,
            status: data.status ?? LiveSourceStatus.READY,
            playbackUrl: data.playbackUrl ?? null,
            previewUrl: data.previewUrl ?? null,
            metadata: data.metadata ?? null,
            isActiveOutput: data.isActiveOutput ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          eventState.sources.push(created);
          return created;
        },
      },
    };

    return fn(tx);
  };

  (prisma.liveEvent as any).update = async ({ data }: any) => {
    Object.assign(eventState, data);
    return { ...eventState, sources: [...eventState.sources] };
  };

  const req: any = {
    params: { id: "42" },
    body: { isPublished: true },
  };
  const res = createMockResponse();

  try {
    await updateLiveEventPublishAdmin(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(eventState.isPublished, true);
    assert.equal(eventState.sources.length, 1);
    assert.equal(eventState.sources[0].isActiveOutput, true);
    assert.equal(eventState.sources[0].playbackUrl, "https://example.com/live.m3u8");
  } finally {
    (prisma.liveEvent as any).findUnique = originalFindUnique;
    (prisma.liveEvent as any).update = originalLiveEventUpdate;
    (prisma as any).$transaction = originalTransaction;
  }
});
