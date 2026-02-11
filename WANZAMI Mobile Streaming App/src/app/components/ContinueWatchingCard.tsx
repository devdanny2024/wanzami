import { motion } from "motion/react";
import { Play } from "lucide-react";
import { Movie, Series } from "../data/mockData";

interface ContinueWatchingCardProps {
  item: Movie | Series;
  onClick?: () => void;
}

export function ContinueWatchingCard({ item, onClick }: ContinueWatchingCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0 w-80 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative rounded-lg overflow-hidden bg-[#14141B]">
        {/* Thumbnail */}
        <div className="relative aspect-video">
          <img
            src={item.backdrop}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 rounded-full bg-[#FF6A00] flex items-center justify-center"
            >
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </motion.div>
          </div>
          
          {/* Progress indicator */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-1 bg-[#1C1C25]">
              <div 
                className="h-full bg-[#FF6A00]"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Info */}
        <div className="p-3">
          <h3 className="text-white font-semibold truncate">{item.title}</h3>
          <p className="text-[#A1A1AA] text-sm mt-1">
            {item.progress}% watched • {item.duration} remaining
          </p>
        </div>
      </div>
    </motion.div>
  );
}