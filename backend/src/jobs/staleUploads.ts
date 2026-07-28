import { prisma } from "../prisma.js";

// An upload that has gone quiet is not an upload in progress, it is an
// abandoned one. The admin client PATCHes progress continuously while a
// transfer is alive, so a row untouched for hours means the tab was closed,
// the machine slept, or the transfer died. Left alone these rows sit in
// UPLOADING forever and keep the transfer dock pinned over the whole admin.
//
// Runs on a cron (see worker/cron.ts). Safe to run repeatedly: it only touches
// rows whose quiet period has already elapsed.
const STALE_AFTER_MS = Number(process.env.UPLOAD_STALE_AFTER_MS ?? 6 * 60 * 60 * 1000);

export async function failStaleUploads() {
  const cutoff = new Date(Date.now() - STALE_AFTER_MS);

  const result = await prisma.uploadJob.updateMany({
    where: {
      status: { in: ["PENDING", "UPLOADING"] },
      updatedAt: { lt: cutoff },
    },
    data: {
      status: "FAILED",
      error: "Upload abandoned: no progress reported before the transfer timed out.",
    },
  });

  return { failed: result.count };
}
