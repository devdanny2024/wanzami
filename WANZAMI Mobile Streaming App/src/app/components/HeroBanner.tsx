import { motion } from "motion/react";
import { Play, Plus, Info } from "lucide-react";
import { Movie } from "../data/mockData";

interface HeroBannerProps {
  movie: Movie;
  onPlay?: () => void;
  onInfo?: () => void;
}

export function HeroBanner({ movie, onPlay, onInfo }: HeroBannerProps) {
  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-2xl">
      {/* Background image */}
      <img
        src={movie.backdrop}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/80 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-12">
        {/* Wanzami Original badge */}
        {movie.isOriginal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2"
          >
            <span className="inline-block bg-[#FF6A00] text-white px-3 py-1 rounded text-xs font-semibold uppercase tracking-wide">
              Wanzami Original
            </span>
          </motion.div>
        )}
        
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl font-bold text-white mb-3 max-w-2xl"
        >
          {movie.title}
        </motion.h1>
        
        {/* Meta info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-4 text-sm"
        >
          <span className="text-[#FFB020] font-semibold">⭐ {movie.rating}</span>
          <span className="text-white">{movie.year}</span>
          <span className="text-[#A1A1AA]">•</span>
          <span className="text-white">{movie.duration}</span>
          <span className="text-[#A1A1AA]">•</span>
          <div className="flex gap-2">
            {movie.genre.slice(0, 2).map(g => (
              <span key={g} className="text-[#A1A1AA]">{g}</span>
            ))}
          </div>
        </motion.div>
        
        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/90 text-base max-w-xl mb-6 line-clamp-2"
        >
          {movie.description}
        </motion.p>
        
        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlay}
            className="flex items-center gap-2 bg-[#FF6A00] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#FF6A00]/90 transition-colors"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Play</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onInfo}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-semibold hover:bg-white/30 transition-colors border border-white/30"
          >
            <Info className="w-5 h-5" />
            <span>More Info</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}