import { prisma } from "../prisma.js";
const WINDOWS = [
    { label: "DAILY", hours: 24 },
    { label: "TRENDING", hours: 72 },
];
const EVENT_TYPES = ["PLAY_START", "PLAY_END"];
export async function computePopularitySnapshots() {
    for (const w of WINDOWS) {
        await computeWindow(w.label, w.hours, "MOVIE");
        await computeWindow(w.label, w.hours, "SERIES");
    }
}
async function computeWindow(windowLabel, hours, type) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const rows = await prisma.engagementEvent.groupBy({
        by: ["country", "titleId"],
        where: {
            occurredAt: { gte: since },
            eventType: { in: EVENT_TYPES },
            titleId: { not: null },
            title: { type },
        },
        _count: { _all: true },
    });
    const byCountry = new Map();
    for (const row of rows) {
        const country = row.country ?? "UNKNOWN";
        if (!row.titleId)
            continue;
        const list = byCountry.get(country) ?? [];
        const count = typeof row._count === "object" && row._count && "_all" in row._count
            ? row._count._all
            : 0;
        list.push({ titleId: row.titleId.toString(), count });
        byCountry.set(country, list);
    }
    for (const [country, list] of byCountry.entries()) {
        const top10 = list.sort((a, b) => b.count - a.count).slice(0, 10);
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
    }
}
