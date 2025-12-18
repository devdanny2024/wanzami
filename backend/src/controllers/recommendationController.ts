import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { resolveCountry } from "../utils/country.js";
import { getCache, setCache } from "../utils/cache.js";
import { assignVariant } from "../utils/ab.js";

const ensureProfileForUser = async (userId: bigint, profileId?: bigint) => {
  if (profileId) {
    const found = await prisma.profile.findFirst({ where: { id: profileId, userId } });
    if (found) return found;
  }
  return prisma.profile.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
};

const kidSafeRatings = ["G", "PG", "TV-Y", "TV-G", "TV-PG", "PG-13"];

const countryAndMaturityFilter = (country: string, kidMode: boolean) => ({
  OR: [{ countryAvailability: { has: country } }, { countryAvailability: { equals: [] } }],
  AND: kidMode
    ? [
        {
          OR: [{ maturityRating: { in: kidSafeRatings } }, { maturityRating: null }],
        },
      ]
    : undefined,
});

export const continueWatching = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

  const profileIdParam = req.query.profileId ? BigInt(String(req.query.profileId)) : undefined;
  const profile = await ensureProfileForUser(req.user.userId, profileIdParam);
  if (!profile) return res.status(400).json({ message: "No profile found" });

  const country = profile.country || resolveCountry(req);
  const kidMode = profile.kidMode;

  // Pull recent engagement events that carry playback progress and pick the
  // best completion per title. We look at both PLAY_END and SCRUB so that
  // manual seeks are reflected in Continue Watching even if the viewer exits
  // quickly afterwards.
  // Primary key is the profileId, but we also fall back to events that were
  // recorded without a profileId but are tied to this user's session. This
  // makes Continue Watching resilient if the player was emitting events
  // before a profile was selected or if profileId was temporarily missing
  // on the client.
  const events = await prisma.engagementEvent.findMany({
    where: {
      eventType: { in: ["PLAY_END", "SCRUB"] as any },
      titleId: { not: null },
      OR: [
        { profileId: profile.id },
        {
          profileId: null,
          session: {
            userId: profile.userId,
          },
        },
      ],
    },
    orderBy: { occurredAt: "desc" },
    // Look at a reasonably large window so older, higher‑completion
    // events are not lost if there is a lot of recent activity.
    take: 200,
  });

  type ProgressStats = { completion: number; lastAt: Date };
  const bestByTitle = new Map<bigint, ProgressStats>();
  for (const e of events) {
    if (!e.titleId) continue;
    const metadata =
      typeof e.metadata === "object" && e.metadata !== null ? (e.metadata as any) : {};
    let completion = Number(
      typeof metadata.completionPercent === "number"
        ? metadata.completionPercent
        : typeof metadata.completion === "number"
          ? metadata.completion
          : NaN,
    );
    // Fallback: derive completion from position / duration when percent is missing.
    if (Number.isNaN(completion)) {
      const pos = Number(metadata.positionSec);
      const dur = Number(metadata.durationSec);
      if (Number.isFinite(pos) && Number.isFinite(dur) && dur > 0) {
        completion = Math.max(0, Math.min(1, pos / dur));
      }
    }
    if (!Number.isFinite(completion) || completion <= 0) continue;

    const existing = bestByTitle.get(e.titleId);
    if (!existing) {
      bestByTitle.set(e.titleId, { completion, lastAt: e.occurredAt });
    } else {
      bestByTitle.set(e.titleId, {
        completion: completion > existing.completion ? completion : existing.completion,
        lastAt: e.occurredAt > existing.lastAt ? e.occurredAt : existing.lastAt,
      });
    }
  }

  const candidates = Array.from(bestByTitle.entries()).map(([titleId, stats]) => ({
    titleId,
    completion: stats.completion,
    lastAt: stats.lastAt.getTime(),
  }));

  if (!candidates.length) {
    return res.json({ items: [] });
  }

  // Order by most recently watched so the last title the viewer engaged
  // with appears first in the Continue Watching row.
  const sortedCandidates = candidates.sort((a, b) => b.lastAt - a.lastAt);

  const titles = await prisma.title.findMany({
    where: {
      id: { in: sortedCandidates.map((c) => c.titleId) },
      archived: false,
      ...countryAndMaturityFilter(country, kidMode),
    },
  });

  const items = sortedCandidates
    .map((c) => {
      const t = titles.find((tt) => tt.id === c.titleId);
      if (!t) return null;
      return {
        id: t.id.toString(),
        name: t.name,
        type: t.type,
        posterUrl: t.posterUrl,
        thumbnailUrl: t.thumbnailUrl,
        runtimeMinutes: t.runtimeMinutes,
        completionPercent: Math.max(0, Math.min(1, c.completion)),
      };
    })
    .filter(Boolean);

  return res.json({ items });
};

