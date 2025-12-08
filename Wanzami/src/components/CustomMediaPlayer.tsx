import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
  Captions,
  HelpCircle,
  RefreshCw,
  PictureInPicture,
  Shield,
} from "lucide-react";

type MediaSource = {
  src: string;
  label?: string;
  type?: string;
};

type CustomMediaPlayerProps = {
  title: string;
  poster?: string | null;
  sources: MediaSource[];
  onClose: () => void;
  titleId?: string;
  profileId?: string;
  episodes?: Array<{
    id: string;
    name: string;
    seasonNumber?: number;
    episodeNumber?: number;
    synopsis?: string | null;
    runtimeMinutes?: number | null;
    thumbnailUrl?: string | null;
    streamUrl?: string | null;
  }>;
  currentEpisodeId?: string;
  onEvent?: (eventType: string, metadata?: Record<string, any>) => void;
  gestureSeekSeconds?: number;
  startTimeSeconds?: number;
};

const TIPS_STORAGE_KEY = "wanzami_player_tips_seen";

export function CustomMediaPlayer({
  title,
  poster,
  sources,
  onClose,
  titleId,
  profileId,
  episodes = [],
  currentEpisodeId,
  onEvent,
  gestureSeekSeconds = 10,
  startTimeSeconds,
}: CustomMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const normalizedSources = useMemo(() => {
    if (!sources || !sources.length) return [];
    return sources.map((s, idx) => ({
      ...s,
      label:
        s.label ||
        (s.src.toLowerCase().includes("1080") ? "1080p" : s.src.toLowerCase().includes("720") ? "720p" : idx === 0 ? "HD" : `Source ${idx + 1}`),
    }));
  }, [sources]);
  const [currentSrc, setCurrentSrc] = useState<MediaSource>(normalizedSources[0] ?? sources[0]);
  const normalizedEpisodes = useMemo(
    () =>
      (episodes ?? []).slice().sort((a, b) => {
        const sa = a.seasonNumber ?? 0;
        const sb = b.seasonNumber ?? 0;
        if (sa !== sb) return sa - sb;
        return (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0);
      }),
    [episodes]
  );
  const [currentEpisode, setCurrentEpisode] = useState(() => {
    if (!normalizedEpisodes.length) return null;
    if (currentEpisodeId) {
      return normalizedEpisodes.find((e) => e.id === currentEpisodeId) ?? normalizedEpisodes[0];
    }
    return normalizedEpisodes[0];
  });
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPaused, setIsPaused] = useState(true);
  const [showTips, setShowTips] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(TIPS_STORAGE_KEY) !== "1";
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [lastTap, setLastTap] = useState<{ time: number; side: "left" | "right" } | null>(null);
  const lastSavedRef = useRef<number>(0);
  const resumeKey =
    typeof window !== "undefined"
      ? `progress:${profileId ?? "anon"}:${titleId ?? title}${currentEpisode ? `:ep-${currentEpisode.id}` : ""}`
      : null;
  const [resumeTime, setResumeTime] = useState<number | null>(null);
  const [resumeDuration, setResumeDuration] = useState<number | null>(null);
  const [blockScreen, setBlockScreen] = useState(false);
  const [pipAvailable, setPipAvailable] = useState(false);
  const [screenshotShield, setScreenshotShield] = useState(false);
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);

  const percentage = useMemo(() => (duration ? (currentTime / duration) * 100 : 0), [currentTime, duration]);

  const fireEvent = (eventType: string, metadata?: Record<string, any>) => {
    onEvent?.(eventType, {
      ...metadata,
      titleId,
      profileId,
    });
  };

  useEffect(() => {
    if (resumeKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(resumeKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { time?: number; duration?: number };
          if (Number.isFinite(parsed.time) && (parsed.time ?? 0) > 5) {
            setResumeTime(parsed.time ?? null);
            setResumeDuration(parsed.duration ?? null);
          }
        } catch {
          // ignore bad state
        }
      }
    }
    if (Number.isFinite(startTimeSeconds) && (startTimeSeconds ?? 0) > 0) {
      setResumeTime(startTimeSeconds ?? null);
    }
  }, [resumeKey, startTimeSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      const dur = video.duration || 0;
      setDuration(dur);
      const desired = resumeTime ?? (Number.isFinite(startTimeSeconds) ? startTimeSeconds : null);
      if (desired && dur > 0) {
        const clamped = Math.min(desired, dur - 1);
        video.currentTime = clamped;
        setCurrentTime(clamped);
      }
    };
    const onTime = () => {
      const t = video.currentTime;
      setCurrentTime(t);
      if (resumeKey && durGreaterThanZero(video)) {
        maybePersistProgress(resumeKey, t, video.duration, lastSavedRef);
      }
    };
    const onProgress = () => {
      if (video.buffered.length) {
        const end = video.buffered.end(video.buffered.length - 1);
        setBuffered(end);
      }
    };
    const onWaiting = () => {
      setBuffering(true);
    };
    const onPlaying = () => {
      setBuffering(false);
      setPlaying(true);
      setIsPaused(false);
    };
    const onPause = () => {
      setPlaying(false);
      setIsPaused(true);
    };
    const onEnded = () => {
      setPlaying(false);
      fireEvent("PLAY_END", { completionPercent: 1 });
      if (resumeKey) {
        localStorage.removeItem(resumeKey);
      }
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("progress", onProgress);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [titleId, profileId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = muted;
    video.volume = volume;
  }, [muted, volume]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") {
        seekBy(5);
      } else if (e.key === "ArrowLeft") {
        seekBy(-5);
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "m") {
        toggleMute();
      } else if (e.key === "Escape") {
        reportProgress();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    // lock scroll beneath the overlay
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setBlockScreen(true);
      } else {
        setTimeout(() => setBlockScreen(false), 300);
      }
    };
    const handleFocus = () => {
      setTimeout(() => setBlockScreen(false), 200);
    };
    const handleScreenshotKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        setScreenshotShield(true);
        setTimeout(() => setScreenshotShield(false), 1500);
      }
    };
    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("keydown", handleScreenshotKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("keydown", handleScreenshotKey);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      fireEvent("PLAY_START");
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  const toggleMute = () => {
    setMuted((m) => !m);
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(time, duration || video.duration || 0));
    video.currentTime = clamped;
    setCurrentTime(clamped);
    fireEvent("SCRUB", { position: clamped / (duration || 1) });
  };

  const seekBy = (delta: number) => {
    seekTo(currentTime + delta);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen().catch(() => undefined);
    } else {
      await document.exitFullscreen().catch(() => undefined);
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
      // ignore pip errors
    }
  };

  const handleTap = (side: "left" | "right") => {
    const now = Date.now();
    if (lastTap && now - lastTap.time < 400 && lastTap.side === side) {
    seekBy(side === "left" ? -gestureSeekSeconds : gestureSeekSeconds);
    setLastTap(null);
  } else {
    setLastTap({ time: now, side });
  }
  };

  const dismissTips = () => {
    setShowTips(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(TIPS_STORAGE_KEY, "1");
    }
  };

  const handleSourceChange = (src: MediaSource, nextEpisode?: typeof currentEpisode) => {
    setCurrentSrc(src);
    setBuffered(0);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    setIsPaused(true);
    if (nextEpisode) setCurrentEpisode(nextEpisode);
    // Telemetry omitted to align with allowed event types
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.src = src.src;
      video.load();
      void video.play().catch(() => undefined);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !currentSrc?.src) return;
    video.src = currentSrc.src;
    video.load();
    void video.play().catch(() => undefined);
    setIsPaused(false);
    setPlaying(true);
  }, [currentSrc?.src]);

  const reportProgress = (force?: boolean) => {
    const video = videoRef.current;
    if (!video || !durGreaterThanZero(video)) return;
    const completion = video.duration ? video.currentTime / video.duration : 0;
    fireEvent("PLAY_END", { completionPercent: completion });
    if (resumeKey) {
      if (completion >= 0.97) {
        localStorage.removeItem(resumeKey);
      } else {
        maybePersistProgress(resumeKey, video.currentTime, video.duration, lastSavedRef, { force: Boolean(force) });
      }
    }
  };

  useEffect(() => {
    return () => {
      reportProgress(true);
    };
  }, [resumeKey]);

  useEffect(() => {
    setPipAvailable(Boolean((document as any).pictureInPictureEnabled));
  }, []);

  const bufferedPct = useMemo(() => {
    if (!duration || !buffered) return 0;
    return Math.min(100, (buffered / duration) * 100);
  }, [buffered, duration]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/90 flex items-center justify-center"
      style={{ zIndex: 99999 }}
      onMouseMove={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        className={`w-full h-full max-h-screen object-contain bg-black transition duration-200 ${isPaused ? "blur-sm brightness-75" : ""}`}
        poster={poster ?? undefined}
        controls={false}
        playsInline
        onClick={() => {
          togglePlay();
          setShowControls(true);
        }}
        onDoubleClick={toggleFullscreen}
        src={currentSrc.src}
        autoPlay
      />

      {/* Center play/pause overlay for visibility */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {!playing && !buffering && (
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <button
              aria-label={playing ? "Pause" : "Play"}
              className="w-20 h-20 rounded-full bg-black/60 border border-white/30 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition"
              onClick={togglePlay}
            >
              {playing ? <Pause className="w-9 h-9" /> : <Play className="w-9 h-9" />}
            </button>
            <span className="text-sm text-white/80">Tap to play</span>
          </div>
        )}
      </div>

      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 rounded-full p-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>
      )}

      {blockScreen && (
        <div className="absolute inset-0 bg-black/95 text-white flex flex-col items-center justify-center z-[1]">
          <Shield className="w-10 h-10 mb-3 text-[#fd7e14]" />
          <p className="text-sm text-center px-6">Screen capture blocked. Focus the player to resume.</p>
        </div>
      )}

      {screenshotShield && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur z-[2] flex items-center justify-center text-white text-sm">
          <div className="flex flex-col items-center gap-2">
            <Shield className="w-8 h-8 text-[#fd7e14]" />
            <span>Capture blocked</span>
          </div>
        </div>
      )}

      {showEpisodePanel && normalizedEpisodes.length > 0 && (
        <div className="fixed inset-0 z-[100000] flex">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowEpisodePanel(false)}
          />
          <div className="relative ml-auto h-full w-full max-w-md bg-neutral-950/95 border-l border-white/10 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10 text-white">
              <div>
                <div className="font-semibold">Episodes</div>
                <div className="text-xs text-white/60">{normalizedEpisodes.length} total</div>
              </div>
              <button
                className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                onClick={() => setShowEpisodePanel(false)}
                aria-label="Close episodes"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-2">
              {normalizedEpisodes.map((ep) => {
                const active = currentEpisode?.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      const stream = ep.streamUrl || currentSrc.src;
                      handleSourceChange(
                        { src: stream, label: ep.name ?? `S${ep.seasonNumber}E${ep.episodeNumber}` },
                        ep
                      );
                      setShowEpisodePanel(false);
                    }}
                    className={`w-full text-left rounded-lg p-3 border ${
                      active ? "border-[#fd7e14] bg-[#fd7e14]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    } transition`}
                  >
                    <div className="flex items-center justify-between text-white text-sm">
                      <span>
                        S{ep.seasonNumber ?? "?"}E{ep.episodeNumber ?? "?"} · {ep.name ?? "Episode"}
                      </span>
                      {ep.runtimeMinutes ? (
                        <span className="text-xs text-white/60">{ep.runtimeMinutes}m</span>
                      ) : null}
                    </div>
                    {ep.synopsis ? (
                      <div className="text-xs text-white/60 mt-1 line-clamp-2">{ep.synopsis}</div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Gestures */}
      <div className="absolute inset-y-0 left-0 w-1/2" onClick={() => handleTap("left")} />
      <div className="absolute inset-y-0 right-0 w-1/2" onClick={() => handleTap("right")} />

      {/* Controls */}
      {showControls && (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white font-semibold text-lg drop-shadow">
              {title}
              {currentEpisode ? (
                <span className="text-sm text-white/70 ml-2">
                  S{currentEpisode.seasonNumber ?? "?"}E{currentEpisode.episodeNumber ?? "?"} · {currentEpisode.name}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                aria-label="Show help"
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={() => setHelpOpen((v) => !v)}
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                aria-label="Close player"
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={() => {
                  reportProgress(true);
                  onClose();
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
            {normalizedEpisodes.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm disabled:opacity-50"
                  disabled={
                    !currentEpisode ||
                    normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) <= 0
                  }
                  onClick={() => {
                    if (!currentEpisode) return;
                    const idx = normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id);
                    if (idx > 0) {
                      const prev = normalizedEpisodes[idx - 1];
                      const stream = prev.streamUrl || currentSrc.src;
                      handleSourceChange(
                        { src: stream, label: prev.name ?? `S${prev.seasonNumber}E${prev.episodeNumber}` },
                        prev
                      );
                    }
                  }}
                >
                  Prev episode
                </button>
                <button
                  className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm disabled:opacity-50"
                  disabled={
                    !currentEpisode ||
                    normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) >=
                      normalizedEpisodes.length - 1
                  }
                  onClick={() => {
                    if (!currentEpisode) return;
                    const idx = normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id);
                    if (idx >= 0 && idx < normalizedEpisodes.length - 1) {
                      const next = normalizedEpisodes[idx + 1];
                      const stream = next.streamUrl || currentSrc.src;
                      handleSourceChange(
                        { src: stream, label: next.name ?? `S${next.seasonNumber}E${next.episodeNumber}` },
                        next
                      );
                    }
                  }}
                >
                  Next episode
                </button>
              </div>
            )}
            <button
              aria-label={playing ? "Pause" : "Play"}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={togglePlay}
            >
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button
              aria-label={muted ? "Unmute" : "Mute"}
              className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {muted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            <input
              aria-label="Volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24 accent-[#fd7e14]"
            />
            <div className="flex items-center gap-2 text-white text-sm ml-auto">
              {normalizedSources.length > 1 ? (
                <select
                  aria-label="Quality"
                  className="bg-white/10 text-white rounded px-2 py-1 text-sm"
                  value={currentSrc?.src}
                  onChange={(e) => {
                    const next = normalizedSources.find((s) => s.src === e.target.value);
                    if (next) handleSourceChange(next, currentEpisode ?? undefined);
                  }}
                >
                  {normalizedSources.map((s) => (
                    <option key={s.src} value={s.src} className="bg-neutral-900 text-white">
                      {s.label ?? "HD"}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-1 rounded bg-white/10 text-white text-xs border border-white/15">
                  {normalizedSources[0]?.label ?? "HD"}
                </div>
              )}
              {pipAvailable && (
                <button
                  aria-label="Picture in Picture"
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                  onClick={togglePip}
                >
                  <PictureInPicture className="w-5 h-5" />
                </button>
              )}
              <button
                aria-label="Fullscreen"
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {document.fullscreenElement ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {normalizedEpisodes.length > 0 && (
            <div className="flex items-center gap-3 mb-2">
              <button
                className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm"
                onClick={() => setShowEpisodePanel(true)}
              >
                Episodes
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-white text-xs">
            <span className="w-12 tabular-nums text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1">
              <input
                aria-label="Seek"
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full accent-[#fd7e14]"
                onMouseDown={() => setShowControls(true)}
              />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 h-1 rounded-full bg-white/10" />
                <div className="absolute inset-y-0 left-0 h-1 rounded-full bg-white/30" style={{ width: `${bufferedPct}%` }} />
              </div>
            </div>
            <span className="w-12 tabular-nums text-left">{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* Tips / Help */}
      {(showTips || helpOpen) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 rounded-lg px-4 py-3 max-w-lg text-white text-sm shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1">
              <div className="font-semibold">Playback tips</div>
              <ul className="list-disc list-inside space-y-1 text-neutral-200">
                <li>Tap controls or press Space to play/pause.</li>
                <li>Double-tap left/right to jump {gestureSeekSeconds}s.</li>
                <li>Arrow keys seek ±5s; M mutes; F fullscreen.</li>
                <li>Use the quality dropdown to switch renditions.</li>
              </ul>
            </div>
            <button
              aria-label="Dismiss tips"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              onClick={() => {
                setHelpOpen(false);
                dismissTips();
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function durGreaterThanZero(video: HTMLVideoElement) {
  return Number.isFinite(video.duration) && video.duration > 0;
}

function maybePersistProgress(
  key: string,
  time: number,
  duration: number,
  lastSavedRef: MutableRefObject<number>,
  options?: { force?: boolean }
) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (!options?.force && now - lastSavedRef.current < 1000) return;
  const completion = duration ? time / duration : 0;
  lastSavedRef.current = now;
  if (!duration || time < 5 || completion >= 0.97) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(
    key,
    JSON.stringify({
      time,
      duration,
      updatedAt: now,
    })
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
