'use client';

import { useEffect, useState } from "react";
import { HomePage } from "@/components/HomePage";
import { Footer } from "@/components/Footer";
import { HomeSkeleton } from "@/components/Skeletons";
import {
  fetchTitles,
  fetchPopularity,
  fetchContinueWatching,
  fetchBecauseYouWatched,
  fetchForYou,
} from "@/lib/contentClient";
import { MovieData } from "@/components/MovieCard";

export default function HomeRoute() {
  const [catalogMovies, setCatalogMovies] = useState<MovieData[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [top10, setTop10] = useState<MovieData[]>([]);
  const [trending, setTrending] = useState<MovieData[]>([]);
  const [continueWatchingItems, setContinueWatchingItems] = useState<any[]>([]);
  const [becauseYouWatchedItems, setBecauseYouWatchedItems] = useState<any[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadTitles = async () => {
      try {
        setCatalogLoading(true);
        setCatalogError(null);
        const storedCountry = typeof window !== "undefined" ? localStorage.getItem("countryCode") : null;
        const titles = await fetchTitles(storedCountry ?? "NG");
        if (!isMounted) return;
        const mapped = titles
          .filter((t) => !t.archived)
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
            } as MovieData;
          });
        setCatalogMovies(mapped);
      } catch (err: any) {
        const msg = err?.message ?? "Failed to load catalog";
        setCatalogError(msg);
      } finally {
        if (isMounted) setCatalogLoading(false);
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
          fetchPopularity({ type: "MOVIE", window: "DAILY" }),
          fetchPopularity({ type: "MOVIE", window: "TRENDING" }),
          fetchForYou(accessToken, profileId ?? undefined),
        ]);

        const mapItems = (ids: { titleId: string }[]) => {
          const mapped: MovieData[] = [];
          ids.forEach((item, idx) => {
            const match = catalogMovies.find((m) => m.backendId === item.titleId);
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
          setTop10(mapItems(top10Res.items ?? []));
          setTrending(mapItems(trendingRes.items ?? []));
          // Currently forYou not shown on home page; keep data for future use
          void forYouRes;
        }
      } catch (err: any) {
        const message = err?.name === "AbortError" ? "Recommendations timed out" : err?.message ?? "Failed to load recommendations";
        if (isMounted) setRecsError(message);
      } finally {
        if (isMounted) setRecsLoading(false);
      }
    };

    void loadRecs();
    return () => {
      isMounted = false;
    };
  }, [catalogMovies]);

  const handleMovieClick = async (movie: any) => {
    const targetId = movie?.backendId ?? movie?.id;
    if (targetId) {
      window.location.href = `/title/${targetId}`;
    }
  };

  const handlePlayClick = (movie: any) => {
    const targetId = movie?.backendId ?? movie?.id;
    if (targetId) {
      window.location.href = `/player/${targetId}`;
    }
  };

  const handleResumeClick = (movie: any) => {
    const targetId = movie?.backendId ?? movie?.id;
    if (targetId) {
      window.location.href = `/player/${targetId}`;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {catalogLoading ? (
        <HomeSkeleton />
      ) : (
        <HomePage
          onMovieClick={handleMovieClick}
          onContinueClick={handleResumeClick}
          movies={catalogMovies}
          loading={catalogLoading}
          error={catalogError}
          top10={top10}
          trending={trending}
          continueWatching={continueWatchingItems}
          becauseYouWatched={becauseYouWatchedItems}
          recsLoading={recsLoading}
          recsError={recsError}
        />
      )}
      <Footer />
    </div>
  );
}
