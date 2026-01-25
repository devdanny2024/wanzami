import { Play, Video } from "lucide-react";
import { motion } from "motion/react";
import type { LiveEvent } from "@/lib/contentClient";

type LiveRowProps = {
  events: LiveEvent[];
  onSelect: (event: LiveEvent) => void;
};

export function LiveRow({ events, onSelect }: LiveRowProps) {
  if (!events.length) return null;

  return (
    <div className="px-4 md:px-12 lg:px-16 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white text-2xl">Live</h2>
        <span className="text-xs text-neutral-400">Now streaming and upcoming</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {events.map((event) => {
          const isLive = event.status === "LIVE";
          return (
            <motion.div
              key={event.id}
              className="relative group cursor-pointer flex-shrink-0 min-w-[260px] md:min-w-[320px] rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
              onClick={() => onSelect(event)}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative aspect-video bg-neutral-900">
                {event.thumbnailUrl ? (
                  <img src={event.thumbnailUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-500">
                    <Video className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${
                      isLive
                        ? "bg-red-500/20 text-red-300 border-red-500/40"
                        : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                    }`}
                  >
                    {isLive ? "Live Now" : "Scheduled"}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="w-14 h-14 rounded-full bg-[#fd7e14] shadow-lg shadow-[#fd7e14]/40 flex items-center justify-center">
                    <Play className="w-6 h-6 fill-current text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-white font-semibold line-clamp-1">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{event.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
