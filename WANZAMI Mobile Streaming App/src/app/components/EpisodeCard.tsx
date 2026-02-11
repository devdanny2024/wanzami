import { motion } from "motion/react";
import { Play } from "lucide-react";

interface Episode {
  number: number;
  title: string;
  duration: string;
  thumbnail: string;
  description: string;
  watched?: boolean;
}

interface EpisodeCardProps {
  episode: Episode;
  onClick?: () => void;
}

export function EpisodeCard({ episode, onClick }: EpisodeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-[#14141B] rounded-lg overflow-hidden cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex gap-3 p-3">
        {/* Episode thumbnail */}
        <div className="relative w-32 flex-shrink-0">
          <div className="aspect-video rounded overflow-hidden bg-[#1C1C25]">
            <img
              src={episode.thumbnail}
              alt={episode.title}
              className="w-full h-full object-cover"
            />
            
            {/* Play overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-[#E50914] flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
            
            {/* Watched indicator */}
            {episode.watched && (
              <div className="absolute bottom-1 left-1 bg-[#E50914] text-white px-2 py-0.5 rounded text-xs font-bold">
                ✓ Watched
              </div>
            )}
          </div>
        </div>
        
        {/* Episode info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <span className="text-[#A1A1AA] text-sm font-semibold">
              Episode {episode.number}
            </span>
            <span className="text-[#6B7280] text-xs">{episode.duration}</span>
          </div>
          
          <h3 className="text-white font-semibold mb-1 line-clamp-1">
            {episode.title}
          </h3>
          
          <p className="text-[#A1A1AA] text-sm line-clamp-2">
            {episode.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
