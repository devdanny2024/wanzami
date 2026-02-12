import test from "node:test";
import assert from "node:assert/strict";
import { LiveEventStatus } from "@prisma/client";
import { deleteLiveEventSourceAdmin } from "./liveController.js";
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
    send(payload?: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response;
};

test("deleteLiveEventSourceAdmin returns 409 when deleting active source on live event", async () => {
  const originalEventFindUnique = prisma.liveEvent.findUnique;
  const originalSourceFindUnique = prisma.liveEventSource.findUnique;

  (prisma.liveEvent as any).findUnique = async () => ({ id: BigInt(42), status: LiveEventStatus.LIVE });
  (prisma.liveEventSource as any).findUnique = async () => ({
    id: BigInt(10),
    liveEventId: BigInt(42),
    isActiveOutput: true,
  });

  const req: any = { params: { id: "42", sourceId: "10" } };
  const res = createMockResponse();

  try {
    await deleteLiveEventSourceAdmin(req, res);
    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
      message: "Cannot remove the active source while event is live. Switch source or end stream first.",
      code: "LIVE_SOURCE_DELETE_BLOCKED",
    });
  } finally {
    (prisma.liveEvent as any).findUnique = originalEventFindUnique;
    (prisma.liveEventSource as any).findUnique = originalSourceFindUnique;
  }
});

test("deleteLiveEventSourceAdmin deletes non-active source while live", async () => {
  const originalEventFindUnique = prisma.liveEvent.findUnique;
  const originalSourceFindUnique = prisma.liveEventSource.findUnique;
  const originalDelete = prisma.liveEventSource.delete;
  let deletedId: bigint | null = null;

  (prisma.liveEvent as any).findUnique = async () => ({ id: BigInt(42), status: LiveEventStatus.LIVE });
  (prisma.liveEventSource as any).findUnique = async () => ({
    id: BigInt(11),
    liveEventId: BigInt(42),
    isActiveOutput: false,
  });
  (prisma.liveEventSource as any).delete = async ({ where }: any) => {
    deletedId = where.id;
    return { id: where.id };
  };

  const req: any = { params: { id: "42", sourceId: "11" } };
  const res = createMockResponse();

  try {
    await deleteLiveEventSourceAdmin(req, res);
    assert.equal(res.statusCode, 204);
    assert.equal(deletedId, BigInt(11));
  } finally {
    (prisma.liveEvent as any).findUnique = originalEventFindUnique;
    (prisma.liveEventSource as any).findUnique = originalSourceFindUnique;
    (prisma.liveEventSource as any).delete = originalDelete;
  }
});
