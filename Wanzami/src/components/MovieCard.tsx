import { useEffect, useRef, useState } from 'react';
import { Play, Info, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { getAvailabilityBadge, isComingSoon } from '@/lib/availability';

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
  shortTrailerUrl?: string | null;
  type?: string;
  createdAt?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
  completionPercent?: number;
  runtimeMinutes?: number | null;
  isPpv?: boolean;
  hasAccess?: boolean;
  ppvPriceNaira?: number | null;
  ppvCurrency?: string | null;
  currentEpisodeId?: string;
  currentEpisodeLabel?: string;
  resumePositionSec?: number;
  isOriginal?: boolean;
  availability?: "LIVE" | "COMING_SOON" | "LEAVING_SOON";
  availableFrom?: string | null;
  leavingAt?: string | null;
  assetVersions?: any;
  maturityRating?: string | null;
}

interface MovieCardProps {
  movie: MovieData;
  onClick: (movie: MovieData) => void;
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hoverTimerRef = useRef<number | null>(null);

  const isFree = (movie as any)?.isPpv === false;
  const ownedByCache = (() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem('wanzami:ppvOwned') ?? '[]';
      const list = JSON.parse(raw) as Array<string>;
      const key = String((movie as any)?.backendId ?? movie.id);
      return list.includes(key);
    } catch {
      return false;
    }
  })();
  const owned =
    isFree ||
    Boolean(
      (movie as any)?.isOwned ||
      (movie as any)?.owned ||
      (movie as any)?.hasAccess ||
      (movie as any)?.isPurchased ||
      (movie as any)?.purchaseStatus === 'OWNED' ||
      (movie as any)?.purchaseStatus === 'ACTIVE' ||
      typeof movie.completionPercent === 'number',
    ) ||
    ownedByCache;

  const availabilityBadge = getAvailabilityBadge(movie);
  const comingSoon = isComingSoon(movie);

  const hoverTrailerUrl = movie.shortTrailerUrl || movie.trailerUrl;
  const canHoverPlayTrailer = Boolean(
    hoverTrailerUrl &&
      typeof hoverTrailerUrl === 'string' &&
      // Keep it safe + lightweight: hover autoplay works best with direct MP4/WebM.
      // If you later want HLS (.m3u8), we can wire hls.js just for hover.
      !hoverTrailerUrl.includes('.m3u8'),
  );

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const handleEnter = () => {
    setIsHovered(true);
    if (!canHoverPlayTrailer) return;

    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(async () => {
      const v = videoRef.current;
      if (!v) return;
      try {
        v.currentTime = 0;
        await v.play();
      } catch {
        // Autoplay can still be blocked depending on browser/user settings.
      }
    }, 250);
  };

  const handleLeave = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);

    const v = videoRef.current;
    if (v) {
      v.pause();
      v.currentTime = 0;
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={movie.title}
      className="relative group cursor-pointer flex-shrink-0 w-full rounded-2xl border border-white/10 bg-graphite p-2 sm:p-2.5 hover:z-50 hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => onClick(movie)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(movie);
        }
      }}
      whileHover={{ scale: 1.06, y: -6 }}
      transition={{ duration: 0.18 }}
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-graphite-2">
        <ImageWithFallback
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover"
        />

        {/* Coming Soon / Leaving Soon badge */}
        {availabilityBadge && (
          <div
            className={`absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide shadow-lg backdrop-blur-sm ${
              availabilityBadge.kind === 'COMING_SOON'
                ? 'bg-sky-500/90 text-white'
                : 'bg-rose-500/90 text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            {availabilityBadge.label}
          </div>
        )}

        {/* Hover trailer preview (muted autoplay) */}
        {canHoverPlayTrailer && hoverTrailerUrl && (
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
            src={hoverTrailerUrl}
            muted
            playsInline
            preload="metadata"
            // loop feels closer to Netflix hover previews
            loop
          />
        )}

        {/* Play overlay for owned titles */}
        {owned && !comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-brand shadow-lg shadow-brand/40 flex items-center justify-center">
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-white" />
            </div>
          </div>
        )}

        {/* Hover border glow */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-xl border-2 border-brand pointer-events-none"
          />
        )}

        {/* Progress bar for continue watching */}
        {typeof movie.completionPercent === 'number' && movie.completionPercent >= 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20">
            <div
              className="h-full bg-brand"
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
      <div className="mt-2.5 flex items-center gap-2 justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-foreground text-sm font-medium line-clamp-1">{movie.title}</div>
          {(movie.rating || movie.genre) && (
            <div className="flex items-center gap-2 text-xs text-ash mt-1">
              {movie.rating && (
                <span className="text-brand border border-brand px-1.5 py-0.5 rounded shrink-0">
                  {movie.rating}
                </span>
              )}
              {movie.genre && <span className="line-clamp-1">{movie.genre}</span>}
            </div>
          )}
        </div>
        {/* External CTA */}
        {comingSoon ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(movie);
            }}
            aria-label={`${movie.title} — coming soon`}
            className="inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[40px] bg-white/10 text-foreground px-3 sm:px-4 py-2 rounded-lg text-sm font-medium border border-white/15 transition-colors active:scale-95"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Coming soon</span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(movie);
            }}
            aria-label={owned || isFree ? `Play ${movie.title}` : `Buy ${movie.title}`}
            className="inline-flex items-center justify-center gap-1.5 shrink-0 min-h-[40px] bg-brand hover:bg-brand-dark text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95"
          >
            {owned || isFree ? <Play className="w-4 h-4 fill-current" /> : <Info className="w-4 h-4" />}
            <span className="hidden sm:inline">{owned || isFree ? "Play" : "Buy"}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
