import { prisma } from "../prisma.js";

type ErrorContext = {
  path?: string;
  userId?: bigint | string;
  context?: Record<string, any>;
};

export async function recordError(err: any, meta: ErrorContext = {}) {
  try {
    const message = err?.message ?? "Unknown error";
    const stack = err?.stack ?? undefined;
    await prisma.errorLog.create({
      data: {
        level: "ERROR",
        message: String(message),
        stack,
        path: meta.path,
        userId: meta.userId ? BigInt(meta.userId) : undefined,
        context: meta.context ?? undefined,
      },
    });
  } catch (logErr) {
    // Fallback to console if DB logging fails
    console.error("Failed to record error", logErr);
  }
}