export const becauseYouWatched = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });

  const profileIdParam = req.query.profileId ? BigInt(String(req.query.profileId)) : undefined;
  const profile = await ensureProfileForUser(req.user.userId, profileIdParam);
  if (!profile) return res.status(400).json({ message: "No profile found" });

  const cacheTtl = Number(process.env.REC_CACHE_SEC ?? "120");
  const cacheKey = profile.id ? `byw:${profile.id.toString()}` : null;
  if (cacheKey) {
    const cached = getCache<any>(cacheKey);
    if (cached) return res.json(cached);
  }

  const country = profile.country || resolveCountry(req);
  const kidMode = profile.kidMode;

  // Do not surface "Because you watched" for profiles with no watch history
  const historyCount = await prisma.engagementEvent.count({
    where: {
      profileId: profile.id,
      eventType: "PLAY_END",
    },
  });

  if (historyCount === 0) {
    const payload = { items: [] as any[], anchors: [] as string[], hasHistory: false };
    if (cacheKey && cacheTtl > 0) setCache(cacheKey, payload, cacheTtl);
    return res.json(payload);
  }

  // Pick recent positive interactions as anchors
  const anchors = await prisma.engagementEvent.findMany({
    where: {
      profileId: profile.id,
      eventType: { in: ["PLAY_END", "THUMBS_UP"] },
      titleId: { not: null },
    },
    orderBy: { occurredAt: "desc" },
    take: 20,
  });

  let anchorIds = Array.from(new Set(anchors.map((a) => a.titleId!).filter(Boolean)));
  if (!anchorIds.length) {
    const rv = await prisma.profileRecentViews.findUnique({
      where: { profileId: profile.id },
    });
    anchorIds = (rv?.titleIds ?? []).slice(0, 10);
  }
  if (!anchorIds.length) {
    // Fall back to preference snapshot if no anchors
    const snap = await prisma.profilePreferenceSnapshot.findUnique({
      where: { profileId: profile.id },
    });
    const prefGenres = snap?.genres ?? [];
    const byPref = await prisma.title.findMany({
      where: {
        archived: false,
        genres: prefGenres.length ? { hasSome: prefGenres } : undefined,
        ...countryAndMaturityFilter(country, kidMode),
      },
      orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
      take: 30,
    });
    const items = byPref.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      type: t.type,
      posterUrl: t.posterUrl,
      thumbnailUrl: t.thumbnailUrl,
      runtimeMinutes: t.runtimeMinutes,
      genres: t.genres,
      maturityRating: t.maturityRating,
      isOriginal: t.isOriginal,
    }));
    const payload = { items, anchors: [] };
    if (cacheKey && cacheTtl > 0) setCache(cacheKey, payload, cacheTtl);
    return res.json(payload);
  }

  const [anchorTitles, popularitySnap] = await Promise.all([
    prisma.title.findMany({
      where: { id: { in: anchorIds }, archived: false },
    }),
    prisma.popularitySnapshot.findUnique({
      where: {
        country_type_window: {
          country,
          type: "MOVIE",
          window: "DAILY",
        },
      },
    }),
  ]);

  const anchorGenres = new Set<string>();
  for (const t of anchorTitles) {
    t.genres.forEach((g) => anchorGenres.add(g));
  }
  const genreList = Array.from(anchorGenres);

  // Blend metadata genre overlap with similarity graph when present
  const similaritySeeds = anchorIds.length
    ? await prisma.titleSimilarity.findMany({
        where: { sourceTitleId: { in: anchorIds } },
        orderBy: [{ score: "desc" }],
        take: 50,
      })
    : [];
  const similarIds = Array.from(new Set(similaritySeeds.map((s) => s.targetTitleId)));

  const recommendations = await prisma.title.findMany({
    where: {
      archived: false,
      id: { notIn: anchorIds },
      AND: [
        { OR: [{ genres: { hasSome: genreList } }, { id: { in: similarIds } }] },
        countryAndMaturityFilter(country, kidMode),
      ],
    },
    orderBy: [
      { releaseDate: "desc" },
      { createdAt: "desc" },
    ],
    take: 40,
  });

  const popularitySet = new Set(
    (Array.isArray(popularitySnap?.items) ? (popularitySnap!.items as any[]) : []).map((i) =>
      String(i.titleId),
    ),
  );
  const sorted = recommendations
    .map((t) => {
      const recency = t.releaseDate ? t.releaseDate.getTime() : 0;
      const origBoost = t.isOriginal ? 1.5 : 0;
      const popBoost = popularitySet.has(t.id.toString()) ? 0.5 : 0;
      return { t, score: origBoost + popBoost + recency / 1e14 };
    })
    .sort((a, b) => b.score - a.score)
    .map((s) => s.t);

  const items = sorted.slice(0, 30).map((t) => ({
    id: t.id.toString(),
    name: t.name,
    type: t.type,
    posterUrl: t.posterUrl,
    thumbnailUrl: t.thumbnailUrl,
    runtimeMinutes: t.runtimeMinutes,
    genres: t.genres,
    maturityRating: t.maturityRating,
    isOriginal: t.isOriginal,
  }));

  const payload = { items, anchors: anchorIds.map((id) => id.toString()) };
  if (cacheKey && cacheTtl > 0) setCache(cacheKey, payload, cacheTtl);
  return res.json(payload);
};

