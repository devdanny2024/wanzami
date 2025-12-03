import { useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Captions, HelpCircle, RefreshCw } from "lucide-react";

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
  onEvent?: (eventType: string, metadata?: Record<string, any>) => void;
  gestureSeekSeconds?: number;
};

const TIPS_STORAGE_KEY = "wanzami_player_tips_seen";

export function CustomMediaPlayer({
  title,
  poster,
  sources,
  onClose,
  titleId,
  profileId,
  onEvent,
  gestureSeekSeconds = 10,
}: CustomMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentSrc, setCurrentSrc] = useState<MediaSource>(sources[0]);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showTips, setShowTips] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(TIPS_STORAGE_KEY) !== "1";
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [lastTap, setLastTap] = useState<{ time: number; side: "left" | "right" } | null>(null);

  const percentage = useMemo(() => (duration ? (currentTime / duration) * 100 : 0), [currentTime, duration]);

  const fireEvent = (eventType: string, metadata?: Record<string, any>) => {
    onEvent?.(eventType, {
      ...metadata,
      titleId,
      profileId,
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      setDuration(video.duration || 0);
    };
    const onTime = () => setCurrentTime(video.currentTime);
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
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      fireEvent("PLAY_END", { completionPercent: 1 });
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
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      fireEvent("PLAY_START");
    } else {
      video.pause();
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

  const handleSourceChange = (src: MediaSource) => {
    setCurrentSrc(src);
    setBuffered(0);
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
    // Telemetry omitted to align with allowed event types
  };

  const bufferedPct = useMemo(() => {
    if (!duration || !buffered) return 0;
    return Math.min(100, (buffered / duration) * 100);
  }, [buffered, duration]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      onMouseMove={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
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
        <button
          aria-label={playing ? "Pause" : "Play"}
          className="pointer-events-auto w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition"
          onClick={togglePlay}
        >
          {playing ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </button>
      </div>

      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 rounded-full p-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
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
            <div className="text-white font-semibold text-lg drop-shadow">{title}</div>
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
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-2">
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
              <select
                aria-label="Quality"
                className="bg-white/10 text-white rounded px-2 py-1 text-sm"
                value={currentSrc.src}
                onChange={(e) => {
                  const next = sources.find((s) => s.src === e.target.value);
                  if (next) handleSourceChange(next);
                }}
              >
                {sources.map((s) => (
                  <option key={s.src} value={s.src} className="bg-neutral-900 text-white">
                    {s.label ?? "Auto"}
                  </option>
                ))}
              </select>
              <button
                aria-label="Fullscreen"
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                {document.fullscreenElement ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>

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

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
