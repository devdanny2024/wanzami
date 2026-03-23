'use client';

import { useEffect, useRef, useState } from "react";
import { HomePage } from "@/components/HomePage";
import { HomeSkeleton } from "@/components/Skeletons";
import {
  fetchTitles,
  fetchPopularity,
  fetchContinueWatching,
  fetchBecauseYouWatched,
  fetchForYou,
  fetchMyPpvTitles,
  resolveCdnImageUrl,
} from "@/lib/contentClient";
import { MovieData } from "@/components/MovieCard";

export default function SeriesPage() {
  const [series, setSeries] = useState<MovieData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [top10Series, setTop10Series] = useState<MovieData[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<MovieData[]>([]);
  const [continueWatchingItems, setContinueWatchingItems] = useState<any[]>([]);
  const [becauseYouWatchedItems, setBecauseYouWatchedItems] = useState<any[]>([]);
  const [forYouItems, setForYouItems] = useState<MovieData[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  const ownedSyncKey = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTitles = async () => {
      try {
        setLoading(true);
        setError(null);
        const storedCountry = typeof window !== "undefined" ? localStorage.getItem("countryCode") : null;
        const titles = await fetchTitles(storedCountry ?? "NG");
        if (!isMounted) return;
        const mapped = titles
          .filter((t) => !t.archived && t.type === "SERIES")
          .map((title, idx) => {
            const numericId = Number(title.id);
            const safeId = Number.isNaN(numericId) ? Date.now() + idx : numericId;
            const fallbackImage = "https://placehold.co/600x900/111111/FD7E14?text=Wanzami";
            const primaryGenre = (title as any).genres?.[0];
            const displayRating = title.maturityRating ?? "PG";
            return {
              id: safeId,
              backendId: title.id,
              title: title.name,
              image: resolveCdnImageUrl(title.thumbnailUrl || title.posterUrl || fallbackImage),
              description: title.description,
              rating: displayRating,
              type: title.type,
              genres: (title as any).genres,
              runtimeMinutes: title.runtimeMinutes ?? 0,
              trailerUrl: title.trailerUrl,
              posterUrl: title.posterUrl,
              thumbnailUrl: title.thumbnailUrl,
              maturityRating: title.maturityRating,
              isPpv: title.isPpv ?? false,
              hasAccess: title.isPpv === false,
              ppvPriceNaira: (title as any).ppvPriceNaira ?? undefined,
              ppvCurrency: (title as any).ppvCurrency ?? undefined,
              genre: primaryGenre,
              isOriginal: title.isOriginal ?? false,
              assetVersions: title.assetVersions,
              createdAt: title.createdAt,
            } as MovieData;
          });
        setSeries(mapped);
      } catch (err: any) {
        const msg = err?.message ?? "Failed to load series";
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void loadTitles();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const profileId = typeof window !== "undefined" ? localStorage.getItem("activeProfileId") : null;
    if (!accessToken || series.length === 0) return;
    const key = `${accessToken}:${profileId ?? ""}`;
    if (ownedSyncKey.current === key) return;
    ownedSyncKey.current = key;

    const syncOwned = async () => {
      try {
        const data = await fetchMyPpvTitles({ accessToken, profileId });
        const ownedIds = new Set<string>(
          (data?.activePurchases ?? [])
            .map((p) => p.title?.id)
            .filter((id): id is NonNullable<typeof id> => id !== null && id !== undefined)
            .map((id) => String(id))
        );

        if (typeof window !== "undefined") {
          try {
            const existing = JSON.parse(
              window.localStorage.getItem("wanzami:ppvOwned") ?? "[]"
            ) as string[];
            const merged = Array.from(new Set([...existing, ...ownedIds]));
            window.localStorage.setItem("wanzami:ppvOwned", JSON.stringify(merged));
          } catch {
            // ignore storage errors
          }
        }

        setSeries((prev) => {
          let changed = false;
          const next = prev.map((m) => {
            const keyId = String(m.backendId ?? m.id);
            if (ownedIds.has(keyId) && !m.hasAccess) {
              changed = true;
              return { ...m, hasAccess: true, isOwned: true };
            }
            return m;
          });
          return changed ? next : prev;
        });
      } catch {
        // non-blocking
      }
    };

    void syncOwned();
  }, [series.length]);

  useEffect(() => {
    let isMounted = true;
    const loadRecs = async () => {
      const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const profileId = typeof window !== "undefined" ? localStorage.getItem("activeProfileId") : null;
      if (!accessToken) return;
      try {
        setRecsLoading(true);
        setRecsError(null);

        const cw = await fetchContinueWatching(accessToken, profileId ?? undefined);
        if (isMounted) {
          const mappedCw = (cw.items ?? [])
            .filter((i: any) => i.type === "SERIES")
            .map((i, idx) => ({
              id: Number(i.titleId ?? i.id ?? idx) || Date.now() + idx,
              backendId: i.titleId ?? i.id ?? String(idx),
              title: i.name ?? i.title ?? `Series ${i.titleId ?? i.id ?? idx}`,
              image: resolveCdnImageUrl(i.thumbnailUrl || i.posterUrl || "https://placehold.co/640x360/111111/FD7E14?text=Wanzami"),
              type: i.type ?? "SERIES",
              completionPercent: typeof i.completionPercent === "number" ? i.completionPercent : undefined,
              runtimeMinutes: i.runtimeMinutes ?? 0,
            }));
          const buildLocalFallback = () => {
            if (typeof window === "undefined") return [];
            try {
              const raw = window.localStorage.getItem("wanzami:cw-progress");
              if (!raw) return [];
              const local = JSON.parse(raw) as Record<string, { completionPercent?: number }>;
              return Object.entries(local).flatMap(([backendId, progress]) => {
                const match = series.find((m) => String(m.backendId) === String(backendId));
                if (!match) return [];
                return [
                  {
                    ...match,
                    completionPercent:
                      typeof progress.completionPercent === "number" ? progress.completionPercent : 0.1,
                  },
                ];
              });
            } catch {
              return [];
            }
          };
          const finalCw = mappedCw.length > 0 ? mappedCw : buildLocalFallback();
          setContinueWatchingItems(finalCw);
        }

        const byw = await fetchBecauseYouWatched(accessToken, profileId ?? undefined);

        const [top10SeriesRes, trendingSeriesRes, forYouRes] = await Promise.all([
          fetchPopularity({ type: "SERIES", window: "DAILY" }),
          fetchPopularity({ type: "SERIES", window: "TRENDING" }),
          fetchForYou(accessToken, profileId ?? undefined),
        ]);

        const mapItems = (ids: { titleId?: string; id?: string }[]) => {
          const mapped: MovieData[] = [];
          ids.forEach((item) => {
            const backendId = String(item.titleId ?? item.id ?? "");
            if (!backendId) return;
            const match = series.find((m) => String(m.backendId) === backendId);
            if (match) mapped.push(match);
          });
          return mapped;
        };

        if (isMounted) {
          setBecauseYouWatchedItems(mapItems(byw.items ?? []));
          setTop10Series(mapItems(top10SeriesRes.items ?? []));
          setTrendingSeries(mapItems(trendingSeriesRes.items ?? []));
          const fyItems = mapItems((forYouRes?.items as any[]) ?? []);
          setForYouItems(fyItems);
        }
      } catch (err: any) {
        const message =
          err?.name === "AbortError" ? "Recommendations timed out" : err?.message ?? "Failed to load recommendations";
        if (isMounted) setRecsError(message);
      } finally {
        if (isMounted) setRecsLoading(false);
      }
    };

    void loadRecs();
    return () => {
      isMounted = false;
    };
  }, [series]);

  const handleSeriesClick = (item: any) => {
    const targetId = item?.backendId ?? item?.id;
    if (targetId) {
      window.location.href = `/title/${targetId}`;
    }
  };

  const handleResumeClick = (item: any) => {
    const targetId = item?.backendId ?? item?.id;
    if (targetId) {
      window.location.href = `/player/${targetId}`;
    }
  };

  return (
    <div className="min-h-screen bg-black home-root">
      {loading ? (
        <HomeSkeleton />
      ) : (
        <HomePage
          onMovieClick={handleSeriesClick}
          onContinueClick={handleResumeClick}
          movies={series}
          loading={loading}
          error={error}
          top10Series={top10Series}
          trendingSeries={trendingSeries}
          top10={[]}
          trending={[]}
          continueWatching={continueWatchingItems}
          becauseYouWatched={becauseYouWatchedItems}
          forYouItems={forYouItems}
          recsLoading={recsLoading}
          recsError={recsError}
          showGenreRows={true}
        />
      )}
    </div>
  );
}
