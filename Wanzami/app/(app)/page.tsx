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

export default function HomeRoute() {
  const [catalogMovies, setCatalogMovies] = useState<MovieData[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [top10, setTop10] = useState<MovieData[]>([]);
  const [top10Series, setTop10Series] = useState<MovieData[]>([]);
  const [trending, setTrending] = useState<MovieData[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<MovieData[]>([]);
  const [continueWatchingItems, setContinueWatchingItems] = useState<any[]>([]);
  const [becauseYouWatchedItems, setBecauseYouWatchedItems] = useState<any[]>([]);
  const [forYouItems, setForYouItems] = useState<MovieData[]>([]);
  const [originals, setOriginals] = useState<MovieData[]>([]);
  const [newNoteworthy, setNewNoteworthy] = useState<MovieData[]>([]);
  const [hiddenGems, setHiddenGems] = useState<MovieData[]>([]);
  const [freshForYou, setFreshForYou] = useState<MovieData[]>([]);
  const [similarToLikes, setSimilarToLikes] = useState<MovieData[]>([]);
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
        // Ignore aborts from route changes / React re-renders so we don't
        // show scary errors like "signal is aborted without reason".
        if (err?.name === "AbortError") {
          if (isMounted) setCatalogError(null);
          return;
        }
        const msg = err?.message ?? "Failed to load catalog";
        if (isMounted) setCatalogError(msg);
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
          const rawItems = (cw.items ?? []) as any[];
          const cwMapped: MovieData[] = [];
          const fallbackImage = "https://placehold.co/600x900/111111/FD7E14?text=Wanzami";
          let localProgress: Record<
            string,
            {
              completionPercent?: number;
              updatedAt?: number;
            }
          > = {};

          if (typeof window !== "undefined") {
            try {
              const raw = window.localStorage.getItem("wanzami:cw-progress");
              if (raw && typeof raw === "string") {
                localProgress = JSON.parse(raw) as typeof localProgress;
              }
            } catch {
              localProgress = {};
            }
          }

          rawItems.forEach((item, idx) => {
            const backendIdRaw = item.titleId ?? item.id;
            if (!backendIdRaw) return;
            const backendId = String(backendIdRaw);

            const match = catalogMovies.find((m) => m.backendId === backendId);

            const completion =
              typeof item.completionPercent === "number"
                ? item.completionPercent
                : typeof item.progressPercent === "number"
                ? item.progressPercent
                : typeof item.percent_complete === "number"
                ? item.percent_complete
                : undefined;
            const local = localProgress[String(backendId)];
            const localCompletion =
              typeof local?.completionPercent === "number"
                ? Math.max(0, Math.min(1, local.completionPercent))
                : undefined;
            const mergedCompletion =
              typeof completion === "number" && typeof localCompletion === "number"
                ? Math.max(0, Math.min(1, Math.max(completion, localCompletion)))
                : typeof completion === "number"
                ? Math.max(0, Math.min(1, completion))
                : localCompletion;

            // Try to find a resume position in seconds, falling back to
            // completion percent + runtime minutes when available.
            const runtimeMinutes =
              (match?.runtimeMinutes as number | null | undefined) ??
              (item.runtimeMinutes as number | null | undefined) ??
              null;
            let resumePositionSec: number | undefined;
            if (typeof item.positionSec === "number") {
              resumePositionSec = item.positionSec;
            } else if (typeof item.resumePositionSec === "number") {
              resumePositionSec = item.resumePositionSec;
            } else if (typeof item.lastPositionSec === "number") {
              resumePositionSec = item.lastPositionSec;
            } else if (typeof item.metadata?.positionSec === "number") {
              resumePositionSec = item.metadata.positionSec;
            } else if (typeof completion === "number" && runtimeMinutes && runtimeMinutes > 0) {
              resumePositionSec = (mergedCompletion ?? completion) * (runtimeMinutes * 60);
            }

            if (match) {
              cwMapped.push({
                ...match,
                completionPercent: mergedCompletion ?? completion ?? match.completionPercent,
                // used only for client-side sorting; stripped after
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(local?.updatedAt ? ({ __localUpdatedAt: local.updatedAt } as any) : {}),
                resumePositionSec: resumePositionSec ?? match.resumePositionSec,
              });
            } else {
              cwMapped.push({
                id: Number(backendId) || Date.now() + idx,
                backendId,
                title: item.name ?? `Title ${backendId}`,
                image: item.thumbnailUrl || item.posterUrl || fallbackImage,
                type: (item.type as any) ?? "MOVIE",
                runtimeMinutes,
                genres: item.genres,
                maturityRating: item.maturityRating ?? "PG",
                isOriginal: item.isOriginal ?? false,
                completionPercent: mergedCompletion ?? completion,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(local?.updatedAt ? ({ __localUpdatedAt: local.updatedAt } as any) : {}),
                resumePositionSec,
              } as MovieData);
            }
          });

          const sortedCw = cwMapped
            .slice()
            // sort by local updatedAt when available so the last
            // watched title appears first even if the backend
            // snapshot lags briefly.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sort((a: any, b: any) => {
              const aTs = typeof a.__localUpdatedAt === "number" ? a.__localUpdatedAt : 0;
              const bTs = typeof b.__localUpdatedAt === "number" ? b.__localUpdatedAt : 0;
              return bTs - aTs;
            })
            // strip helper field before storing
            .map((item: any) => {
              const { __localUpdatedAt, ...rest } = item;
              return rest;
            });

          setContinueWatchingItems(sortedCw);
        }

        const [top10Res, trendingRes, top10SeriesRes, trendingSeriesRes, forYouRes] =
          await Promise.all([
            fetchPopularity({ type: "MOVIE", window: "DAILY" }),
            fetchPopularity({ type: "MOVIE", window: "TRENDING" }),
            fetchPopularity({ type: "SERIES", window: "DAILY" }),
            fetchPopularity({ type: "SERIES", window: "TRENDING" }),
            fetchForYou(accessToken, profileId ?? undefined),
          ]);

        // Helper that can handle both popularity snapshots ({ titleId })
        // and recommendation payloads ({ id, name, ... }).
        // We only surface items that have a matching title in the
        // current catalog so the UI never shows "ghost" titles that
        // no longer exist in the backend.
        const mapItems = (
          items: Array<
            {
              titleId?: string;
              id?: string;
              name?: string;
              posterUrl?: string | null;
              thumbnailUrl?: string | null;
              type?: string;
              runtimeMinutes?: number | null;
              genres?: string[];
              maturityRating?: string | null;
              isOriginal?: boolean | null;
            }
          > = [],
        ) => {
          const mapped: MovieData[] = [];

          items.forEach((item, idx) => {
            const backendIdRaw = item.titleId ?? item.id;
            if (!backendIdRaw) return;
            const backendId = String(backendIdRaw);

            const match = catalogMovies.find((m) => m.backendId === backendId);
            if (match) {
              mapped.push(match);
            }
          });
          return mapped;
        };

        if (isMounted) {
          const becauseRaw = (await fetchBecauseYouWatched(accessToken, profileId ?? undefined)).items ?? [];
          const becauseMapped = mapItems(becauseRaw as any[]);
          setBecauseYouWatchedItems(becauseMapped);

          setTop10(mapItems(top10Res.items ?? []));
          setTrending(mapItems(trendingRes.items ?? []));
          setTop10Series(mapItems(top10SeriesRes.items ?? []));
          setTrendingSeries(mapItems(trendingSeriesRes.items ?? []));
          const fyItems = mapItems((forYouRes?.items as any[]) ?? []);
          setForYouItems(fyItems);

          const originalsList = catalogMovies.filter((m) => m.isOriginal).slice(0, 18);
          setOriginals(originalsList);

          const byRecency = [...catalogMovies]
            .filter((m) => m.createdAt)
            .sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0));
          setNewNoteworthy(byRecency.slice(0, 18));

          // Hidden gems: not in top10/trending sets and take lower popularity slice
          const popularityIds = new Set<string>([
            ...((top10Res.items ?? []).map((i: any) => String(i.titleId))),
            ...((trendingRes.items ?? []).map((i: any) => String(i.titleId))),
            ...((top10SeriesRes.items ?? []).map((i: any) => String(i.titleId))),
            ...((trendingSeriesRes.items ?? []).map((i: any) => String(i.titleId))),
          ]);
          const hidden = catalogMovies
            .filter((m) => !popularityIds.has(String(m.backendId)))
            .slice(0, 18);
          setHiddenGems(hidden);

          // Fresh for you: random shuffle of catalog minus seen ids
          const shuffled = [...catalogMovies].sort(() => Math.random() - 0.5);
          setFreshForYou(shuffled.slice(0, 18));

          // Similar to likes: reuse because-you-watched anchors list
          setSimilarToLikes(becauseMapped);
        }
      } catch (err: any) {
        const message = err?.name === "AbortError" ? "Recommendations timed out" : err?.message ?? "Failed to load recommendations";
        if (isMounted) setRecsError(message);
      } finally {
        if (isMounted) setRecsLoading(false);
      }
    };

    // Initial load
    void loadRecs();

    // Re-load recs (including Continue Watching) whenever the window/tab
    // becomes active again so that when a user returns from the player via
    // Back, the home page immediately reflects the latest progress.
    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void loadRecs();
      }
    };
    const handleFocus = () => {
      void loadRecs();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleVisibility);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleVisibility);
      }
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
      const resume = (movie as any)?.resumePositionSec;
      if (typeof resume === "number" && resume > 0) {
        const safe = Math.max(0, Math.floor(resume));
        window.location.href = `/player/${targetId}?startTime=${safe}`;
      } else {
        window.location.href = `/player/${targetId}`;
      }
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
          top10Series={top10Series}
          trending={trending}
          trendingSeries={trendingSeries}
          continueWatching={continueWatchingItems}
          becauseYouWatched={becauseYouWatchedItems}
          forYouItems={forYouItems}
          originals={originals}
          newNoteworthy={newNoteworthy}
          hiddenGems={hiddenGems}
          freshForYou={freshForYou}
          similarToLikes={similarToLikes}
          recsLoading={recsLoading}
          recsError={recsError}
          showGenreRows={false}
        />
      )}
    </div>
  );
}
