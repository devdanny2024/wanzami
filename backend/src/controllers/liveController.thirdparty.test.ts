import test from "node:test";
import assert from "node:assert/strict";
import { LiveEventStatus, LiveSourceStatus } from "@prisma/client";
import { heartbeatLiveEventSourceAdmin, registerLiveEventThirdPartySourceAdmin } from "./liveController.js";
import { prisma } from "../prisma.js";

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

test("registerLiveEventThirdPartySourceAdmin registers source with third-party metadata", async () => {
  const originalEventFindUnique = prisma.liveEvent.findUnique;
  const originalTransaction = prisma.$transaction;

  (prisma.liveEvent as any).findUnique = async () => ({ id: BigInt(42), status: LiveEventStatus.SCHEDULED });

  (prisma.$transaction as any) = async (fn: any) => {
    const tx = {
      liveEventSource: {
        updateMany: async () => ({ count: 0 }),
        create: async ({ data }: any) => ({
          id: BigInt(10),
          liveEventId: BigInt(42),
          type: data.type,
          label: data.label,
          status: data.status,
          playbackUrl: data.playbackUrl,
          previewUrl: data.previewUrl,
          metadata: data.metadata,
          isActiveOutput: data.isActiveOutput,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      liveEvent: {
        update: async () => ({ id: BigInt(42) }),
      },
    };
    return fn(tx);
  };

  const req: any = {
    params: { id: "42" },
    body: {
      label: "Streamyard A",
      provider: "streamyard",
      transport: "RTMP_PUSH",
      sourceKey: "streamyard-main",
      playbackUrl: "https://example.com/live.m3u8",
      makeActive: true,
    },
  };
  const res = createMockResponse();

  try {
    await registerLiveEventThirdPartySourceAdmin(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal((res.body as any)?.source?.label, "Streamyard A");
    assert.equal((res.body as any)?.source?.status, LiveSourceStatus.READY);
    assert.equal((res.body as any)?.source?.metadata?.thirdParty?.provider, "streamyard");
    assert.equal((res.body as any)?.source?.metadata?.thirdParty?.sourceKey, "streamyard-main");
  } finally {
    (prisma.liveEvent as any).findUnique = originalEventFindUnique;
    (prisma as any).$transaction = originalTransaction;
  }
});

test("heartbeatLiveEventSourceAdmin updates health metadata and status", async () => {
  const originalSourceFindUnique = prisma.liveEventSource.findUnique;
  const originalTransaction = prisma.$transaction;

  (prisma.liveEventSource as any).findUnique = async () => ({
    id: BigInt(10),
    liveEventId: BigInt(42),
    isActiveOutput: true,
    status: LiveSourceStatus.OFFLINE,
    playbackUrl: null,
    previewUrl: null,
    metadata: { health: {} },
  });

  (prisma.$transaction as any) = async (fn: any) => {
    const tx = {
      liveEventSource: {
        update: async ({ data }: any) => ({
          id: BigInt(10),
          liveEventId: BigInt(42),
          type: "RTMP",
          label: "A",
          status: data.status,
          playbackUrl: data.playbackUrl,
          previewUrl: data.previewUrl,
          metadata: data.metadata,
          isActiveOutput: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      liveEvent: {
        update: async () => ({ id: BigInt(42) }),
      },
    };
    return fn(tx);
  };

  const req: any = {
    params: { id: "42", sourceId: "10" },
    body: {
      state: "READY",
      latencyMs: 320,
      bitrateKbps: 2100,
      droppedFrames: 3,
      playbackUrl: "https://example.com/a.m3u8",
    },
  };
  const res = createMockResponse();

  try {
    await heartbeatLiveEventSourceAdmin(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal((res.body as any)?.source?.status, LiveSourceStatus.READY);
    assert.equal((res.body as any)?.source?.health?.latencyMs, 320);
    assert.equal((res.body as any)?.source?.health?.bitrateKbps, 2100);
    assert.ok((res.body as any)?.source?.health?.lastHeartbeatAt);
  } finally {
    (prisma.liveEventSource as any).findUnique = originalSourceFindUnique;
    (prisma as any).$transaction = originalTransaction;
  }
});

test("heartbeatLiveEventSourceAdmin maps legacy ERROR state to DEGRADED", async () => {
  const originalSourceFindUnique = prisma.liveEventSource.findUnique;
  const originalTransaction = prisma.$transaction;

  (prisma.liveEventSource as any).findUnique = async () => ({
    id: BigInt(12),
    liveEventId: BigInt(42),
    isActiveOutput: false,
    status: LiveSourceStatus.READY,
    playbackUrl: "https://example.com/x.m3u8",
    previewUrl: null,
    metadata: { health: {} },
  });

  (prisma.$transaction as any) = async (fn: any) => {
    const tx = {
      liveEventSource: {
        update: async ({ data }: any) => ({
          id: BigInt(12),
          liveEventId: BigInt(42),
          type: "RTMP",
          label: "B",
          status: data.status,
          playbackUrl: data.playbackUrl,
          previewUrl: data.previewUrl,
          metadata: data.metadata,
          isActiveOutput: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      liveEvent: {
        update: async () => ({ id: BigInt(42) }),
      },
    };
    return fn(tx);
  };

  const req: any = {
    params: { id: "42", sourceId: "12" },
    body: {
      state: "ERROR",
      note: "encoder dropped keyframes",
    },
  };
  const res = createMockResponse();

  try {
    await heartbeatLiveEventSourceAdmin(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal((res.body as any)?.source?.status, LiveSourceStatus.DEGRADED);
    assert.equal((res.body as any)?.source?.reportedStatus, LiveSourceStatus.DEGRADED);
  } finally {
    (prisma.liveEventSource as any).findUnique = originalSourceFindUnique;
    (prisma as any).$transaction = originalTransaction;
  }
});
