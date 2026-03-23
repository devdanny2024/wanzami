import test from "node:test";
import assert from "node:assert/strict";
import { LiveSourceStatus } from "@prisma/client";
import { listLiveEventSourcesAdmin } from "./liveController.js";
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

test("listLiveEventSourcesAdmin marks stale heartbeat source as OFFLINE in response", async () => {
  const originalEventFindUnique = prisma.liveEvent.findUnique;

  const staleHeartbeat = new Date(Date.now() - 5 * 60_000).toISOString();

  (prisma.liveEvent as any).findUnique = async () => ({
    id: BigInt(42),
    sources: [
      {
        id: BigInt(10),
        liveEventId: BigInt(42),
        type: "RTMP",
        label: "Third-party source",
        status: LiveSourceStatus.READY,
        playbackUrl: "https://example.com/live.m3u8",
        previewUrl: null,
        metadata: { health: { lastHeartbeatAt: staleHeartbeat } },
        isActiveOutput: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  const req: any = { params: { id: "42" } };
  const res = createMockResponse();

  try {
    await listLiveEventSourcesAdmin(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal((res.body as any)?.sources?.[0]?.status, LiveSourceStatus.OFFLINE);
    assert.equal((res.body as any)?.sources?.[0]?.reportedStatus, LiveSourceStatus.READY);
    assert.equal((res.body as any)?.sources?.[0]?.health?.isTimedOut, true);
  } finally {
    (prisma.liveEvent as any).findUnique = originalEventFindUnique;
  }
});

test("listLiveEventSourcesAdmin marks aging heartbeat source as DEGRADED before timeout", async () => {
  const originalEventFindUnique = prisma.liveEvent.findUnique;

  const degradedHeartbeat = new Date(Date.now() - 30_000).toISOString();

  (prisma.liveEvent as any).findUnique = async () => ({
    id: BigInt(42),
    sources: [
      {
        id: BigInt(11),
        liveEventId: BigInt(42),
        type: "RTMP",
        label: "Backup source",
        status: LiveSourceStatus.READY,
        playbackUrl: "https://example.com/backup.m3u8",
        previewUrl: null,
        metadata: { health: { lastHeartbeatAt: degradedHeartbeat } },
        isActiveOutput: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });

  const req: any = { params: { id: "42" } };
  const res = createMockResponse();

  try {
    await listLiveEventSourcesAdmin(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal((res.body as any)?.sources?.[0]?.status, LiveSourceStatus.DEGRADED);
    assert.equal((res.body as any)?.sources?.[0]?.reportedStatus, LiveSourceStatus.READY);
    assert.equal((res.body as any)?.sources?.[0]?.health?.isTimedOut, false);
  } finally {
    (prisma.liveEvent as any).findUnique = originalEventFindUnique;
  }
});
