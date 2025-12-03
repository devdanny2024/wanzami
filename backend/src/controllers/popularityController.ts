import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { getCache, setCache } from "../utils/cache.js";

const parseType = (t?: string) => (t === "SERIES" ? "SERIES" : "MOVIE");
const parseWindow = (w?: string) => (w === "TRENDING" ? "TRENDING" : "DAILY");

export const getPopularity = async (req: Request, res: Response) => {
  const country = (req.query.country as string | undefined)?.toUpperCase()?.trim() || "UNKNOWN";
  const type = parseType(req.query.type as string | undefined);
  const window = parseWindow(req.query.window as string | undefined);
  const ttlSec = Number(process.env.POPULARITY_CACHE_SEC ?? "300");
  const cacheKey = `popularity:${country}:${type}:${window}`;
  const cached = getCache<any>(cacheKey);
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
    items: (snap?.items as any) ?? [],
    computedAt: snap?.computedAt ?? null,
  };
  if (ttlSec > 0) {
    setCache(cacheKey, payload, ttlSec);
  }
  return res.json(payload);
};
