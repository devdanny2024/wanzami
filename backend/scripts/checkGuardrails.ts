import "dotenv/config";
import { prisma } from "../src/prisma.js";

async function main() {
  const experiment = process.env.AB_EXPERIMENT_KEY || "foryou_v1";
  const windowHours = Number(process.env.GUARDRAIL_WINDOW_HOURS ?? "24");
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000);

  // Exposure counts by variant
  const impressions = await prisma.engagementEvent.findMany({
    where: {
      eventType: "IMPRESSION",
      occurredAt: { gte: since },
      metadata: { path: ["experiment"], equals: experiment },
    },
    select: { metadata: true },
  });

  const exposureByVariant = new Map<string, number>();
  impressions.forEach((imp) => {
    const variant = typeof imp.metadata === "object" && imp.metadata !== null
      ? ((imp.metadata as any).variant as string) || "unknown"
      : "unknown";
    exposureByVariant.set(variant, (exposureByVariant.get(variant) ?? 0) + 1);
  });

  // Completion guardrail (overall)
  const playEnds = await prisma.engagementEvent.findMany({
    where: {
      eventType: "PLAY_END",
      occurredAt: { gte: since },
    },
    select: { metadata: true },
  });
  let completionSum = 0;
  let completionCount = 0;
  playEnds.forEach((e) => {
    const pct = typeof e.metadata === "object" && e.metadata !== null
      ? Number((e.metadata as any).completionPercent ?? (e.metadata as any).completion ?? 1)
      : 1;
    if (!Number.isNaN(pct)) {
      completionSum += Math.max(0, Math.min(1, pct));
      completionCount += 1;
    }
  });
  const avgCompletion = completionCount ? completionSum / completionCount : 0;

  const skips = await prisma.engagementEvent.count({
    where: { eventType: "SKIP", occurredAt: { gte: since } },
  });

  console.log(`Guardrails for experiment=${experiment} window=${windowHours}h since ${since.toISOString()}`);
  console.log("Exposure by variant:", Object.fromEntries(exposureByVariant));
  console.log(`Average completion (all play_end): ${(avgCompletion * 100).toFixed(2)}% over ${completionCount} events`);
  console.log(`Skip count: ${skips}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
