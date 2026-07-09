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
  const canPlay = (owned || isFree) && !comingSoon;

  // Price/access shown only on hover.
  const priceLabel =
    movie.ppvPriceNaira != null
      ? `${(movie.ppvCurrency ?? 'NGN') === 'NGN' ? '₦' : ''}${Number(movie.ppvPriceNaira).toLocaleString()}`
      : null;
  const accessLabel = isFree ? 'Free' : owned ? 'Owned' : priceLabel ?? 'Premium';
  const accessFree = isFree || owned;
  const ratingLabel = movie.rating || movie.maturityRating;
  const genreLabel = movie.genre || movie.genres?.[0];

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
      className="relative group cursor-pointer flex-shrink-0 w-full overflow-hidden bg-cs-ink cs-border-thin transition-shadow hover:cs-shadow hover:z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cs-rust"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={() => onClick(movie)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(movie);
        }
      }}
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ duration: 0.18 }}
    >
      <div className="relative aspect-video">
        <ImageWithFallback
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover"
        />

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
            loop
          />
        )}

        {/* Coming Soon / Leaving Soon badge */}
        {availabilityBadge && (
          <div
            className={`absolute top-2 left-2 z-20 inline-flex items-center gap-1 border border-white/70 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide shadow-lg ${
              availabilityBadge.kind === 'COMING_SOON' ? 'bg-sky-500/90 text-white' : 'bg-rose-500/90 text-white'
            }`}
          >
            <Clock className="w-3 h-3" />
            {availabilityBadge.label}
          </div>
        )}

        {/* Hover ring */}
        {isHovered && (
          <div className="absolute inset-0 z-20 ring-2 ring-cs-rust pointer-events-none" />
        )}

        {/* Resting title scrim — always readable, hides on hover for the reveal */}
        <div
          className={`absolute inset-x-0 bottom-0 z-10 p-2.5 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-150 ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="text-foreground text-[13px] font-medium line-clamp-1 drop-shadow">{movie.title}</div>
        </div>

        {/* Hover reveal — actions + access + meta */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 p-2.5 bg-gradient-to-t from-black via-black/85 to-transparent transition-opacity duration-150 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="text-foreground text-[13px] font-medium line-clamp-1 mb-1.5">{movie.title}</div>
          {comingSoon ? (
            <div className="flex items-center gap-1.5 text-[11px] text-sky-300">
              <Clock className="w-3.5 h-3.5" />
              {availabilityBadge?.label ?? 'Coming soon'}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1.5">
                {canPlay ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick(movie);
                    }}
                    aria-label={`Play ${movie.title}`}
                    className="w-8 h-8 rounded-full bg-brand hover:bg-brand-dark text-black flex items-center justify-center transition-colors"
                  >
                    <Play className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick(movie);
                    }}
                    aria-label={`Buy ${movie.title}`}
                    className="h-8 px-3 rounded-full bg-brand hover:bg-brand-dark text-black text-xs font-semibold flex items-center transition-colors"
                  >
                    {priceLabel ?? 'Buy'}
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick(movie);
                  }}
                  aria-label={`More info about ${movie.title}`}
                  className="w-8 h-8 rounded-full border border-white/30 text-white flex items-center justify-center hover:border-white/60 transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-ash">
                <span className={accessFree ? 'text-emerald-400 font-medium' : 'text-brand font-medium'}>
                  {accessLabel}
                </span>
                {ratingLabel && <span>· {ratingLabel}</span>}
                {genreLabel && <span className="line-clamp-1">· {genreLabel}</span>}
              </div>
            </>
          )}
        </div>

        {/* Progress bar for continue watching */}
        {typeof movie.completionPercent === 'number' && movie.completionPercent >= 0 && (
          <div className="absolute bottom-0 left-0 right-0 z-30 h-1.5 bg-white/20">
            <div
              className="h-full bg-brand"
              style={{
                width: `${Math.min(100, Math.max(4, movie.completionPercent * 100))}%`,
              }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
