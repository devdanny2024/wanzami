import test from "node:test";
import assert from "node:assert/strict";
import { LiveEventStatus } from "@prisma/client";
import { deleteLiveEventAdmin } from "./liveController.js";
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

test("deleteLiveEventAdmin returns 400 for invalid event id", async () => {
  const req: any = { params: { id: "abc" } };
  const res = createMockResponse();

  await deleteLiveEventAdmin(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { message: "Invalid event id" });
});

test("deleteLiveEventAdmin returns 404 when event does not exist", async () => {
  const originalFindUnique = prisma.liveEvent.findUnique;
  (prisma.liveEvent as any).findUnique = async () => null;

  const req: any = { params: { id: "999" } };
  const res = createMockResponse();

  try {
    await deleteLiveEventAdmin(req, res);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: "Live event not found" });
  } finally {
    (prisma.liveEvent as any).findUnique = originalFindUnique;
  }
});

test("deleteLiveEventAdmin returns 409 when event is live", async () => {
  const originalFindUnique = prisma.liveEvent.findUnique;
  (prisma.liveEvent as any).findUnique = async () => ({ id: BigInt(3), status: LiveEventStatus.LIVE });

  const req: any = { params: { id: "3" } };
  const res = createMockResponse();

  try {
    await deleteLiveEventAdmin(req, res);
    assert.equal(res.statusCode, 409);
    assert.deepEqual(res.body, {
      message: "Cannot delete a live event. End it first before deleting.",
      code: "LIVE_EVENT_DELETE_BLOCKED",
    });
  } finally {
    (prisma.liveEvent as any).findUnique = originalFindUnique;
  }
});

test("deleteLiveEventAdmin deletes and returns success", async () => {
  const originalFindUnique = prisma.liveEvent.findUnique;
  const originalDelete = prisma.liveEvent.delete;
  (prisma.liveEvent as any).findUnique = async () => ({ id: BigInt(1), status: LiveEventStatus.ENDED });
  (prisma.liveEvent as any).delete = async () => ({ id: BigInt(1) });

  const req: any = { params: { id: "1" } };
  const res = createMockResponse();

  try {
    await deleteLiveEventAdmin(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { message: "Live event deleted" });
  } finally {
    (prisma.liveEvent as any).findUnique = originalFindUnique;
    (prisma.liveEvent as any).delete = originalDelete;
  }
});
