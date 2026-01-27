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
} from "@/lib/contentClient";
import { MovieData } from "@/components/MovieCard";

export default function MoviesPage() {
  const [movies, setMovies] = useState<MovieData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [top10, setTop10] = useState<MovieData[]>([]);
  const [trending, setTrending] = useState<MovieData[]>([]);
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
          .filter((t) => !t.archived && t.type === "MOVIE")
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
              image: title.thumbnailUrl || title.posterUrl || fallbackImage,
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
        setMovies(mapped);
      } catch (err: any) {
        const msg = err?.message ?? "Failed to load movies";
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
    if (!accessToken || movies.length === 0) return;
    const key = `${accessToken}:${profileId ?? ""}`;
    if (ownedSyncKey.current === key) return;
    ownedSyncKey.current = key;

    const syncOwned = async () => {
      try {
        const data = await fetchMyPpvTitles({ accessToken, profileId });
        const ownedIds = new Set<string>(
          (data?.activePurchases ?? []).map((p) => String(p.title?.id ?? p.titleId))
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

        setMovies((prev) => {
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
  }, [movies.length]);

  const mapContentItems = (items: any[]) => {
    return (items ?? []).map((item, idx) => {
      const backendId = item.titleId ?? item.id ?? item.contentId ?? `item-${idx}`;
      const fallbackImage = "https://placehold.co/600x900/111111/FD7E14?text=Wanzami";
      return {
        id: Number(backendId) || Date.now() + idx,
        backendId,
        title: item.name ?? item.title ?? `Title ${backendId}`,
        image: item.thumbnailUrl || item.posterUrl || fallbackImage,
        posterUrl: item.posterUrl,
        thumbnailUrl: item.thumbnailUrl,
        type: item.type ?? "MOVIE",
        genres: item.genres,
        maturityRating: item.maturityRating,
        runtimeMinutes: item.runtimeMinutes ?? 0,
      } as MovieData;
    });
  };

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
          const mappedCw = mapContentItems(cw.items ?? []).map((i) => ({
            ...i,
            completionPercent: typeof (i as any).completionPercent === "number" ? (i as any).completionPercent : undefined,
          }));

          const buildLocalFallback = () => {
            if (typeof window === "undefined") return [];
            try {
              const raw = window.localStorage.getItem("wanzami:cw-progress");
              if (!raw) return [];
              const local = JSON.parse(raw) as Record<
                string,
                { completionPercent?: number; positionSec?: number; durationSec?: number }
              >;
              return Object.entries(local).flatMap(([backendId, progress]) => {
                const match = movies.find((m) => String(m.backendId) === String(backendId));
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

        const [top10Res, trendingRes, forYouRes] = await Promise.all([
          fetchPopularity({ type: "MOVIE", window: "DAILY" }),
          fetchPopularity({ type: "MOVIE", window: "TRENDING" }),
          fetchForYou(accessToken, profileId ?? undefined),
        ]);

        const mapItems = (ids: any[]) => {
          const mapped: MovieData[] = [];
          ids.forEach((item, idx) => {
            const backendId = item.titleId ?? item.id ?? item.contentId;
            const match = backendId ? movies.find((m) => m.backendId === backendId) : undefined;
            if (match) {
              mapped.push(match);
            } else {
              mapped.push({
                id: backendId ? Number(backendId) || Date.now() + idx : Date.now() + idx,
                backendId: backendId ?? `item-${idx}`,
                title: item.name ?? `Title ${backendId ?? idx}`,
                image:
                  item.thumbnailUrl ||
                  item.posterUrl ||
                  "https://placehold.co/600x900/111111/FD7E14?text=Wanzami",
              } as MovieData);
            }
          });
          return mapped;
        };

        if (isMounted) {
          setBecauseYouWatchedItems(mapItems(byw.items ?? []));
          setTop10(mapItems(top10Res.items ?? []));
          setTrending(mapItems(trendingRes.items ?? []));
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
  }, [movies]);

  const handleMovieClick = (movie: any) => {
    const targetId = movie?.backendId ?? movie?.id;
    if (targetId) {
      window.location.href = `/title/${targetId}`;
    }
  };

  const handleResumeClick = (movie: any) => {
    const targetId = movie?.backendId ?? movie?.id;
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
          onMovieClick={handleMovieClick}
          onContinueClick={handleResumeClick}
          movies={movies}
          loading={loading}
          error={error}
          top10={top10}
          trending={trending}
          continueWatching={continueWatchingItems}
          becauseYouWatched={becauseYouWatchedItems}
          forYouItems={forYouItems}
          recsLoading={recsLoading}
          recsError={recsError}
          showGenreRows={true}
          top10Series={[]}
          trendingSeries={[]}
        />
      )}
    </div>
  );
}
