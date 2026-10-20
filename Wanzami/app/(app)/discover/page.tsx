'use client';

import { Suspense, useEffect, useState } from "react";
import { DiscoverPage } from "@/components/DiscoverPage";
import { fetchTitles, type Title } from "@/lib/contentClient";
import type { MovieData } from "@/components/MovieCard";
import { ListSkeleton } from "@/components/Skeletons";

export default function DiscoverRoute() {
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const storedCountry = typeof window !== "undefined" ? localStorage.getItem("countryCode") : null;
        const list = await fetchTitles(storedCountry ?? "NG");
        if (isMounted) setTitles(list);
      } catch (err: any) {
        if (isMounted) setError(err?.message ?? "Failed to load catalog");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMovieClick = (movie: MovieData) => {
    const targetId = movie?.backendId ?? movie?.id;
    if (targetId) window.location.href = `/title/${targetId}`;
  };

  return (
    <Suspense fallback={<ListSkeleton title="Discover" />}>
      <DiscoverPage titles={titles} loading={loading} error={error} onMovieClick={handleMovieClick} />
    </Suspense>
  );
}
