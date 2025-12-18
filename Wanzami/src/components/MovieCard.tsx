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

  return (
    <motion.div
      className="relative group cursor-pointer flex-shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(movie)}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900">
        <ImageWithFallback
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlay on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"
        />

        {/* Hover content */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex flex-col justify-end p-4"
          >
            <h3 className="text-white mb-2 line-clamp-1">
              {movie.title}
            </h3>
            
            {movie.rating && (
              <div className="flex items-center gap-2 text-xs text-gray-300 mb-3">
                <span className="text-[#fd7e14] border border-[#fd7e14] px-1.5 py-0.5 rounded">
                  {movie.rating}
                </span>
                {movie.duration && <span>{movie.duration}</span>}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(movie);
                }}
                className="flex-1 flex items-center justify-center gap-1 bg-[#fd7e14] hover:bg-[#e86f0f] text-white px-3 py-2 rounded-lg text-xs transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Play</span>
              </button>
              
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg backdrop-blur-sm border border-white/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Border glow effect on hover */}
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

      {/* Title below card for mobile */}
      <div className="md:hidden mt-2 text-white text-sm line-clamp-1">
        {movie.title}
      </div>
    </motion.div>
  );
}
