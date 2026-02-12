import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
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
  const originalDelete = prisma.liveEvent.delete;
  (prisma.liveEvent as any).delete = async () => {
    throw new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "test",
    });
  };

  const req: any = { params: { id: "999" } };
  const res = createMockResponse();

  try {
    await deleteLiveEventAdmin(req, res);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: "Live event not found" });
  } finally {
    (prisma.liveEvent as any).delete = originalDelete;
  }
});

test("deleteLiveEventAdmin deletes and returns success", async () => {
  const originalDelete = prisma.liveEvent.delete;
  (prisma.liveEvent as any).delete = async () => ({ id: BigInt(1) });

  const req: any = { params: { id: "1" } };
  const res = createMockResponse();

  try {
    await deleteLiveEventAdmin(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { message: "Live event deleted" });
  } finally {
    (prisma.liveEvent as any).delete = originalDelete;
  }
});
