'use client';

import { useEffect, useState } from "react";
import { HomePage } from "@/components/HomePage";
import { HomeSkeleton } from "@/components/Skeletons";
import {
  fetchTitles,
  fetchPopularity,
  fetchContinueWatching,
  fetchBecauseYouWatched,
  fetchForYou,
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
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

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
            const primaryGenre = title.genres?.[0];
            const displayRating = title.maturityRating ?? "PG";
            return {
              id: safeId,
              backendId: title.id,
              title: title.name,
              image: title.thumbnailUrl || title.posterUrl || fallbackImage,
              description: title.description,
              rating: displayRating,
              type: title.type,
              genres: title.genres,
              runtimeMinutes: title.runtimeMinutes ?? 0,
              trailerUrl: title.trailerUrl,
              posterUrl: title.posterUrl,
              thumbnailUrl: title.thumbnailUrl,
              maturityRating: title.maturityRating,
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
          setContinueWatchingItems(cw.items ?? []);
        }

        const byw = await fetchBecauseYouWatched(accessToken, profileId ?? undefined);
        if (isMounted) setBecauseYouWatchedItems(byw.items ?? []);

        const [top10Res, trendingRes, forYouRes] = await Promise.all([
          fetchPopularity({ type: "SERIES", window: "DAILY" }),
          fetchPopularity({ type: "SERIES", window: "TRENDING" }),
          fetchForYou(accessToken, profileId ?? undefined),
        ]);

        const mapItems = (ids: { titleId: string }[]) => {
          const mapped: MovieData[] = [];
          ids.forEach((item, idx) => {
            const match = series.find((m) => m.backendId === item.titleId);
            if (match) {
              mapped.push(match);
            } else {
              mapped.push({
                id: Number(item.titleId) || Date.now() + idx,
                backendId: item.titleId,
                title: `Title ${item.titleId}`,
                image: "https://placehold.co/600x900/111111/FD7E14?text=Wanzami",
              } as MovieData);
            }
          });
          return mapped;
        };

        if (isMounted) {
          setTop10Series(mapItems(top10Res.items ?? []));
          setTrendingSeries(mapItems(trendingRes.items ?? []));
          void forYouRes;
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
    <div className="min-h-screen bg-black">
      {loading ? (
        <HomeSkeleton />
      ) : (
        <HomePage
          onMovieClick={handleSeriesClick}
          onContinueClick={handleResumeClick}
          movies={series}
          loading={loading}
          error={error}
          top10={[]}
          trending={[]}
          top10Series={top10Series}
          trendingSeries={trendingSeries}
          continueWatching={continueWatchingItems}
          becauseYouWatched={becauseYouWatchedItems}
          recsLoading={recsLoading}
          recsError={recsError}
        />
      )}
    </div>
  );
}
