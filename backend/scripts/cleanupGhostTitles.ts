import { prisma } from "../src/prisma.js";

async function main() {
  // Collect titleIds that are referenced anywhere in user-facing data so we
  // never delete a title that might appear in recs, history, or snapshots.
  const referencedIds = new Set<bigint>();

  // 1) Popularity snapshots
  const snapshots = await prisma.popularitySnapshot.findMany();
  for (const snap of snapshots) {
    const items = Array.isArray(snap.items) ? (snap.items as any[]) : [];
    for (const item of items) {
      const raw = (item as any)?.titleId;
      if (raw == null) continue;
      try {
        referencedIds.add(BigInt(raw));
      } catch {
        // ignore malformed ids
      }
    }
  }

  // 2) Recent views
  const recentViews = await prisma.profileRecentViews.findMany();
  for (const rv of recentViews) {
    for (const id of rv.titleIds ?? []) {
      referencedIds.add(id);
    }
  }

  // 3) Engagement events
  const eventTitles = await prisma.engagementEvent.findMany({
    where: { titleId: { not: null } },
    select: { titleId: true },
    distinct: ["titleId"],
  });
  for (const e of eventTitles) {
    if (e.titleId) referencedIds.add(e.titleId);
  }

  // 4) Titles used in similarity graph
  const similarityTitles = await prisma.titleSimilarity.findMany({
    select: { sourceTitleId: true, targetTitleId: true },
  });
  for (const s of similarityTitles) {
    referencedIds.add(s.sourceTitleId);
    referencedIds.add(s.targetTitleId);
  }

  const allTitles = await prisma.title.findMany({
    select: { id: true },
  });

  const ghosts: bigint[] = [];

  for (const t of allTitles) {
    const id = t.id;
    // Never treat referenced titles as ghosts.
    if (referencedIds.has(id)) continue;

    const [episodeCount, assetCount, eventCount] = await Promise.all([
      prisma.episode.count({ where: { titleId: id } }),
      prisma.assetVersion.count({ where: { titleId: id } }),
      prisma.engagementEvent.count({ where: { titleId: id } }),
    ]);

    if (episodeCount === 0 && assetCount === 0 && eventCount === 0) {
      ghosts.push(id);
    }
  }

  if (!ghosts.length) {
    console.log("No ghost titles detected; nothing to delete.");
    return;
  }

  console.log(
    `Deleting ${ghosts.length} ghost title(s):`,
    ghosts.map((id) => id.toString())
  );

  await prisma.title.deleteMany({
    where: { id: { in: ghosts } },
  });

  console.log("Ghost titles deleted.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