export const forYou = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user?.userId) return res.status(401).json({ message: "Unauthorized" });
  const profileIdParam = req.query.profileId ? BigInt(String(req.query.profileId)) : undefined;
  const profile = await ensureProfileForUser(req.user.userId, profileIdParam);
  if (!profile) return res.status(400).json({ message: "No profile found" });

  const { experiment, variant } = assignVariant("foryou_v1", profile.id.toString(), [
    "control",
    "originals_boost",
  ]);

  const cacheTtl = Number(process.env.REC_CACHE_SEC ?? "120");
  const cacheKey = profile.id ? `foryou:${profile.id.toString()}` : null;
  if (cacheKey) {
    const cached = getCache<any>(cacheKey);
    if (cached) {
      res.setHeader("x-experiment", experiment);
      res.setHeader("x-variant", variant);
      await prisma.engagementEvent.create({
        data: {
          profileId: profile.id,
          eventType: "IMPRESSION",
          occurredAt: new Date(),
          country: profile.country || resolveCountry(req),
          metadata: {
            experiment,
            variant,
            surface: "for_you",
            anchorCount: Array.isArray(cached.anchors) ? cached.anchors.length : 0,
            itemCount: Array.isArray(cached.items) ? cached.items.length : 0,
            cache: true,
          },
        },
      });
      return res.json({ ...cached, experiment, variant });
    }
  }

  const country = profile.country || resolveCountry(req);
  const kidMode = profile.kidMode;

  const anchors = await prisma.engagementEvent.findMany({
    where: {
      profileId: profile.id,
      eventType: { in: ["PLAY_END", "THUMBS_UP"] },
      titleId: { not: null },
    },
    orderBy: { occurredAt: "desc" },
    take: 10,
  });
  let anchorIds = Array.from(new Set(anchors.map((a) => a.titleId!).filter(Boolean)));

  // If there are no recent positive anchors, fall back to the daily recent-views snapshot as seeds
  if (!anchorIds.length) {
    const recentViews = await prisma.profileRecentViews.findUnique({
      where: { profileId: profile.id },
    });
    if (recentViews?.titleIds?.length) {
      anchorIds = Array.from(new Set(recentViews.titleIds.slice(0, 20)));
    }
  }

  const [anchorTitles, prefSnap, popularity, similaritySeeds] = await Promise.all([
    anchorIds.length
      ? prisma.title.findMany({ where: { id: { in: anchorIds }, archived: false } })
      : Promise.resolve([]),
    prisma.profilePreferenceSnapshot.findUnique({
      where: { profileId: profile.id },
    }),
    prisma.popularitySnapshot.findUnique({
      where: {
        country_type_window: {
          country,
          type: "MOVIE",
          window: "DAILY",
        },
      },
    }),
    anchorIds.length
      ? prisma.titleSimilarity.findMany({
          where: { sourceTitleId: { in: anchorIds } },
          orderBy: [{ score: "desc" }],
          take: 100,
        })
      : Promise.resolve([] as any[]),
  ]);

  const anchorGenres = new Set<string>();
  anchorTitles.forEach((t) => t.genres.forEach((g) => anchorGenres.add(g)));

  if (prefSnap?.genres?.length) {
    prefSnap.genres.forEach((g) => anchorGenres.add(g));
  }
  const prefFromProfile = Array.isArray((profile.preferences as any)?.preferredGenres)
    ? ((profile.preferences as any).preferredGenres as string[])
    : [];
  prefFromProfile.forEach((g) => anchorGenres.add(g));

  const genreList = Array.from(anchorGenres);

  const popularIds = Array.isArray(popularity?.items)
    ? (popularity!.items as any[]).map((i) => BigInt(i.titleId)).filter(Boolean)
    : [];

  // Similar titles from co-watch graph (collaborative filtering lite)
  const similarIds = Array.from(new Set(similaritySeeds.map((s) => s.targetTitleId)));
  const similarSet = new Set(similarIds.map((id) => id.toString()));

  const recs = await prisma.title.findMany({
    where: {
      archived: false,
      id: { notIn: anchorIds },
      AND: [
        {
          OR: [
            genreList.length ? { genres: { hasSome: genreList } } : undefined,
            similarIds.length ? { id: { in: similarIds } } : undefined,
          ].filter(Boolean) as any,
        },
        countryAndMaturityFilter(country, kidMode),
      ],
    },
    orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
    take: 30,
  });

  const fallback = await prisma.title.findMany({
    where: {
      archived: false,
      id: { notIn: [...anchorIds, ...recs.map((r) => r.id)] },
      ...countryAndMaturityFilter(country, kidMode),
    },
    orderBy: [{ releaseDate: "desc" }, { createdAt: "desc" }],
    take: 20,
  });

  const fromPopularity = popularIds.length
    ? await prisma.title.findMany({
        where: {
          id: { in: popularIds },
          archived: false,
          ...countryAndMaturityFilter(country, kidMode),
        },
      })
    : [];

  const merged = [
    ...recs,
    ...fromPopularity.filter((p) => !recs.find((r) => r.id === p.id)),
    ...fallback,
  ];

  const dedup = new Map<string, typeof merged[number]>();
  merged.forEach((t) => dedup.set(t.id.toString(), t));

  const now = Date.now();
  const popularitySet = new Set(popularIds.map((id) => id.toString()));
  const scored = Array.from(dedup.values()).map((t) => {
    const release = t.releaseDate?.getTime() ?? 0;
    const monthsAgo = (now - release) / (1000 * 60 * 60 * 24 * 30);
    const recencyScore = Number.isFinite(monthsAgo) ? Math.max(0, 6 - monthsAgo) * 0.1 : 0;
    const originalBoost = t.isOriginal ? 1.5 : 0;
    const similarBoost = similarSet.has(t.id.toString()) ? 1 : 0;
    const popularityBoost = popularitySet.has(t.id.toString()) ? 0.5 : 0;
    const score = originalBoost + similarBoost + popularityBoost + recencyScore;
    return { t, score };
  });

  const sorted = scored
    .sort((a, b) => b.score - a.score || (b.t.releaseDate?.getTime() ?? 0) - (a.t.releaseDate?.getTime() ?? 0))
    .map((s) => s.t);

  const items = sorted.slice(0, 30).map((t) => ({
    id: t.id.toString(),
    name: t.name,
    type: t.type,
    posterUrl: t.posterUrl,
    thumbnailUrl: t.thumbnailUrl,
    runtimeMinutes: t.runtimeMinutes,
    genres: t.genres,
    maturityRating: t.maturityRating,
    isOriginal: t.isOriginal,
  }));

  const payload = { items, anchors: anchorIds.map((id) => id.toString()) };
  if (cacheKey && cacheTtl > 0) setCache(cacheKey, payload, cacheTtl);

  // Log an exposure for lightweight A/B tracking
  await prisma.engagementEvent.create({
    data: {
      profileId: profile.id,
      eventType: "IMPRESSION",
      occurredAt: new Date(),
      country,
      metadata: {
        experiment,
        variant,
        surface: "for_you",
        anchorCount: anchorIds.length,
        itemCount: items.length,
      },
    },
  });

  res.setHeader("x-experiment", experiment);
  res.setHeader("x-variant", variant);
  return res.json({ ...payload, experiment, variant });
};
