import { motion } from "motion/react";
import { Play, Plus } from "lucide-react";
import { Movie, Series } from "../data/mockData";

interface MoviePosterCardProps {
  item: Movie | Series;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
}

export function MoviePosterCard({ item, size = "medium", onClick }: MoviePosterCardProps) {
  const sizeClasses = {
    small: "w-28 h-40",
    medium: "w-36 h-52",
    large: "w-44 h-64"
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ duration: 0.2 }}
      className={`${sizeClasses[size]} flex-shrink-0 cursor-pointer relative group`}
      onClick={onClick}
    >
      <div className="relative w-full h-full rounded-lg overflow-hidden">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        
        {/* Rating badge */}
        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs text-[#FFB020]">
          ⭐ {item.rating}
        </div>
        
        {/* Progress bar for continue watching */}
        {item.progress && item.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1C1C25]">
            <div 
              className="h-full bg-[#FF6A00]"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
        
        {/* Hover overlay with controls */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="w-12 h-12 rounded-full bg-[#FF6A00] flex items-center justify-center mb-2"
          >
            <Play className="w-5 h-5 text-white fill-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            className="w-8 h-8 rounded-full bg-[#14141B] border border-white/30 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>
      
      {/* Title below poster */}
      <div className="mt-2 px-1">
        <h4 className="text-white text-sm truncate">{item.title}</h4>
        <p className="text-[#A1A1AA] text-xs">{item.year}</p>
      </div>
    </motion.div>
  );
}