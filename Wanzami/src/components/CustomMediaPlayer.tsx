import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  List,
  Maximize,
  Minimize,
  Pause,
  Settings,
  PictureInPicture,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

type MediaSource = {
  src: string;
  label?: string;
  type?: string;
};

type Episode = {
  id: string;
  name: string;
  seasonNumber?: number;
  episodeNumber?: number;
  synopsis?: string | null;
  runtimeMinutes?: number | null;
  thumbnailUrl?: string | null;
  streamUrl?: string | null;
};

type CustomMediaPlayerProps = {
  title: string;
  poster?: string | null;
  sources: MediaSource[];
  onClose: () => void;
  titleId?: string;
  profileId?: string;
  episodes?: Episode[];
  currentEpisodeId?: string;
  onEvent?: (eventType: string, metadata?: Record<string, any>) => void;
  startTimeSeconds?: number;
};

export function CustomMediaPlayer({
  title,
  poster,
  sources,
  onClose,
  episodes = [],
  currentEpisodeId,
  onEvent,
  startTimeSeconds,
}: CustomMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const historyPushedRef = useRef(false);
  const closingFromPopStateRef = useRef(false);
  const previousHistoryStateRef = useRef<any>(null);
  const normalizedSources = useMemo(() => {
    if (!sources || !sources.length) return [];
    return sources.map((s, idx) => ({
      ...s,
      label:
        s.label ||
        (s.src.toLowerCase().includes("1080") ? "1080p" : s.src.toLowerCase().includes("720") ? "720p" : idx === 0 ? "HD" : `Source ${idx + 1}`),
    }));
  }, [sources]);
  const preferredSource = useMemo(() => {
    if (!normalizedSources.length) return undefined;
    const hd1080 = normalizedSources.find((s) => (s.label ?? "").toLowerCase().includes("1080"));
    return hd1080 ?? normalizedSources[0];
  }, [normalizedSources]);
  const [currentSrc, setCurrentSrc] = useState<MediaSource | undefined>(preferredSource ?? normalizedSources[0] ?? sources[0]);

  const normalizedEpisodes = useMemo(() => {
    return (episodes ?? []).slice().sort((a, b) => {
      const sa = a.seasonNumber ?? 0;
      const sb = b.seasonNumber ?? 0;
      if (sa !== sb) return sa - sb;
      return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
    });
  }, [episodes]);

  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(() => {
    if (!normalizedEpisodes.length) return null;
    if (currentEpisodeId) {
      return normalizedEpisodes.find((e) => e.id === currentEpisodeId) ?? normalizedEpisodes[0];
    }
    return normalizedEpisodes[0];
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);
  const [pipAvailable, setPipAvailable] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc?.src) return;
    video.src = currentSrc.src;
    video.load();
    if (isPlaying) {
      void video.play().catch(() => undefined);
    }
  }, [currentSrc?.src]);

  useEffect(() => {
    if (!normalizedSources.length) return;
    const inList = currentSrc ? normalizedSources.some((s) => s.src === currentSrc.src) : false;
    if (!inList) {
      setCurrentSrc(preferredSource ?? normalizedSources[0]);
    }
  }, [normalizedSources, currentSrc, preferredSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (startTimeSeconds && video.duration > startTimeSeconds) {
        video.currentTime = startTimeSeconds;
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      // auto-next episode
      if (currentEpisode && normalizedEpisodes.length) {
        const idx = normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id);
        if (idx >= 0 && idx < normalizedEpisodes.length - 1) {
          const next = normalizedEpisodes[idx + 1];
          const stream = next.streamUrl || currentSrc.src;
          switchEpisode(next, stream);
          return;
        }
      }
      onEvent?.("PLAY_END");
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
    };
  }, [currentEpisode, normalizedEpisodes, currentSrc?.src, startTimeSeconds, onEvent]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    setPipAvailable(Boolean((document as any).pictureInPictureEnabled));
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    setShowControls(true);
  }, [isPlaying]);

  const handleClose = useCallback(() => {
    const exitFullscreenAndPip = async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        }
      } catch {
        // ignore
      }
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      } catch {
        // ignore
      }
    };

    const video = videoRef.current;
    if (video) {
      video.pause();
    }
    setShowEpisodePanel(false);
    setShowQualityMenu(false);
    void exitFullscreenAndPip();
    onEvent?.("PLAY_END");
    if (!closingFromPopStateRef.current && historyPushedRef.current && typeof window !== "undefined") {
      // Remove the synthetic history entry without navigating away.
      try {
        window.history.replaceState(previousHistoryStateRef.current, "", window.location.href);
      } catch {
        // ignore
      }
    }
    onClose();
  }, [onClose, onEvent]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace" || e.key === "BrowserBack") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Push a history entry so the browser/hardware back button closes the player instead of navigating away.
    previousHistoryStateRef.current = window.history.state;
    const state = { wanzamiPlayer: true, ts: Date.now() };
    window.history.pushState(state, "");
    historyPushedRef.current = true;

    const onPopState = (event: PopStateEvent) => {
      if (event.state?.wanzamiPlayer) {
        closingFromPopStateRef.current = true;
        handleClose();
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [handleClose]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      void video.play().catch(() => undefined);
      setIsPlaying(true);
      onEvent?.("PLAY_START");
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  };

  const togglePip = async () => {
    try {
      const video = videoRef.current;
      if (!video) return;
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch {
      // ignore
    }
  };

  const handleQualityChange = (source: MediaSource) => {
    const video = videoRef.current;
    const time = video?.currentTime ?? 0;
    const wasPlaying = isPlaying;
    setCurrentSrc(source);
    setShowQualityMenu(false);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        if (wasPlaying) {
          void videoRef.current.play().catch(() => undefined);
        }
      }
    }, 50);
  };

  const switchEpisode = (ep: Episode, srcOverride?: string) => {
    const source = srcOverride ? { src: srcOverride, label: currentSrc?.label ?? "HD" } : currentSrc;
    setCurrentEpisode(ep);
    if (source) handleQualityChange(source);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handlePrev = () => {
    if (!currentEpisode) return;
    const idx = normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id);
    if (idx > 0) {
      const prev = normalizedEpisodes[idx - 1];
      const stream = prev.streamUrl || currentSrc?.src;
      if (stream) switchEpisode(prev, stream);
    }
  };

  const handleNext = () => {
    if (!currentEpisode) return;
    const idx = normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id);
    if (idx >= 0 && idx < normalizedEpisodes.length - 1) {
      const next = normalizedEpisodes[idx + 1];
      const stream = next.streamUrl || currentSrc?.src;
      if (stream) switchEpisode(next, stream);
    }
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`;
    return `${minutes}:${seconds}`;
  };

  const hasPrev = currentEpisode
    ? normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) > 0
    : false;
  const hasNext = currentEpisode
    ? normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) < normalizedEpisodes.length - 1
    : false;

  const renderQualityMenu = (placementClass: string) => {
    if (!showQualityMenu) return null;
    return (
      <div className={`absolute ${placementClass} bg-black/95 border border-white/10 rounded-lg shadow-lg min-w-[160px] z-30`}>
        <div className="px-3 py-2 border-b border-white/10">
          <p className="text-white text-sm">Quality</p>
        </div>
        {normalizedSources.map((s) => (
          <button
            key={s.src}
            className="w-full px-3 py-2 text-left text-white text-sm hover:bg-white/10 flex items-center justify-between"
            onClick={() => {
              handleQualityChange(s);
              setShowQualityMenu(false);
            }}
          >
            <span>{s.label ?? "HD"}</span>
            {currentSrc?.src === s.src ? <Check className="w-4 h-4" /> : null}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center"
      style={{ zIndex: 99999 }}
    >
      <video
        ref={videoRef}
        src={currentSrc?.src}
        poster={poster ?? undefined}
        className="w-full h-full object-contain bg-black"
        onClick={togglePlay}
        controls={false}
      />

      {/* Top bar */}
      <div className={`absolute top-0 left-0 right-0 p-4 md:p-6 flex items-start justify-between transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-white">
            <div className="font-semibold text-lg">{title}</div>
            {currentEpisode ? (
              <div className="text-sm text-white/70">
                S{currentEpisode.seasonNumber ?? "?"}E{currentEpisode.episodeNumber ?? "?"} · {currentEpisode.name}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 relative">
          {/* top right kept minimal; main controls moved bottom-right */}
        </div>
      </div>

      {/* Center overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
          >
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 transition-all duration-300 ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="mb-3 md:mb-4">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #fd7e14 0%, #fd7e14 ${(currentTime / (duration || 1)) * 100}%, #4a5568 ${(currentTime / (duration || 1)) * 100}%, #4a5568 100%)`,
            }}
          />
        </div>

        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
              {isPlaying ? <Pause className="w-8 h-8" fill="white" /> : <Play className="w-8 h-8" fill="white" />}
            </button>
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className={`text-white hover:scale-110 transition-transform ${!hasPrev ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <SkipBack className="w-7 h-7" fill="white" />
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className={`text-white hover:scale-110 transition-transform ${!hasNext ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <SkipForward className="w-7 h-7" fill="white" />
            </button>
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-white hover:scale-110 transition-transform">
                {isMuted || volume === 0 ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-28 transition-all duration-300 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fd7e14 0%, #fd7e14 ${volume * 100}%, #4a5568 ${volume * 100}%, #4a5568 100%)`,
                }}
              />
            </div>
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {normalizedSources.length > 1 && (
              <div className="relative">
                <button onClick={() => setShowQualityMenu((v) => !v)} className="text-white hover:scale-110 transition-transform flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/15">
                  <Settings className="w-6 h-6" />
                  <span className="text-sm">{currentSrc?.label ?? "HD"}</span>
                </button>
                {renderQualityMenu("bottom-full right-0 mb-2")}
              </div>
            )}
            {pipAvailable && (
              <button onClick={togglePip} className="text-white hover:scale-110 transition-transform">
                <PictureInPicture className="w-7 h-7" />
              </button>
            )}
            <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
              {isFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-7 h-7" fill="white" /> : <Play className="w-7 h-7" fill="white" />}
              </button>
              <button
                onClick={handlePrev}
                disabled={!hasPrev}
                className={`text-white hover:scale-110 transition-transform ${!hasPrev ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <SkipBack className="w-6 h-6" fill="white" />
              </button>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className={`text-white hover:scale-110 transition-transform ${!hasNext ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <SkipForward className="w-6 h-6" fill="white" />
              </button>
              <button onClick={toggleMute} className="text-white hover:scale-110 transition-transform">
                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {normalizedEpisodes.length > 0 && (
                <button onClick={() => setShowEpisodePanel(true)} className="text-white hover:scale-110 transition-transform">
                  <List className="w-6 h-6" />
                </button>
              )}
              {normalizedSources.length > 1 && (
                <div className="relative">
                  <button onClick={() => setShowQualityMenu((v) => !v)} className="text-white hover:scale-110 transition-transform">
                    <Settings className="w-6 h-6" />
                  </button>
                  {renderQualityMenu("bottom-full right-0 mb-2")}
                </div>
              )}
              <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-white text-xs">
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            {currentSrc?.label ? <span>{currentSrc.label}</span> : null}
          </div>
        </div>
      </div>

      {/* Removed floating quick controls to keep settings anchored with bottom controls */}

      {/* Episode overlay */}
      {showEpisodePanel && normalizedEpisodes.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-[100000] overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="text-white">
                <div className="font-semibold text-lg">Episodes</div>
                <div className="text-xs text-white/60">Season {currentEpisode?.seasonNumber ?? "?"}</div>
              </div>
              <button
                onClick={() => setShowEpisodePanel(false)}
                className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                aria-label="Close episodes"
              >
                <X className="w-6 h-6 md:w-7 md:h-7" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:gap-4">
              {normalizedEpisodes.map((ep, index) => {
                const active = currentEpisode?.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      const stream = ep.streamUrl || currentSrc?.src;
                      if (stream) {
                        handleQualityChange({ src: stream, label: currentSrc?.label ?? "HD" });
                        setCurrentEpisode(ep);
                        setShowEpisodePanel(false);
                      }
                    }}
                    className={`group cursor-pointer rounded-lg overflow-hidden transition-all hover:bg-white/10 ${
                      active ? "ring-2 ring-[#fd7e14]" : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 p-3 md:p-4">
                      <div className="relative flex-shrink-0 w-full sm:w-40 md:w-48 h-48 sm:h-24 md:h-28 bg-gray-800 rounded overflow-hidden">
                        {ep.thumbnailUrl ? (
                          <img src={ep.thumbnailUrl} alt={ep.name ?? "Episode"} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-black/40 flex items-center justify-center text-white text-xs">Episode</div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-10 h-10 md:w-12 md:h-12 text-white" fill="white" />
                        </div>
                        {active && (
                          <div className="absolute top-2 right-2 bg-[#fd7e14] text-white px-2 py-1 rounded text-xs md:text-sm">
                            Playing
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="text-white mb-1 text-sm md:text-base">
                              {index + 1}. {ep.name ?? "Episode"}
                            </h3>
                            {ep.synopsis ? (
                              <p className="text-gray-300 text-xs md:text-sm line-clamp-2 sm:line-clamp-none">
                                {ep.synopsis}
                              </p>
                            ) : null}
                          </div>
                          {ep.runtimeMinutes ? (
                            <span className="text-gray-300 text-xs md:text-sm flex-shrink-0">
                              {ep.runtimeMinutes}m
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xs text-white/70">
                          S{ep.seasonNumber ?? "?"} · E{ep.episodeNumber ?? index + 1}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
