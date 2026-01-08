import { useState } from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export interface MovieData {
  id: number;
  backendId?: string;
  title: string;
  image: string;
  rating?: string;
  duration?: string;
  genre?: string;
  genres?: string[];
  description?: string | null;
  year?: string | number;
  trailerUrl?: string | null;
  type?: string;
  createdAt?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  completionPercent?: number;
  runtimeMinutes?: number | null;
  currentEpisodeId?: string;
  currentEpisodeLabel?: string;
  resumePositionSec?: number;
  isOriginal?: boolean;
  assetVersions?: any;
  maturityRating?: string | null;
}

interface MovieCardProps {
  movie: MovieData;
  onClick: (movie: MovieData) => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const owned =
    Boolean(
      (movie as any)?.isOwned ||
      (movie as any)?.owned ||
      (movie as any)?.hasAccess ||
      (movie as any)?.isPurchased ||
      (movie as any)?.purchaseStatus === 'OWNED' ||
      (movie as any)?.purchaseStatus === 'ACTIVE' ||
      typeof movie.completionPercent === 'number',
    );

  return (
    <motion.div
      className="relative group cursor-pointer flex-shrink-0 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(movie)}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative aspect-[16/7] sm:aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-gray-900">
        <ImageWithFallback
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover"
        />

        {/* Play overlay for owned titles */}
        {owned && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full bg-[#fd7e14] shadow-lg shadow-[#fd7e14]/40 flex items-center justify-center">
              <Play className="w-6 h-6 fill-current text-white" />
            </div>
          </div>
        )}

        {/* Hover border glow */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-xl border-2 border-[#fd7e14] pointer-events-none"
          />
        )}

        {/* Progress bar for continue watching */}
        {typeof movie.completionPercent === 'number' && movie.completionPercent >= 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
            <div
              className="h-full bg-[#fd7e14]"
              style={{
                // Clamp progress so that any tracked title shows at least
                // a small visible bar, instead of disappearing when the
                // completion value is very small.
                width: `${Math.min(
                  100,
                  Math.max(4, movie.completionPercent * 100),
                )}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Title, meta, and CTA */}
      <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-white text-xs sm:text-sm line-clamp-1">{movie.title}</div>
          {(movie.rating || movie.genre) && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 mt-1">
              {movie.rating && (
                <span className="text-[#fd7e14] border border-[#fd7e14] px-1.5 py-0.5 rounded">
                  {movie.rating}
                </span>
              )}
              {movie.genre && <span className="line-clamp-1">{movie.genre}</span>}
            </div>
          )}
        </div>
        {/* External CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick(movie);
          }}
          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-[#fd7e14] hover:bg-[#e86f0f] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors"
        >
          {owned ? <Play className="w-4 h-4 fill-current" /> : <Info className="w-4 h-4" />}
          <span>{owned ? "Play" : "Buy"}</span>
        </button>
      </div>
    </motion.div>
  );
}
