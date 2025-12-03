import { prisma } from "../prisma.js";
const WINDOW_DAYS = parseInt(process.env.RECENT_VIEWS_DAYS ?? "14", 10) || 14;
const PER_PROFILE = parseInt(process.env.RECENT_VIEWS_LIMIT ?? "50", 10) || 50;
export async function computeRecentViews() {
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const events = await prisma.engagementEvent.findMany({
        where: {
            occurredAt: { gte: since },
            profileId: { not: null },
            titleId: { not: null },
            eventType: { in: ["PLAY_START", "PLAY_END"] },
        },
        select: {
            profileId: true,
            titleId: true,
            occurredAt: true,
        },
        orderBy: { occurredAt: "desc" },
        take: 200000,
    });
    const byProfile = new Map();
    for (const e of events) {
        if (!e.profileId || !e.titleId)
            continue;
        const list = byProfile.get(e.profileId) ?? [];
        list.push({ titleId: e.titleId, occurredAt: e.occurredAt });
        byProfile.set(e.profileId, list);
    }
    for (const [profileId, list] of byProfile.entries()) {
        const dedup = new Map();
        for (const item of list) {
            const key = item.titleId.toString();
            if (!dedup.has(key)) {
                dedup.set(key, item.occurredAt);
            }
        }
        const sorted = Array.from(dedup.entries())
            .sort((a, b) => b[1].getTime() - a[1].getTime())
            .slice(0, PER_PROFILE)
            .map(([id]) => BigInt(id));
        await prisma.profileRecentViews.upsert({
            where: { profileId },
            update: { titleIds: sorted, computedAt: new Date() },
            create: { profileId, titleIds: sorted },
        });
    }
}
