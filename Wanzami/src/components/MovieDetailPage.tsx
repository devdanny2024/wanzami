'use client';

import { Play, Plus, Share2, ThumbsUp, X, Lock, Volume2, VolumeX, Clock } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MovieCard, MovieData } from './MovieCard';
import { isInMyList, toggleMyList } from '@/lib/myList';
import { fetchTitles, type Title } from '@/lib/contentClient';
import { formatMoney } from '@/lib/currency';
import { getAvailabilityBadge, isComingSoon } from '@/lib/availability';
import { CsButton, Sticker } from './cs/kit';

interface MovieDetailPageProps {
  movie: any;
  onPlayClick: (movie: any) => void;
  onBuyClick?: () => void;
  ppvInfo?: {
    isPpv: boolean;
    hasAccess: boolean;
    priceNaira?: number | null;
    currency?: string | null;
    userPpvBanned?: boolean;
  };
}

type RelatedItem = Title | MovieData | any;

export function MovieDetailPage({ movie, onPlayClick, onBuyClick, ppvInfo }: MovieDetailPageProps) {
  const isSeries = movie?.type === 'SERIES';
  const seriesEpisodes = Array.isArray(movie?.episodes) ? movie.episodes : [];
  const seriesSeasons = Array.isArray((movie as any)?.seasons) ? (movie as any).seasons : [];
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [inList, setInList] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const [related, setRelated] = useState<RelatedItem[]>([]);
  const [liked, setLiked] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [heroMuted, setHeroMuted] = useState(true);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('countryCode');
      setCountry(stored ?? 'NG');
    }
  }, []);

  useEffect(() => {
    const loadRelated = async () => {
      try {
        const titles = await fetchTitles(country ?? undefined);
        const primaryGenre = movie?.genre || movie?.genres?.[0];
        const filtered = titles
          .filter((t) => t.id !== (movie?.backendId ?? movie?.id))
          .filter((t) => {
            if (!primaryGenre) return true;
            return (t.genres ?? []).includes(primaryGenre);
          })
          .slice(0, 10);
        setRelated(filtered);
      } catch (err) {
        setRelated([]);
      }
    };
    void loadRelated();
  }, [country, movie]);

  useEffect(() => {
    const heroVideo = heroVideoRef.current;
    if (!heroVideo) return;
    if (showTrailerModal) {
      heroVideo.pause();
    } else {
      void heroVideo.play().catch(() => undefined);
    }
  }, [showTrailerModal]);

  useEffect(() => {
    const targetId = movie?.backendId ?? movie?.id;
    setInList(isInMyList(targetId));
    if (typeof window !== 'undefined' && targetId) {
      try {
        const likedMap = JSON.parse(window.localStorage.getItem('wanzami:likes') ?? '{}') as Record<string, boolean>;
        setLiked(Boolean(likedMap[targetId]));
      } catch {
        setLiked(false);
      }
    }
  }, [movie]);

  const seasonNumbers = useMemo<number[]>(() => {
    const fromSeasons = seriesSeasons.map((s: any) => Number(s?.seasonNumber ?? 1));
    const source = fromSeasons.length ? fromSeasons : seriesEpisodes.map((ep: any) => Number(ep?.seasonNumber ?? 1));
    const distinct: number[] = Array.from<number>(new Set<number>(source)).sort((a, b) => a - b);
    return distinct;
  }, [seriesEpisodes, seriesSeasons]);

  useEffect(() => {
    const firstSeason = seasonNumbers.length ? Number(seasonNumbers[0]) : null;
    if (firstSeason !== null && selectedSeason === null) {
      setSelectedSeason(firstSeason);
    }
    if (firstSeason !== null && selectedSeason !== null && !seasonNumbers.includes(selectedSeason)) {
      setSelectedSeason(firstSeason);
    }
  }, [seasonNumbers, selectedSeason]);

  const visibleEpisodes = useMemo(() => {
    if (!isSeries) return [];
    return seriesEpisodes
      .filter((ep: any) => {
        const seasonVal = Number(ep?.seasonNumber ?? 1);
        if (selectedSeason === null && seasonNumbers.length) {
          return seasonVal === Number(seasonNumbers[0]);
        }
        return selectedSeason === null ? true : seasonVal === selectedSeason;
      })
      .sort((a: any, b: any) => Number(a?.episodeNumber ?? 0) - Number(b?.episodeNumber ?? 0));
  }, [isSeries, seriesEpisodes, selectedSeason, seasonNumbers]);

  const relatedItems: RelatedItem[] = useMemo(() => {
    if (Array.isArray(related) && related.length > 0) return related;
    if (Array.isArray((movie as any)?.related) && (movie as any).related.length) return (movie as any).related;
    return [];
  }, [related, movie]);

  const qualityBadges = useMemo(() => {
    const badges: string[] = [];
    const versions = (movie as any)?.assetVersions ?? [];
    const versionText = Array.isArray(versions) ? versions.join(',').toLowerCase() : String(versions ?? '').toLowerCase();
    if (versionText.includes('4k') || versionText.includes('uhd')) badges.push('4K');
    if (versionText.includes('1080') || versionText.includes('full')) badges.push('Full HD');
    if (versionText.includes('hdr')) badges.push('HDR');
    if (versionText.includes('atmos') || versionText.includes('dolby')) badges.push('Dolby Atmos');
    if (badges.length === 0) {
      badges.push('4K', 'Full HD', 'Dolby Atmos');
    }
    return badges;
  }, [movie]);

  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setShareError(null);
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const title = movie?.title ?? 'Wanzami title';
    try {
      if (navigator.share) {
        await navigator.share({ title, url: shareUrl });
      } else if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
      }
    } catch (err: any) {
      setShareError(err?.message ?? 'Unable to share right now.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleLikeToggle = () => {
    const targetId = movie?.backendId ?? movie?.id;
    if (!targetId || typeof window === 'undefined') return;
    let likedMap: Record<string, boolean> = {};
    try {
      likedMap = JSON.parse(window.localStorage.getItem('wanzami:likes') ?? '{}') as Record<string, boolean>;
    } catch {
      likedMap = {};
    }
    const nextLiked = !liked;
    likedMap[targetId] = nextLiked;
    window.localStorage.setItem('wanzami:likes', JSON.stringify(likedMap));
    setLiked(nextLiked);
  };

  const hardBtn =
    'inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.07em] text-sm min-h-[44px] px-6 md:px-8 py-3 md:py-4 border-2 transition-transform hover:-translate-y-0.5 active:translate-y-px';
  const hardIconBtn =
    'flex items-center justify-center w-12 h-12 md:w-14 md:h-14 border-2 transition-transform hover:-translate-y-0.5 active:translate-y-px';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Hero banner — bordered box on paper, matching the homepage hero */}
      <div className="container-page pt-6 md:pt-10">
        <div className="relative cs-border cs-shadow bg-cs-ink overflow-hidden aspect-[16/9] md:aspect-[21/9]">
          {movie.shortTrailerUrl || movie.trailerUrl ? (
            <video
              className="w-full h-full object-cover"
              ref={heroVideoRef}
              src={movie.shortTrailerUrl || movie.trailerUrl}
              autoPlay
              muted={heroMuted}
              loop
              playsInline
              poster={movie.image}
            />
          ) : (
            <ImageWithFallback src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          {/* Hero mute toggle */}
          {movie.shortTrailerUrl || movie.trailerUrl ? (
            <button
              onClick={() => setHeroMuted((m) => !m)}
              className="absolute bottom-4 right-4 z-20 w-11 h-11 bg-cs-ink border-2 border-cs-paper flex items-center justify-center text-cs-paper transition hover:bg-cs-rust hover:border-cs-rust"
              aria-label={heroMuted ? 'Unmute trailer' : 'Mute trailer'}
            >
              {heroMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          ) : null}

          {/* Content */}
          <div className="absolute inset-0 flex items-end p-6 md:p-10">
            <div className="max-w-3xl space-y-4 md:space-y-6">
              {movie?.isOriginal ? (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Sticker>Wanzami Original</Sticker>
                </motion.div>
              ) : null}

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-heading uppercase text-cs-paper text-4xl md:text-6xl lg:text-7xl tracking-wide leading-[0.9]"
              >
                {movie.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-3 md:gap-4 text-sm flex-wrap font-mono"
              >
                <span className="text-brand border-2 border-brand px-2 py-0.5 text-xs font-bold uppercase">{movie.rating || '16+'}</span>
                <span className="text-cs-paper/80">{movie.year || '2024'}</span>
                <span className="text-cs-paper/40">·</span>
                <span className="text-cs-paper/80">{movie.duration || '2h 15m'}</span>
                <span className="text-cs-paper/40">·</span>
                <span className="text-cs-paper/80">{movie.genre || 'Drama'}</span>
                <div className="flex items-center gap-2">
                  {qualityBadges.map((badge) => (
                    <span key={badge} className="text-[10px] font-bold uppercase tracking-wide text-cs-paper border border-cs-paper/40 px-2 py-1">
                      {badge}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-cs-paper/80 text-sm md:text-lg max-w-2xl"
              >
                {movie.description ||
                  'An epic tale of ambition, power, and the price of success in modern Nigeria. Experience the gripping story that captivated millions.'}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-3 pt-2"
              >
                {isComingSoon(movie) ? (
                  <div className={`${hardBtn} border-cs-paper text-cs-paper`}>
                    <Clock className="w-5 h-5" />
                    <span>{getAvailabilityBadge(movie)?.label ?? 'Coming Soon'}</span>
                  </div>
                ) : ppvInfo?.userPpvBanned ? (
                  <div className="text-sm text-cs-paper border-2 border-cs-rust px-4 py-3 max-w-md font-mono">
                    Your account has been restricted from PPV access. Please contact support.
                  </div>
                ) : ppvInfo?.isPpv && !ppvInfo?.hasAccess ? (
                  <CsButton variant="rust" onClick={() => onBuyClick?.()}>
                    <Play className="w-5 h-5 fill-current" />
                    Buy now {formatMoney(ppvInfo?.priceNaira ?? undefined, ppvInfo?.currency ?? undefined)}
                  </CsButton>
                ) : (
                  <CsButton variant="rust" onClick={() => onPlayClick(movie)}>
                    <Play className="w-5 h-5 fill-current" />
                    Play
                  </CsButton>
                )}

                {movie?.trailerUrl && (
                  <button
                    onClick={() => setShowTrailerModal(true)}
                    className={`${hardBtn} border-cs-paper text-cs-paper hover:bg-cs-paper hover:text-cs-ink`}
                  >
                    <Play className="w-5 h-5" />
                    Watch Trailer
                  </button>
                )}

                <button
                  onClick={() => {
                    const targetId = movie?.backendId ?? movie?.id;
                    const nextVal = toggleMyList(targetId);
                    setInList(nextVal);
                  }}
                  className={`${hardBtn} ${
                    inList ? 'bg-cs-rust border-cs-rust text-cs-paper' : 'border-cs-paper text-cs-paper hover:bg-cs-paper hover:text-cs-ink'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  {inList ? 'Added' : 'My List'}
                </button>

                <button
                  onClick={handleLikeToggle}
                  className={`${hardIconBtn} ${
                    liked ? 'bg-cs-rust border-cs-rust text-cs-paper' : 'border-cs-paper text-cs-paper hover:bg-cs-paper hover:text-cs-ink'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                </button>

                <button
                  onClick={handleShare}
                  className={`${hardIconBtn} border-cs-paper text-cs-paper hover:bg-cs-paper hover:text-cs-ink`}
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </motion.div>
              {shareError && (
                <p className="inline-block text-xs font-mono text-cs-paper bg-cs-rust px-2 py-1">{shareError}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showTrailerModal && movie?.trailerUrl && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center px-4">
          <div className="relative w-full max-w-4xl aspect-video">
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute -top-10 right-0 w-10 h-10 bg-black/80 hover:bg-black rounded-full flex items-center justify-center text-white border border-white/30"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              className="w-full h-full rounded-xl bg-black object-contain"
              src={movie.trailerUrl}
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}

      {/* Details section */}
      <div className="container-page py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Episodes section (only for series) */}
          {isSeries && seriesEpisodes.length > 0 && (
            <div className="mb-12 space-y-4 max-w-5xl">
              <div className="flex flex-wrap items-center gap-3 md:gap-4 px-1">
                <h2 className="font-heading uppercase tracking-wide text-cs-ink text-2xl md:text-3xl">Episodes</h2>
                {seasonNumbers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-[0.08em] text-cs-muted">Season</span>
                    <select
                      className="bg-cs-paper cs-border-thin text-cs-ink text-sm px-3 py-2 min-h-[40px]"
                      value={String(selectedSeason ?? seasonNumbers[0] ?? '')}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    >
                      {seasonNumbers.map((num) => {
                        const meta = seriesSeasons.find((s: any) => Number(s?.seasonNumber ?? 1) === Number(num));
                        const label = meta?.name && String(meta.name).trim().length > 0 ? `Season ${num}: ${meta.name}` : `Season ${num}`;
                        return (
                          <option key={String(num)} value={String(num)}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {visibleEpisodes.map((episode: any, idx: number) => {
                  const locked = ppvInfo?.isPpv && !ppvInfo?.hasAccess;
                  return (
                    <motion.div
                      key={episode.id ?? idx}
                      className="group cs-border-thin bg-cs-panel hover:cs-shadow transition-all overflow-hidden"
                      whileHover={{ scale: 1.005 }}
                    >
                      <div className="flex gap-3 p-4 md:p-5 max-w-5xl mx-auto items-start">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 overflow-hidden rounded-md shrink-0">
                          <ImageWithFallback
                            src={episode.thumbnailUrl || episode.posterUrl || movie.image}
                            alt={episode.name || episode.title || 'Episode'}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <button
                            onClick={() => {
                              if (locked) return;
                              onPlayClick({ ...movie, currentEpisode: episode });
                            }}
                            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                              locked ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full bg-brand shadow-lg shadow-brand/40 flex items-center justify-center">
                              {locked ? <Lock className="w-6 h-6 text-primary-foreground" /> : <Play className="w-6 h-6 fill-current text-primary-foreground" />}
                            </div>
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <h3 className="text-cs-ink text-base md:text-lg font-semibold leading-tight">Episode {episode.episodeNumber ?? idx + 1}</h3>
                            <div className="text-xs md:text-sm text-cs-muted whitespace-nowrap">
                              {episode.runtimeMinutes ? `${episode.runtimeMinutes}m` : episode.duration || ''}
                            </div>
                          </div>
                          <div className="max-h-0 group-hover:max-h-40 transition-[max-height] duration-300 overflow-hidden">
                            <p className="text-cs-ink/80 text-sm mt-3 leading-relaxed">{episode.synopsis ?? episode.description ?? 'Episode details coming soon.'}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-cs-muted mt-3">
                              <span className="px-2 py-1 cs-border-thin font-mono uppercase tracking-wide">Season {episode.seasonNumber ?? selectedSeason ?? '-'}</span>
                              <span className="px-2 py-1 cs-border-thin font-mono uppercase tracking-wide">Maturity: {movie.maturityRating ?? 'N/A'}</span>
                              {episode.runtimeMinutes && (
                                <span className="px-2 py-1 cs-border-thin font-mono uppercase tracking-wide">{episode.runtimeMinutes} min</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* More Like This */}
          {relatedItems.length > 0 && (
            <div>
              <h2 className="font-heading uppercase tracking-wide text-cs-ink mb-6 text-2xl md:text-3xl">More Like This</h2>
              <div className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-1 max-w-6xl mx-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {relatedItems.slice(0, 5).map((item, idx) => {
                  const itemId = (item as any).backendId || item.id || idx;
                  const title = (item as any).title || (item as any).name || 'Title';
                  const runtime = (item as any).runtimeMinutes;
                  const genre = (item as any).genre || (item as any).genres?.[0] || 'Movie';
                  const thumb =
                    (item as any).thumbnailUrl ||
                    (item as any).posterUrl ||
                    (item as any).image ||
                    'https://placehold.co/600x900/111111/FD7E14?text=Wanzami';
                  return (
                    <motion.div
                      key={itemId}
                      className="group cursor-pointer overflow-hidden cs-border-thin bg-cs-panel hover:cs-shadow transition-all relative h-full flex flex-col"
                      style={{ aspectRatio: '16 / 9', width: '220px', minWidth: '220px' }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        const targetId = (item as any).backendId || (item as any).id || itemId;
                        if (typeof window !== 'undefined' && targetId) {
                          window.location.href = `/title/${targetId}`;
                        }
                      }}
                    >
                      <div className="relative w-full h-full">
                        <ImageWithFallback src={thumb} alt={title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button className="absolute bottom-3 left-3 bg-brand hover:bg-brand-dark text-primary-foreground px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                          <Play className="w-4 h-4 fill-current" />
                          Play
                        </button>
                      </div>
                      <div className="p-3 space-y-1 flex-1">
                        <p className="text-cs-ink font-semibold text-sm line-clamp-1">{title}</p>
                        <p className="text-xs text-cs-muted line-clamp-2">
                          {genre} · {runtime ? `${Math.round(Number(runtime))}m` : '90m'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
