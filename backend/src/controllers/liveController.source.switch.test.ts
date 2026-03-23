import test from "node:test";
import assert from "node:assert/strict";
import { LiveEventStatus, LiveSourceStatus } from "@prisma/client";
import { switchLiveEventSourceAdmin } from "./liveController.js";
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

test("switchLiveEventSourceAdmin blocks switch to non-playable source while live", async () => {
  const originalEventFindUnique = prisma.liveEvent.findUnique;
  const originalSourceFindUnique = prisma.liveEventSource.findUnique;

  (prisma.liveEvent as any).findUnique = async () => ({
    id: BigInt(42),
    status: LiveEventStatus.LIVE,
  });

  (prisma.liveEventSource as any).findUnique = async () => ({
    id: BigInt(10),
    liveEventId: BigInt(42),
    status: LiveSourceStatus.OFFLINE,
    playbackUrl: null,
  });

  const req: any = {
    params: { id: "42" },
    body: { sourceId: "10" },
  };
  const res = createMockResponse();

  try {
    await switchLiveEventSourceAdmin(req, res);
    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
      message: "Cannot switch to this source while live unless it is READY and has a playback URL.",
      code: "LIVE_SOURCE_SWITCH_BLOCKED",
    });
  } finally {
    (prisma.liveEvent as any).findUnique = originalEventFindUnique;
    (prisma.liveEventSource as any).findUnique = originalSourceFindUnique;
  }
});
