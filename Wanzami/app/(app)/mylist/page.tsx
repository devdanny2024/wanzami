'use client';

import { useEffect, useMemo, useState } from "react";
import { fetchTitles } from "@/lib/contentClient";
import { MovieData } from "@/components/MovieCard";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { getMyListIds, removeFromMyList } from "@/lib/myList";
import { Trash2 } from "lucide-react";
import { motion } from "motion/react";

export default function MyListPage() {
  const [listIds, setListIds] = useState<string[]>([]);
  const [items, setItems] = useState<MovieData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setListIds(getMyListIds());
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!listIds.length) {
        setItems([]);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const storedCountry = typeof window !== "undefined" ? localStorage.getItem("countryCode") : null;
        const titles = await fetchTitles(storedCountry ?? "NG");
        if (!isMounted) return;
        const mapped: MovieData[] = titles
          .filter((t) => !t.archived && listIds.includes(String(t.id)))
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
        setItems(mapped);
      } catch (err: any) {
        if (isMounted) setError(err?.message ?? "Failed to load My List");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, [listIds]);

  const emptyState = useMemo(() => !loading && !items.length, [loading, items.length]);

  const handleRemove = (id?: string | number | null) => {
    if (id === undefined || id === null) return;
    removeFromMyList(id);
    setListIds((prev) => prev.filter((x) => x !== String(id)));
    setItems((prev) => prev.filter((m) => String(m.backendId ?? m.id) !== String(id)));
  };

  const handleOpen = (movie: MovieData) => {
    const targetId = movie?.backendId ?? movie?.id;
    if (targetId) {
      window.location.href = `/title/${targetId}`;
    }
  };

  return (
    <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12 px-4 md:px-12 lg:px-16">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-white text-3xl md:text-4xl">My List</h1>
          <p className="text-gray-400 mt-2">All titles you saved to watch later.</p>
        </div>
        {items.length > 0 && (
          <div className="text-sm text-gray-500">
            {items.length} item{items.length === 1 ? "" : "s"}
          </div>
        )}
      </div>

      {loading && <p className="text-gray-400">Loading your list...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {emptyState && (
        <div className="text-gray-400">
          You haven&apos;t added anything yet. Open a title and tap &quot;My List&quot; to save it here.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((movie) => (
            <motion.div
              key={movie.backendId ?? movie.id}
              className="group relative cursor-pointer"
              whileHover={{ scale: 1.03 }}
              onClick={() => handleOpen(movie)}
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
                <ImageWithFallback src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <button
                  className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/70 backdrop-blur border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(movie.backendId ?? movie.id);
                  }}
                  aria-label="Remove from My List"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-white text-sm font-semibold line-clamp-1">{movie.title}</p>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {movie.genre || movie.genres?.[0] || movie.type || "Title"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
