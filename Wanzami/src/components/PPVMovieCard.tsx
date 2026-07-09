import { useState } from 'react';
import { Play, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getCurrencySymbol } from '@/lib/currency';

export interface PPVMovieData {
  id: number;
  title: string;
  image: string;
  price: number;
  buyPrice?: number; // Purchase price
  currency: string;
  rating?: string;
  duration?: string;
  genre?: string;
  isPremiere?: boolean;
}

interface PPVMovieCardProps {
  movie: PPVMovieData;
  onClick: (movie: PPVMovieData) => void;
}

export function PPVMovieCard({ movie, onClick }: PPVMovieCardProps) {
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
      <div className="relative aspect-video overflow-hidden bg-cs-ink cs-border-thin transition-shadow group-hover:cs-shadow">
        {/* PPV Badge */}
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-1 px-2 py-1 bg-brand text-cs-ink font-mono text-[10px] font-bold uppercase tracking-wide border border-cs-ink">
            <Clock className="w-3 h-3" />
            <span>PPV</span>
          </div>
        </div>

        {/* Premiere Badge */}
        {movie.isPremiere && (
          <div className="absolute top-3 right-3 z-10">
            <div className="px-2 py-1 bg-yellow-500 text-black font-mono text-[10px] font-bold uppercase tracking-wide border border-cs-ink">
              PREMIERE
            </div>
          </div>
        )}

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
            <h3 className="text-foreground font-semibold mb-2 line-clamp-1">
              {movie.title}
            </h3>

            {movie.rating && (
              <div className="flex items-center gap-2 text-xs text-foreground/80 mb-3">
                <span className="text-brand border border-brand px-1.5 py-0.5 rounded">
                  {movie.rating}
                </span>
                {movie.duration && <span>{movie.duration}</span>}
              </div>
            )}

            {/* Price and Rent button */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/60 backdrop-blur-sm border border-brand/30 rounded-lg px-3 py-2">
                <div className="text-xs text-muted-foreground">Rent for 48h</div>
                <div className="text-brand font-semibold">
                  {movie.currency ? getCurrencySymbol(movie.currency) : '$'}
                  {movie.price.toLocaleString()}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(movie);
                }}
                className="flex items-center justify-center gap-1 bg-brand hover:bg-brand-dark text-primary-foreground px-4 py-3 min-h-[44px] rounded-lg transition-colors font-semibold"
              >
                <span className="text-sm">Rent</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Border glow effect on hover */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 border-2 border-cs-rust pointer-events-none"
          />
        )}
      </div>

      {/* Title and price below card for mobile */}
      <div className="md:hidden mt-2">
        <div className="text-cs-ink text-sm font-medium line-clamp-1 mb-1">{movie.title}</div>
        <div className="text-cs-rust text-sm font-semibold">
          {movie.currency ? getCurrencySymbol(movie.currency) : '$'}
          {movie.price.toLocaleString()}
        </div>
      </div>
    </motion.div>
  );
}
