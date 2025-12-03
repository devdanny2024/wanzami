import { prisma } from "../prisma.js";
import { resolveCountry } from "../utils/country.js";
import { getCache, setCache } from "../utils/cache.js";
const ensureProfileForUser = async (userId, profileId) => {
    if (profileId) {
        const found = await prisma.profile.findFirst({ where: { id: profileId, userId } });
        if (found)
            return found;
    }
    return prisma.profile.findFirst({ where: { userId }, orderBy: { createdAt: "asc" } });
};
const kidSafeRatings = ["G", "PG", "TV-Y", "TV-G", "TV-PG", "PG-13"];
const countryAndMaturityFilter = (country, kidMode) => ({
    OR: [{ countryAvailability: { has: country } }, { countryAvailability: { equals: [] } }],
    AND: kidMode
        ? [
            {
                OR: [{ maturityRating: { in: kidSafeRatings } }, { maturityRating: null }],
            },
        ]
        : undefined,
});
export const continueWatching = async (req, res) => {
    if (!req.user?.userId)
        return res.status(401).json({ message: "Unauthorized" });
    const profileIdParam = req.query.profileId ? BigInt(String(req.query.profileId)) : undefined;
    const profile = await ensureProfileForUser(req.user.userId, profileIdParam);
    if (!profile)
        return res.status(400).json({ message: "No profile found" });
    const cacheTtl = Number(process.env.REC_CACHE_SEC ?? "120");
    const cacheKey = profile.id ? `cw:${profile.id.toString()}` : null;
    if (cacheKey) {
        const cached = getCache(cacheKey);
        if (cached)
            return res.json(cached);
    }
    const country = profile.country || resolveCountry(req);
    const kidMode = profile.kidMode;
    // Pull recent play_end events and pick those with incomplete completion percent
    const events = await prisma.engagementEvent.findMany({
        where: {
            profileId: profile.id,
            eventType: "PLAY_END",
        },
        orderBy: { occurredAt: "desc" },
        take: 50,
    });
    const seen = new Set();
    const candidates = [];
    for (const e of events) {
        if (!e.titleId)
            continue;
        if (seen.has(e.titleId))
            continue;
        const completion = typeof e.metadata === "object" && e.metadata !== null
            ? Number(e.metadata.completionPercent ?? e.metadata.completion ?? 1)
            : 1;
        if (Number.isNaN(completion) || completion >= 0.9)
            continue;
        seen.add(e.titleId);
        candidates.push({ titleId: e.titleId, completion });
    }
    if (!candidates.length)
        return res.json({ items: [] });
    const titles = await prisma.title.findMany({
        where: {
            id: { in: candidates.map((c) => c.titleId) },
            archived: false,
            ...countryAndMaturityFilter(country, kidMode),
        },
    });
    const items = candidates
        .map((c) => {
        const t = titles.find((tt) => tt.id === c.titleId);
        if (!t)
            return null;
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
    const payload = { items };
    if (cacheKey && cacheTtl > 0)
        setCache(cacheKey, payload, cacheTtl);
    return res.json(payload);
};
export const becauseYouWatched = async (req, res) => {
    if (!req.user?.userId)
        return res.status(401).json({ message: "Unauthorized" });
    const profileIdParam = req.query.profileId ? BigInt(String(req.query.profileId)) : undefined;
    const profile = await ensureProfileForUser(req.user.userId, profileIdParam);
    if (!profile)
        return res.status(400).json({ message: "No profile found" });
    const cacheTtl = Number(process.env.REC_CACHE_SEC ?? "120");
    const cacheKey = profile.id ? `byw:${profile.id.toString()}` : null;
    if (cacheKey) {
        const cached = getCache(cacheKey);
        if (cached)
            return res.json(cached);
    }
    const country = profile.country || resolveCountry(req);
    const kidMode = profile.kidMode;
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
    const anchorIds = Array.from(new Set(anchors.map((a) => a.titleId).filter(Boolean)));
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
        return res.json({ items, anchors: [] });
    }
    const anchorTitles = await prisma.title.findMany({
        where: { id: { in: anchorIds }, archived: false },
    });
    const anchorGenres = new Set();
    for (const t of anchorTitles) {
        t.genres.forEach((g) => anchorGenres.add(g));
    }
    const genreList = Array.from(anchorGenres);
    const recommendations = await prisma.title.findMany({
        where: {
            archived: false,
            id: { notIn: anchorIds },
            AND: [
                { genres: { hasSome: genreList } },
                countryAndMaturityFilter(country, kidMode),
            ],
        },
        orderBy: [
            { releaseDate: "desc" },
            { createdAt: "desc" },
        ],
        take: 30,
    });
    const items = recommendations.map((t) => ({
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
    // Originals boost then recency
    const sorted = items.sort((a, b) => {
        if (a.isOriginal && !b.isOriginal)
            return -1;
        if (!a.isOriginal && b.isOriginal)
            return 1;
        return 0;
    });
    const payload = { items: sorted, anchors: anchorIds.map((id) => id.toString()) };
    if (cacheKey && cacheTtl > 0)
        setCache(cacheKey, payload, cacheTtl);
    return res.json(payload);
};
export const forYou = async (req, res) => {
    if (!req.user?.userId)
        return res.status(401).json({ message: "Unauthorized" });
    const profileIdParam = req.query.profileId ? BigInt(String(req.query.profileId)) : undefined;
    const profile = await ensureProfileForUser(req.user.userId, profileIdParam);
    if (!profile)
        return res.status(400).json({ message: "No profile found" });
    const cacheTtl = Number(process.env.REC_CACHE_SEC ?? "120");
    const cacheKey = profile.id ? `foryou:${profile.id.toString()}` : null;
    if (cacheKey) {
        const cached = getCache(cacheKey);
        if (cached)
            return res.json(cached);
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
    const anchorIds = Array.from(new Set(anchors.map((a) => a.titleId).filter(Boolean)));
    const anchorTitles = anchorIds.length
        ? await prisma.title.findMany({ where: { id: { in: anchorIds }, archived: false } })
        : [];
    const anchorGenres = new Set();
    anchorTitles.forEach((t) => t.genres.forEach((g) => anchorGenres.add(g)));
    const prefSnap = await prisma.profilePreferenceSnapshot.findUnique({
        where: { profileId: profile.id },
    });
    if (prefSnap?.genres?.length) {
        prefSnap.genres.forEach((g) => anchorGenres.add(g));
    }
    const prefFromProfile = Array.isArray(profile.preferences?.preferredGenres)
        ? profile.preferences.preferredGenres
        : [];
    prefFromProfile.forEach((g) => anchorGenres.add(g));
    const genreList = Array.from(anchorGenres);
    const popularity = await prisma.popularitySnapshot.findUnique({
        where: {
            country_type_window: {
                country,
                type: "MOVIE",
                window: "DAILY",
            },
        },
    });
    const popularIds = Array.isArray(popularity?.items)
        ? popularity.items.map((i) => BigInt(i.titleId)).filter(Boolean)
        : [];
    const recs = await prisma.title.findMany({
        where: {
            archived: false,
            id: { notIn: anchorIds },
            AND: [
                genreList.length ? { genres: { hasSome: genreList } } : {},
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
    const dedup = new Map();
    merged.forEach((t) => dedup.set(t.id.toString(), t));
    const sorted = Array.from(dedup.values()).sort((a, b) => {
        if (a.isOriginal && !b.isOriginal)
            return -1;
        if (!a.isOriginal && b.isOriginal)
            return 1;
        const aDate = a.releaseDate?.getTime() ?? 0;
        const bDate = b.releaseDate?.getTime() ?? 0;
        return bDate - aDate;
    });
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
    if (cacheKey && cacheTtl > 0)
        setCache(cacheKey, payload, cacheTtl);
    return res.json(payload);
};
