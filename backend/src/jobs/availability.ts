import { prisma } from "../prisma.js";

// Auto-flips title availability based on the scheduled dates set in admin:
//  - COMING_SOON  -> LIVE        once `availableFrom` has passed
//  - LEAVING_SOON -> archived    once `leavingAt` has passed
// Runs on a cron (see worker/cron.ts). Safe to run repeatedly — it only
// touches rows whose date threshold has been crossed.
export async function processAvailabilityTransitions() {
  const now = new Date();

  const wentLive = await prisma.title.updateMany({
    where: {
      availability: "COMING_SOON",
      availableFrom: { not: null, lte: now },
    },
    data: { availability: "LIVE", availableFrom: null },
  });

  const left = await prisma.title.updateMany({
    where: {
      availability: "LEAVING_SOON",
      leavingAt: { not: null, lte: now },
    },
    data: { archived: true, leavingAt: null },
  });

  return { wentLive: wentLive.count, removed: left.count };
}
