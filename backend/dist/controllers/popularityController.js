import { prisma } from "../prisma.js";
import { getCache, setCache } from "../utils/cache.js";
const parseType = (t) => (t === "SERIES" ? "SERIES" : "MOVIE");
const parseWindow = (w) => (w === "TRENDING" ? "TRENDING" : "DAILY");
export const getPopularity = async (req, res) => {
    const country = req.query.country?.toUpperCase()?.trim() || "UNKNOWN";
    const type = parseType(req.query.type);
    const window = parseWindow(req.query.window);
    const ttlSec = Number(process.env.POPULARITY_CACHE_SEC ?? "300");
    const cacheKey = `popularity:${country}:${type}:${window}`;
    const cached = getCache(cacheKey);
    if (cached) {
        return res.json(cached);
    }
    const snap = await prisma.popularitySnapshot.findUnique({
        where: {
            country_type_window: {
                country,
                type,
                window,
            },
        },
    });
    const payload = {
        country,
        type,
        window,
        items: snap?.items ?? [],
        computedAt: snap?.computedAt ?? null,
    };
    if (ttlSec > 0) {
        setCache(cacheKey, payload, ttlSec);
    }
    return res.json(payload);
};
