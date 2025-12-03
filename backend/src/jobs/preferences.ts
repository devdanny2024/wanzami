import { prisma } from "../prisma.js";

const WINDOW_DAYS = parseInt(process.env.PREF_WINDOW_DAYS ?? "60", 10) || 60;
const MIN_WEIGHT = 0.05;

export async function computeProfilePreferences() {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const events = await prisma.engagementEvent.findMany({
    where: {
      occurredAt: { gte: since },
      profileId: { not: null },
      titleId: { not: null },
      eventType: { in: ["PLAY_START", "PLAY_END", "THUMBS_UP"] },
    },
    select: {
      profileId: true,
      occurredAt: true,
      title: {
        select: {
          genres: true,
        },
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 100000,
  });

  const now = Date.now();
  const decayMs = WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const byProfile = new Map<bigint, Map<string, number>>();

  for (const e of events) {
    if (!e.profileId || !e.title) continue;
    const genres = e.title.genres ?? [];
    const ageMs = now - e.occurredAt.getTime();
    const weight = Math.max(MIN_WEIGHT, 1 - ageMs / decayMs);
    let genreMap = byProfile.get(e.profileId);
    if (!genreMap) {
      genreMap = new Map<string, number>();
      byProfile.set(e.profileId, genreMap);
    }
    for (const g of genres) {
      const prev = genreMap.get(g) ?? 0;
      genreMap.set(g, prev + weight);
    }
  }

  for (const [profileId, genreMap] of byProfile.entries()) {
    const sorted = Array.from(genreMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g)
      .slice(0, 10);
    await prisma.profilePreferenceSnapshot.upsert({
      where: { profileId },
      update: { genres: sorted, computedAt: new Date() },
      create: { profileId, genres: sorted },
    });
  }
}
