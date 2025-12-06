import { Play, Plus, Share2, ThumbsUp, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MovieData } from './MovieCard';

interface MovieDetailPageProps {
  movie: any;
  onClose: () => void;
  onPlayClick: (movie: any) => void;
}

const relatedMovies: MovieData[] = [
  {
    id: 101,
    title: "Urban Tales",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    duration: "1h 55m"
  },
  {
    id: 102,
    title: "Cultural Roots",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    duration: "2h 10m"
  },
  {
    id: 103,
    title: "The Journey",
    image: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mzc5MjY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    duration: "1h 45m"
  },
  {
    id: 104,
    title: "Dance Revolution",
    image: "https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGFuY2UlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjM3OTI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    duration: "1h 52m"
  },
  {
    id: 105,
    title: "Power Struggle",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    duration: "2h 20m"
  },
  {
    id: 106,
    title: "Family Reunion",
    image: "https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwaGFwcHl8ZW58MXx8fHwxNzYzNzkyNjYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    duration: "1h 38m"
  }
];

export function MovieDetailPage({ movie, onClose, onPlayClick }: MovieDetailPageProps) {
  const isSeries = movie?.type === "SERIES";
  const seriesEpisodes = Array.isArray(movie?.episodes) ? movie.episodes : [];
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  const seasons = useMemo(() => {
    const distinct = Array.from(
      new Set(
        seriesEpisodes.map((ep: any) =>
          Number(ep?.seasonNumber ?? 1)
        )
      )
    ).sort((a, b) => Number(a) - Number(b));
    return distinct;
  }, [seriesEpisodes]);

  useEffect(() => {
    if (seasons.length && selectedSeason === null) {
      setSelectedSeason(seasons[0]);
    }
    if (seasons.length && selectedSeason && !seasons.includes(selectedSeason)) {
      setSelectedSeason(seasons[0]);
    }
  }, [seasons, selectedSeason]);

  const visibleEpisodes = useMemo(() => {
    if (!isSeries) return [];
    return seriesEpisodes
      .filter((ep: any) => {
        const seasonVal = Number(ep?.seasonNumber ?? 1);
        if (selectedSeason === null && seasons.length) {
          return seasonVal === Number(seasons[0]);
        }
        return selectedSeason === null ? true : seasonVal === selectedSeason;
      })
      .sort(
        (a: any, b: any) =>
          Number(a?.episodeNumber ?? 0) - Number(b?.episodeNumber ?? 0)
      );
  }, [isSeries, seriesEpisodes, selectedSeason, seasons]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black overflow-y-auto"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 w-10 h-10 bg-black/80 hover:bg-black rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/20"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Hero banner */}
      <div className="relative h-[70vh] md:h-[85vh]">
        <ImageWithFallback
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end pb-12 md:pb-16 px-4 md:px-12 lg:px-16">
          <div className="max-w-3xl space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-block px-3 py-1 bg-[#fd7e14]/20 border border-[#fd7e14] rounded-md backdrop-blur-sm mb-4">
                <span className="text-[#fd7e14] text-xs md:text-sm tracking-wider">WANZAMI ORIGINAL</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-4xl md:text-6xl lg:text-7xl tracking-tight"
            >
              {movie.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 text-sm md:text-base"
            >
              <span className="text-[#fd7e14] border border-[#fd7e14] px-2 py-0.5 rounded text-xs">
                {movie.rating || "16+"}
              </span>
              <span className="text-gray-300">{movie.year || "2024"}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">{movie.duration || "2h 15m"}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">{movie.genre || "Drama"}</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-300 text-sm md:text-lg max-w-2xl"
            >
              {movie.description || "An epic tale of ambition, power, and the price of success in modern Nigeria. Experience the gripping story that captivated millions."}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <button
                onClick={() => onPlayClick(movie)}
                className="flex items-center gap-2 bg-[#fd7e14] hover:bg-[#e86f0f] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl transition-all duration-200 hover:scale-105"
              >
                <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                <span className="text-sm md:text-base">Play</span>
              </button>

              <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl backdrop-blur-md border border-white/20 transition-colors">
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
                <span className="text-sm md:text-base">My List</span>
              </button>

              <button className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-colors">
                <ThumbsUp className="w-5 h-5" />
              </button>

              <button className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md border border-white/20 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Details section */}
      <div className="px-4 md:px-12 lg:px-16 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Episodes section (only for series) */}
          {isSeries && seriesEpisodes.length > 0 && (
            <div className="mb-12 space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-white text-xl md:text-2xl">Episodes</h2>
                {seasons.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Season</span>
                    <select
                      className="bg-gray-900 border border-gray-700 text-white text-sm rounded-md px-3 py-2"
                      value={selectedSeason ?? seasons[0]}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    >
                      {seasons.map((s) => (
                        <option key={s} value={s}>
                          Season {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {visibleEpisodes.map((episode: any, idx: number) => (
                  <motion.div
                    key={episode.id ?? idx}
                    className="group rounded-xl border border-gray-800 bg-gray-900/50 hover:border-[#fd7e14]/40 transition-all overflow-hidden"
                    whileHover={{ scale: 1.005 }}
                  >
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-5">
                      <div className="relative w-full md:w-48 h-28 md:h-32 overflow-hidden rounded-lg">
                        <ImageWithFallback
                          src={episode.thumbnailUrl || episode.posterUrl || movie.image}
                          alt={episode.name || episode.title || "Episode"}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <button
                          onClick={() => onPlayClick({ ...movie, currentEpisode: episode })}
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-12 h-12 rounded-full bg-[#fd7e14] shadow-lg shadow-[#fd7e14]/40 flex items-center justify-center">
                            <Play className="w-6 h-6 fill-current text-white" />
                          </div>
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-sm uppercase tracking-wide text-gray-400">
                              S{episode.seasonNumber ?? selectedSeason ?? "-"} · E{episode.episodeNumber ?? idx + 1}
                            </div>
                            <h3 className="text-white text-lg font-semibold leading-tight">
                              {episode.name ?? episode.title ?? `Episode ${idx + 1}`}
                            </h3>
                          </div>
                          <div className="text-sm text-gray-400 whitespace-nowrap">
                            {episode.runtimeMinutes ? `${episode.runtimeMinutes}m` : episode.duration || ""}
                          </div>
                        </div>
                        <div className="max-h-0 group-hover:max-h-40 transition-[max-height] duration-300 overflow-hidden">
                          <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                            {episode.synopsis ?? episode.description ?? "Episode details coming soon."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* More Like This */}
          <div>
            <h2 className="text-white mb-6 text-xl md:text-2xl">More Like This</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {relatedMovies.map((relatedMovie) => (
                <motion.div
                  key={relatedMovie.id}
                  className="group cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => onPlayClick(relatedMovie)}
                >
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-2">
                    <ImageWithFallback
                      src={relatedMovie.image}
                      alt={relatedMovie.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#fd7e14] flex items-center justify-center">
                        <Play className="w-6 h-6 fill-current text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-white text-sm mb-1 line-clamp-1">{relatedMovie.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="text-[#fd7e14] border border-[#fd7e14] px-1.5 py-0.5 rounded">
                      {relatedMovie.rating}
                    </span>
                    <span>{relatedMovie.duration}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
