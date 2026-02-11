import { motion } from "motion/react";
import { Eye, Users } from "lucide-react";
import { LiveStream } from "../data/mockData";

interface LiveStreamCardProps {
  stream: LiveStream;
  onClick?: () => void;
}

export function LiveStreamCard({ stream, onClick }: LiveStreamCardProps) {
  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0 w-72 cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative rounded-xl overflow-hidden bg-[#14141B]">
        {/* Thumbnail */}
        <div className="relative aspect-video">
          <img
            src={stream.thumbnail}
            alt={stream.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
          
          {/* Live badge */}
          {stream.isLive && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-3 left-3 bg-[#FF6A00] text-white px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Live
            </motion.div>
          )}
          
          {/* Viewer count */}
          {stream.isLive && (
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatViewerCount(stream.viewerCount)}
            </div>
          )}
          
          {/* Scheduled time badge */}
          {!stream.isLive && stream.scheduledTime && (
            <div className="absolute top-3 left-3 bg-[#FFB020] text-[#0B0B0F] px-3 py-1 rounded-full text-xs font-bold">
              {stream.scheduledTime}
            </div>
          )}
          
          {/* Category tag */}
          <div className="absolute bottom-3 left-3 bg-white/20 backdrop-blur-sm text-white px-2.5 py-1 rounded text-xs font-semibold border border-white/30">
            {stream.category}
          </div>
        </div>
        
        {/* Info */}
        <div className="p-3">
          <h3 className="text-white font-semibold line-clamp-2 mb-1">
            {stream.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[#A1A1AA] text-sm">
            <Users className="w-3.5 h-3.5" />
            <span>{stream.hostName}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}