import { prisma } from "../src/prisma.js";

async function main() {
  const profileId = BigInt(35);

  const events = await prisma.engagementEvent.findMany({
    where: { profileId, eventType: "PLAY_END", titleId: { not: null } },
    orderBy: { occurredAt: "desc" },
    take: 50,
  });

  const seen = new Set<bigint>();
  const candidates: Array<{ titleId: bigint; completion: number }> = [];

  for (const e of events) {
    if (!e.titleId) continue;
    if (seen.has(e.titleId)) continue;
    const metadata =
      typeof e.metadata === "object" && e.metadata !== null ? (e.metadata as any) : {};
    let completion = Number(
      typeof metadata.completionPercent === "number"
        ? metadata.completionPercent
        : typeof metadata.completion === "number"
          ? metadata.completion
          : NaN,
    );
    if (Number.isNaN(completion)) {
      const pos = Number(metadata.positionSec);
      const dur = Number(metadata.durationSec);
      if (Number.isFinite(pos) && Number.isFinite(dur) && dur > 0) {
        completion = Math.max(0, Math.min(1, pos / dur));
      }
    }
    if (!Number.isFinite(completion) || completion <= 0) continue;
    seen.add(e.titleId);
    candidates.push({ titleId: e.titleId, completion });
  }

  console.log("Candidates:", candidates.map((c) => ({
    titleId: c.titleId.toString(),
    completion: c.completion,
  })));

  if (!candidates.length) {
    console.log("No candidates found.");
    return;
  }

  const titles = await prisma.title.findMany({
    where: { id: { in: candidates.map((c) => c.titleId) } },
  });

  console.log(
    "Titles:",
    titles.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      type: t.type,
      archived: t.archived,
    })),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

