import { PrismaClient, TitleType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const referencedIds = new Set<bigint>();

  // 1) From popularity snapshots (items: [{ titleId }])
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

  // 2) From recent views snapshots (titleIds: BigInt[])
  const recentViews = await prisma.profileRecentViews.findMany();
  for (const rv of recentViews) {
    for (const id of rv.titleIds ?? []) {
      referencedIds.add(id);
    }
  }

  // 3) From engagement events (titles that have ever been played)
  const eventTitles = await prisma.engagementEvent.findMany({
    where: { titleId: { not: null } },
    select: { titleId: true },
    distinct: ["titleId"],
  });
  for (const e of eventTitles) {
    if (e.titleId) referencedIds.add(e.titleId);
  }

  const ids = Array.from(referencedIds);
  if (!ids.length) {
    console.log("No referenced titleIds found; nothing to do.");
    return;
  }

  const existing = await prisma.title.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  const existingSet = new Set(existing.map((t) => t.id.toString()));

  const ghosts = ids.filter((id) => !existingSet.has(id.toString()));
  if (!ghosts.length) {
    console.log("No ghost titles detected. All referenced ids exist in Title.");
    return;
  }

  console.log(`Creating ${ghosts.length} ghost title(s):`, ghosts.map((id) => id.toString()));

  for (const id of ghosts) {
    const name = `Title ${id.toString()}`;
    const placeholderPoster = `https://placehold.co/600x900/111111/FD7E14?text=${encodeURIComponent(
      name,
    )}`;
    const placeholderThumb = `https://placehold.co/640x360/111111/FD7E14?text=${encodeURIComponent(
      name,
    )}`;

    await prisma.title.create({
      data: {
        id,
        type: TitleType.MOVIE,
        name,
        description: "Autocreated placeholder for referenced title id.",
        maturityRating: "PG",
        runtimeMinutes: 120,
        countryAvailability: [],
        isOriginal: false,
        posterUrl: placeholderPoster,
        thumbnailUrl: placeholderThumb,
      },
    });
  }

  console.log("Done creating ghost titles.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

