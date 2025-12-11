import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  List,
  Maximize,
  Minimize,
  Pause,
  X,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  PictureInPicture,
} from "lucide-react";
import { postEvents } from "@/lib/contentClient";

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
  accessToken?: string;
  deviceId?: string;
  episodes?: Episode[];
  currentEpisodeId?: string;
  startTimeSeconds?: number;
};

const pickInitialSource = (sources: MediaSource[]) => {
  if (!sources.length) return undefined;
  const byLabel = (label: string) =>
    sources.find((s) => (s.label ?? "").toLowerCase().includes(label));
  return byLabel("1080") || sources[0];
};

export function CustomMediaPlayer({
  title,
  poster,
  sources,
  onClose,
  accessToken,
  deviceId,
  profileId,
  episodes = [],
  currentEpisodeId,
  startTimeSeconds,
}: CustomMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedStart = useRef(false);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const hasSources = useMemo(() => {
    return Boolean(
      (sources && sources.length > 0) ||
        episodes?.some((ep) => ep.streamUrl)
    );
  }, [sources, episodes]);

  const normalizedSources = useMemo(() => {
    if (!sources || !sources.length) return [];
    return sources.map((s, idx) => ({
      ...s,
      label:
        s.label ||
        (s.src.toLowerCase().includes("1080")
          ? "1080p"
          : s.src.toLowerCase().includes("720")
          ? "720p"
          : idx === 0
          ? "HD"
          : `Source ${idx + 1}`),
    }));
  }, [sources]);

  const normalizedEpisodes = useMemo(() => {
    return (episodes ?? []).slice().sort((a, b) => {
      const sa = a.seasonNumber ?? 0;
      const sb = b.seasonNumber ?? 0;
      if (sa !== sb) return sa - sb;
      return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
    });
  }, [episodes]);

  const [currentSrc, setCurrentSrc] = useState<MediaSource | undefined>(
    pickInitialSource(normalizedSources) ?? normalizedSources[0]
  );
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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);
  const [pipAvailable, setPipAvailable] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const pendingResume = useRef(false);
  const lastProgressSent = useRef<number>(0);
  const hasSentStart = useRef(false);
  const unmounted = useRef(false);

  const emitEvent = useCallback(
    async (eventType: "PLAY_START" | "PLAY_END" | "SCRUB", metadata?: Record<string, any>, force = false) => {
      if (!accessToken || !titleId) return;
      const now = Date.now();
      if (!force && eventType === "PLAY_END" && now - lastProgressSent.current < 12000) {
        return;
      }
      lastProgressSent.current = now;
      const time = videoRef.current?.currentTime ?? 0;
      const dur = videoRef.current?.duration ?? duration ?? 0;
      try {
        await postEvents(
          [
            {
              eventType,
              titleId,
              profileId,
              episodeId: currentEpisode?.id,
              deviceId,
              metadata: {
                positionSec: time,
                durationSec: dur,
                sourceLabel: currentSrc?.label,
                ...metadata,
              },
            },
          ],
          accessToken
        );
      } catch {
        // ignore logging errors
      }
    },
    [accessToken, currentEpisode?.id, currentSrc?.label, deviceId, duration, profileId, titleId]
  );

  const hasPrev = currentEpisode
    ? normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) > 0
    : false;
  const hasNext = currentEpisode
    ? normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) < normalizedEpisodes.length - 1
    : false;

  useEffect(() => {
    setPipAvailable(Boolean((document as any).pictureInPictureEnabled));
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc?.src) return;
    video.src = currentSrc.src;
    video.load();
    if (isPlaying) {
      void video.play().catch(() => undefined);
    }
  }, [currentSrc?.src, isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      void emitEvent("PLAY_END", { reason: "progress" }, false);
    };
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      if (!hasAppliedStart.current && startTimeSeconds && video.duration > startTimeSeconds) {
        video.currentTime = startTimeSeconds;
        hasAppliedStart.current = true;
      }
      setIsBuffering(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (hasNext) {
        handleNext();
        return;
      }
      void emitEvent("PLAY_END", { reason: "ended" }, true);
    };
    const handleError = () => {
      const idx = normalizedSources.findIndex((s) => s.src === currentSrc?.src);
      const fallback =
        normalizedSources[idx + 1] ?? normalizedSources.find((s) => s.src !== currentSrc?.src);
      if (fallback) {
        setPlaybackError(null);
        setCurrentSrc(fallback);
      } else {
        setPlaybackError("We hit a streaming error.");
      }
      setIsBuffering(false);
    };
    const handleCanPlay = () => {
      setIsBuffering(false);
      if (pendingResume.current && isPlaying) {
        void video.play().catch(() => undefined);
      }
      pendingResume.current = false;
    };
    const handleWaiting = () => {
      setIsBuffering(true);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
    };
  }, [emitEvent, hasNext, startTimeSeconds, currentSrc, normalizedSources]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (isPlaying && !isHovering) {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    }
  }, [isPlaying, isHovering]);

  useEffect(() => {
    setPlaybackError(null);
  }, [currentSrc?.src]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      void emitEvent("PLAY_END", { reason: "pause" }, true);
    } else {
      void video.play().catch(() => undefined);
      setIsPlaying(true);
      if (!hasSentStart.current) {
        hasSentStart.current = true;
        void emitEvent("PLAY_START", { reason: "play" }, true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
    void emitEvent("SCRUB", { reason: "seek", positionSec: time }, true);
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
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled && videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // ignore
    }
  };

  const handleQualityChange = (source: MediaSource) => {
    const video = videoRef.current;
    const time = video?.currentTime ?? 0;
    const wasPlaying = isPlaying;
    setIsBuffering(true);
    setCurrentSrc(source);
    setShowQualityMenu(false);
    if (video) {
      video.pause();
    }
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        if (wasPlaying) {
          pendingResume.current = true;
          void videoRef.current.play().catch(() => undefined);
        }
      }
    }, 100);
  };

  const switchEpisode = (ep: Episode) => {
    setCurrentEpisode(ep);
    setShowEpisodePanel(false);
    setPlaybackError(null);
    setCurrentTime(0);
    hasAppliedStart.current = false;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
    void emitEvent("PLAY_START", { reason: "switch_episode", episodeId: ep.id }, true);
  };

  const handlePrev = () => {
    if (!currentEpisode) return;
    const idx = normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id);
    if (idx > 0) {
      switchEpisode(normalizedEpisodes[idx - 1]);
    }
  };

  const handleNext = () => {
    if (!currentEpisode) return;
    const idx = normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id);
    if (idx >= 0 && idx < normalizedEpisodes.length - 1) {
      switchEpisode(normalizedEpisodes[idx + 1]);
    }
  };

  useEffect(() => {
    return () => {
      unmounted.current = true;
      void emitEvent("PLAY_END", { reason: "unmount" }, true);
    };
  }, [emitEvent]);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
  };

  const currentEpisodeLabel = currentEpisode
    ? `S${currentEpisode.seasonNumber ?? "?"} E${currentEpisode.episodeNumber ?? "?"}`
    : null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black group overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => setIsHovering(true)}
    >
      <video
        ref={videoRef}
        src={currentEpisode?.streamUrl || currentSrc?.src}
        poster={poster ?? undefined}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        onClick={togglePlay}
        controls={false}
        style={{ zIndex: 1 }}
      />

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        style={{ zIndex: 5 }}
      />

      <div
        className={`absolute top-0 left-0 right-0 p-4 md:p-6 flex items-start justify-between transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
        style={{ zIndex: 10 }}
      >
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="text-white">
            <div className="font-semibold text-lg">{title}</div>
            {currentEpisodeLabel ? (
              <div className="text-sm text-white/70">{currentEpisodeLabel}</div>
            ) : null}
            {playbackError ? (
              <div className="mt-2 text-xs text-red-200 bg-red-900/40 border border-red-800 rounded px-3 py-2 max-w-md">
                {playbackError}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pipAvailable ? (
            <button
              onClick={togglePip}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              aria-label="Picture in picture"
            >
              <PictureInPicture className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>

      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 15 }}>
          <button
            onClick={togglePlay}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110"
          >
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </button>
        </div>
      )}

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm" style={{ zIndex: 14 }}>
          <div className="h-12 w-12 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 p-3 md:p-6 transition-all duration-300 ${
          showControls ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
        style={{ zIndex: 12 }}
      >
        {!hasSources ? (
          <div className="text-center text-white/80 text-sm mb-3">
            No playable sources found for this title.
          </div>
        ) : null}

        <div className="mb-3 md:mb-4">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #e50914 0%, #e50914 ${
                duration ? (currentTime / duration) * 100 : 0
              }%, #4a5568 ${duration ? (currentTime / duration) * 100 : 0}%, #4a5568 100%)`,
            }}
          />
        </div>

        <div className="block md:hidden space-y-3">
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
              {normalizedEpisodes.length ? (
                <button onClick={() => setShowEpisodePanel(true)} className="text-white hover:scale-110 transition-transform">
                  <List className="w-6 h-6" />
                </button>
              ) : null}
              {normalizedSources.length > 1 ? (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu((v) => !v)}
                    className="text-white hover:scale-110 transition-transform"
                  >
                    <Settings className="w-6 h-6" />
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg overflow-hidden min-w-40">
                      <div className="p-2 border-b border-gray-700">
                        <p className="text-white text-sm">Quality</p>
                      </div>
                      {normalizedSources.map((quality) => (
                        <button
                          key={quality.src}
                          onClick={() => handleQualityChange(quality)}
                          className="w-full px-3 py-2 text-left text-white text-sm hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <span>{quality.label}</span>
                          {currentSrc?.src === quality.src ? <Check className="w-4 h-4" /> : null}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-white text-xs">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="text-white text-xs">{currentSrc?.label}</div>
          </div>
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
                className="w-0 group-hover/volume:w-24 transition-all duration-300 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, white 0%, white ${volume * 100}%, #4a5568 ${volume * 100}%, #4a5568 100%)`,
                }}
              />
            </div>
            <div className="text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {normalizedEpisodes.length ? (
              <button onClick={() => setShowEpisodePanel(true)} className="text-white hover:scale-110 transition-transform">
                <List className="w-7 h-7" />
              </button>
            ) : null}
            {normalizedSources.length > 1 ? (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu((v) => !v)}
                  className="text-white hover:scale-110 transition-transform"
                >
                  <Settings className="w-7 h-7" />
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg overflow-hidden min-w-48">
                    <div className="p-3 border-b border-gray-700">
                      <p className="text-white">Quality</p>
                    </div>
                    {normalizedSources.map((quality) => (
                      <button
                        key={quality.src}
                        onClick={() => handleQualityChange(quality)}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                      >
                        <span>{quality.label}</span>
                        {currentSrc?.src === quality.src ? <Check className="w-5 h-5" /> : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
              {isFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {showEpisodePanel && normalizedEpisodes.length > 0 && (
        <div className="fixed inset-0 bg-black/95 overflow-y-auto">
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
                    onClick={() => switchEpisode(ep)}
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
