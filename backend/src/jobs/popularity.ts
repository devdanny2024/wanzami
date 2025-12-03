import { prisma } from "../prisma.js";

const WINDOWS = [
  { label: "DAILY" as const, hours: 24 },
  { label: "TRENDING" as const, hours: 72 },
];

const EVENT_TYPES: ("PLAY_START" | "PLAY_END")[] = ["PLAY_START", "PLAY_END"];

export async function computePopularitySnapshots() {
  for (const w of WINDOWS) {
    await computeWindow(w.label, w.hours, "MOVIE");
    await computeWindow(w.label, w.hours, "SERIES");
  }
}

async function computeWindow(windowLabel: "DAILY" | "TRENDING", hours: number, type: "MOVIE" | "SERIES") {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const rows = await prisma.engagementEvent.groupBy({
    by: ["country", "titleId"],
    where: {
      occurredAt: { gte: since },
      eventType: { in: EVENT_TYPES },
      titleId: { not: null },
      title: { type, archived: false },
    },
    _count: { _all: true },
  });

  // Fetch title availability once to enforce country correctness
  const uniqueTitleIds = Array.from(
    new Set(rows.map((r) => r.titleId).filter(Boolean) as bigint[]),
  );
  const titles = await prisma.title.findMany({
    where: { id: { in: uniqueTitleIds } },
    select: { id: true, countryAvailability: true, archived: true },
  });
  const titleMap = new Map<string, { countryAvailability: string[]; archived: boolean }>();
  titles.forEach((t) =>
    titleMap.set(t.id.toString(), {
      countryAvailability: t.countryAvailability ?? [],
      archived: t.archived,
    }),
  );

  const byCountry = new Map<string, { titleId: string; count: number }[]>();
  for (const row of rows) {
    const country = row.country ?? "UNKNOWN";
    if (!row.titleId) continue;
    const list = byCountry.get(country) ?? [];
    const count =
      typeof row._count === "object" && row._count && "_all" in row._count
        ? (row._count as any)._all
        : 0;
    list.push({ titleId: row.titleId.toString(), count });
    byCountry.set(country, list);
  }

  for (const [country, list] of byCountry.entries()) {
    // Respect country availability; default allow if availability is empty
    const filtered = list.filter((entry) => {
      const t = titleMap.get(entry.titleId);
      if (!t || t.archived) return false;
      const availability = t.countryAvailability ?? [];
      return availability.length === 0 || availability.includes(country);
    });

    const top10 = filtered.sort((a, b) => b.count - a.count).slice(0, 10);
    await prisma.popularitySnapshot.upsert({
      where: {
        country_type_window: {
          country,
          type,
          window: windowLabel,
        },
      },
      update: {
        items: top10,
        computedAt: new Date(),
      },
      create: {
        country,
        type,
        window: windowLabel,
        items: top10,
      },
    });

    console.log(
      `[popularity] ${windowLabel} ${type} ${country}: ${top10.length}/10 after availability filter (input ${list.length})`,
    );
  }
}
