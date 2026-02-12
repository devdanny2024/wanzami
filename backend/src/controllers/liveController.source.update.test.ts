import test from "node:test";
import assert from "node:assert/strict";
import { LiveEventStatus } from "@prisma/client";
import { updateLiveEventSourceAdmin } from "./liveController.js";
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

test("updateLiveEventSourceAdmin returns 409 when deactivating active source on live event", async () => {
  const originalSourceFindUnique = prisma.liveEventSource.findUnique;
  const originalEventFindUnique = prisma.liveEvent.findUnique;

  (prisma.liveEventSource as any).findUnique = async () => ({
    id: BigInt(10),
    liveEventId: BigInt(42),
    isActiveOutput: true,
  });

  (prisma.liveEvent as any).findUnique = async () => ({
    id: BigInt(42),
    status: LiveEventStatus.LIVE,
  });

  const req: any = {
    params: { id: "42", sourceId: "10" },
    body: { isActiveOutput: false },
  };
  const res = createMockResponse();

  try {
    await updateLiveEventSourceAdmin(req, res);
    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
      message: "Cannot deactivate the active source while event is live. Switch to another source or end stream first.",
      code: "LIVE_SOURCE_DEACTIVATE_BLOCKED",
    });
  } finally {
    (prisma.liveEventSource as any).findUnique = originalSourceFindUnique;
    (prisma.liveEvent as any).findUnique = originalEventFindUnique;
  }
});
