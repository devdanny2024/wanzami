'use client';

import { useEffect, useState } from "react";
import { SearchPage } from "@/components/SearchPage";
import { fetchTitles } from "@/lib/contentClient";
import { MovieData } from "@/components/MovieCard";
import { ListSkeleton } from "@/components/Skeletons";

export default function SearchRoute() {
  const [catalogMovies, setCatalogMovies] = useState<MovieData[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-black">
      {catalogLoading ? (
        <ListSkeleton title="Search" />
      ) : (
        <SearchPage
          onMovieClick={(movie) => {
            const targetId = movie?.backendId ?? movie?.id;
            if (targetId) {
              window.location.href = `/title/${targetId}`;
            }
          }}
          movies={catalogMovies}
          loading={catalogLoading}
          error={catalogError}
        />
      )}
    </div>
  );
}
