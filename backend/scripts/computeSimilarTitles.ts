import "dotenv/config";
import { prisma } from "../src/prisma.js";

const WINDOW_DAYS = Number(process.env.SIMILARITY_WINDOW_DAYS ?? "60");
const MAX_ANCHORS = Number(process.env.SIMILARITY_MAX_ANCHORS ?? "1000");
const MAX_SIMILARS = Number(process.env.SIMILARITY_MAX_SIMILARS ?? "20");

async function main() {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  // Pull recent play_end + thumbs_up as positive signals
  const events = await prisma.engagementEvent.findMany({
    where: {
      eventType: { in: ["PLAY_END", "THUMBS_UP"] },
      occurredAt: { gte: since },
      titleId: { not: null },
      profileId: { not: null },
    },
    select: { profileId: true, titleId: true },
    orderBy: { occurredAt: "desc" },
    take: 50000, // cap to keep the job cheap
  });

  const perProfile = new Map<bigint, bigint[]>();
  for (const e of events) {
    if (!e.profileId || !e.titleId) continue;
    const list = perProfile.get(e.profileId) ?? [];
    list.push(e.titleId);
    perProfile.set(e.profileId, list);
  }

  const coCounts = new Map<string, number>();
  for (const titles of perProfile.values()) {
    const unique = Array.from(new Set(titles)).slice(0, 50); // avoid huge carts
    for (let i = 0; i < unique.length; i++) {
      for (let j = 0; j < unique.length; j++) {
        if (i === j) continue;
        const key = `${unique[i].toString()}::${unique[j].toString()}`;
        coCounts.set(key, (coCounts.get(key) ?? 0) + 1);
      }
    }
  }

  // Normalize by outgoing counts
  const outgoing = new Map<string, number>();
  coCounts.forEach((count, key) => {
    const [a] = key.split("::");
    outgoing.set(a, (outgoing.get(a) ?? 0) + count);
  });

  const pairs: Array<{ source: bigint; target: bigint; score: number }> = [];
  coCounts.forEach((count, key) => {
    const [a, b] = key.split("::");
    const denom = outgoing.get(a) ?? 1;
    pairs.push({ source: BigInt(a), target: BigInt(b), score: count / denom });
  });

  // Limit anchors
  const anchors = Array.from(
    new Set(pairs.map((p) => p.source)),
  ).slice(0, MAX_ANCHORS);

  console.log(
    `Computed co-watch pairs for ${anchors.length} anchors from ${events.length} events since ${since.toISOString()}`,
  );

  for (const anchor of anchors) {
    const candidates = pairs
      .filter((p) => p.source === anchor && p.target !== anchor)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SIMILARS);

    if (!candidates.length) continue;
    await prisma.$transaction([
      prisma.titleSimilarity.deleteMany({ where: { sourceTitleId: anchor } }),
      prisma.titleSimilarity.createMany({
        data: candidates.map((c) => ({
          sourceTitleId: c.source,
          targetTitleId: c.target,
          score: c.score,
          rationale: "co_watch",
        })),
      }),
    ]);
  }

  console.log("Similarities persisted");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
