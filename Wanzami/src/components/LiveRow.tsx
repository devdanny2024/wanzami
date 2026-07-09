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
    <div className="mb-8 md:mb-10">
      <div className="container-page flex items-center justify-between gap-3 mb-3 md:mb-4">
        <h2 className="flex items-center gap-2 font-heading text-cs-ink tracking-wide uppercase text-2xl md:text-3xl">
          <span className="inline-block h-3 w-3 bg-cs-rust" aria-hidden="true" />Live
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-cs-muted shrink-0">Now streaming &amp; upcoming</span>
      </div>
      <div className="mx-auto w-full max-w-[96rem] flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-4 sm:px-6 lg:px-10 2xl:px-12">
        {events.map((event) => {
          const isLive = event.status === "LIVE";
          return (
            <motion.div
              key={event.id}
              className="relative group cursor-pointer flex-none snap-start w-[80%] sm:w-[48%] md:w-[40%] lg:w-[30%] xl:w-[24%] cs-border-thin bg-cs-panel overflow-hidden transition-shadow hover:cs-shadow"
              onClick={() => onSelect(event)}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative aspect-video bg-cs-ink">
                {event.thumbnailUrl ? (
                  <img src={event.thumbnailUrl} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cs-ink text-cs-paper/40">
                    <Video className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span
                    className={`font-mono text-[10px] uppercase tracking-wide px-2 py-1 border ${
                      isLive
                        ? "bg-red-500/90 text-white border-white/70"
                        : "bg-blue-500/90 text-white border-white/70"
                    }`}
                  >
                    {isLive ? "Live Now" : "Scheduled"}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand shadow-lg shadow-brand/40 flex items-center justify-center">
                    <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t-[1.5px] border-cs-ink">
                <p className="text-cs-ink font-semibold line-clamp-1">{event.title}</p>
                {event.description && (
                  <p className="text-xs text-cs-muted mt-1 line-clamp-2">{event.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
