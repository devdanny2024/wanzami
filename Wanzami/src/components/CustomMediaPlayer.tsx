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
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Volume2,
  VolumeX,
  PictureInPicture,
} from "lucide-react";
import { fetchBecauseYouWatched, postEvents } from "@/lib/contentClient";
import Hls from "hls.js";
import { hasRatedEndcard, markRatedEndcard } from "@/lib/endCardCache";
import { Sticker } from "./cs/kit";

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
  previewSpriteUrl?: string | null;
  previewVttUrl?: string | null;
  enableEndCardRating?: boolean;
  endCreditsStart?: number;
  assetVersions?: {
    rendition: "R4K" | "R2K" | "R1080" | "R720" | "R360" | string;
    url?: string | null;
    sizeBytes?: number;
    durationSec?: number;
    status?: string;
  }[];
};

type CustomMediaPlayerProps = {
  title: string;
  poster?: string | null;
  previewSpriteUrl?: string | null;
  previewVttUrl?: string | null;
  sources: MediaSource[];
  onClose: () => void;
  titleId?: string;
  profileId?: string;
  accessToken?: string;
  deviceId?: string;
  episodes?: Episode[];
  currentEpisodeId?: string;
  startTimeSeconds?: number;
  enableEndCardRating?: boolean;
  endCreditsStart?: number;
};

const pickInitialSource = (sources: MediaSource[]) => {
  if (!sources.length) return undefined;
  const byLabel = (label: string) =>
    sources.find((s) => (s.label ?? "").toLowerCase().includes(label));
  return byLabel("1080") || sources[0];
};

export function CustomMediaPlayer({
  title,
  titleId,
  poster,
  previewVttUrl,
  previewSpriteUrl,
  sources,
  onClose,
  accessToken,
  deviceId,
  profileId,
  episodes = [],
  currentEpisodeId,
  startTimeSeconds,
  enableEndCardRating,
  endCreditsStart,
}: CustomMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedStart = useRef(false);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number | null>(null);
  const lastTapXRef = useRef<number | null>(null);
  const ignoreClickUntil = useRef<number>(0);
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

  const seasonNumbers = useMemo(() => {
    const set = new Set<number>();
    normalizedEpisodes.forEach((e) => set.add(e.seasonNumber ?? 1));
    return Array.from(set).sort((a, b) => a - b);
  }, [normalizedEpisodes]);

  const buildSourcesFromEpisode = useCallback((ep?: Episode | null): MediaSource[] => {
    if (!ep?.assetVersions?.length) return [];
    const rank: Record<string, number> = { R4K: 5, R2K: 4, R1080: 3, R720: 2, R360: 1 };
    const isHlsAsset = (value?: string | null) => {
      if (!value) return false;
      return /\.m3u8($|\?)/i.test(value) || /[?&]key=[^&]*\.m3u8(?:$|&)/i.test(value);
    };
    return ep.assetVersions
      .filter((a) => a?.url)
      .sort((a, b) => (rank[b.rendition] ?? 0) - (rank[a.rendition] ?? 0))
      .map((a) => ({
        src: a.url as string,
        label:
          a.rendition === "R4K"
            ? "4K"
            : a.rendition === "R2K"
            ? "2K"
            : a.rendition === "R1080"
            ? "1080p"
            : a.rendition === "R720"
            ? "720p"
            : a.rendition === "R360"
            ? "360p"
            : a.rendition ?? "Source",
        type: isHlsAsset(a.url as string)
          ? "application/x-mpegURL"
          : "video/mp4",
      }));
  }, []);

  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(() => {
    if (!normalizedEpisodes.length) return null;
    if (currentEpisodeId) {
      return normalizedEpisodes.find((e) => e.id === currentEpisodeId) ?? normalizedEpisodes[0];
    }
    return normalizedEpisodes[0];
  });
  const episodeSources = useMemo(
    () => buildSourcesFromEpisode(currentEpisode),
    [buildSourcesFromEpisode, currentEpisode]
  );
  const activeSources = useMemo(
    () => (episodeSources.length ? episodeSources : normalizedSources),
    [episodeSources, normalizedSources]
  );
  const [currentSrc, setCurrentSrc] = useState<MediaSource | undefined>(
    pickInitialSource(activeSources) ?? activeSources[0]
  );
  // sync selected episode if prop changes
  useEffect(() => {
    if (!currentEpisodeId) return;
    const next = normalizedEpisodes.find((e) => e.id === currentEpisodeId);
    if (next && next.id !== currentEpisode?.id) {
      setCurrentEpisode(next);
    }
  }, [currentEpisode?.id, currentEpisodeId, normalizedEpisodes]);
  // reset source when sources change (episode switch or prop change)
  useEffect(() => {
    if (!activeSources.length) return;
    setCurrentSrc(pickInitialSource(activeSources) ?? activeSources[0]);
  }, [activeSources]);

  // Landing here always follows a "Play"/"Continue Watching" click on the
  // previous page, so start playback immediately instead of making the
  // viewer click again.
  const shouldAutoplay = true;
  const hasSources = useMemo(() => {
    return Boolean(
      (activeSources && activeSources.length > 0) ||
        episodes?.some((ep) => ep.streamUrl)
    );
  }, [activeSources, episodes]);
  const [isPlaying, setIsPlaying] = useState<boolean>(shouldAutoplay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showEpisodePanel, setShowEpisodePanel] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [pipAvailable, setPipAvailable] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(true);
  const [previewTime, setPreviewTime] = useState<number | null>(null);
  const [previewPos, setPreviewPos] = useState<number>(0);
  const [previewCues, setPreviewCues] = useState<
    { start: number; end: number; url: string; x?: number; y?: number; w?: number; h?: number }[]
  >([]);
  const pendingResume = useRef(false);
  const lastProgressSent = useRef<number>(0);
  const lastKnownTime = useRef<number>(0);
  const hasSentStart = useRef(false);
  const unmounted = useRef(false);
  const endCardShownRef = useRef(false);
  const hlsRef = useRef<any>(null);
  const [showEndCard, setShowEndCard] = useState(false);
  const [endCardSentiment, setEndCardSentiment] = useState<"UP" | "DOWN" | null>(null);
  const [endCardLoading, setEndCardLoading] = useState(false);
  const [endCardError, setEndCardError] = useState<string | null>(null);
  const [endCardRecs, setEndCardRecs] = useState<
    { id: string; backendId?: string; title: string; image: string }[]
  >([]);

  const shouldLockLandscape = useCallback(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 900px)").matches;
  }, []);

  const supportsOrientationLock = useMemo(() => {
    if (typeof window === "undefined") return false;
    const orientation = window.screen?.orientation as any;
    return Boolean(orientation && typeof orientation.lock === "function");
  }, []);

  const [forceRotate, setForceRotate] = useState(false);

  const unlockLandscape = useCallback(() => {
    if (typeof window === "undefined") return;
    const orientation = window.screen?.orientation as ScreenOrientation | undefined;
    if (orientation && typeof (orientation as any).unlock === "function") {
      try {
        (orientation as any).unlock();
      } catch {
        // ignore
      }
    }
    setForceRotate(false);
  }, []);

  // Mobile web should always watch in landscape. Where the Screen Orientation
  // API is supported (Android Chrome/Firefox — requires fullscreen first) we
  // use the real lock; Safari on iOS has no such API, so we fake it with a
  // CSS rotation of the player container instead.
  const enterLandscapeMode = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (!shouldLockLandscape()) return;
    if (window.matchMedia("(orientation: landscape)").matches) return;

    if (supportsOrientationLock) {
      try {
        const container = containerRef.current;
        if (container && !document.fullscreenElement) {
          await container.requestFullscreen();
        }
        await (window.screen.orientation as any).lock("landscape");
        return;
      } catch {
        // Lock rejected (e.g. fullscreen was blocked) — fall through to the
        // CSS fallback below.
      }
    }
    setForceRotate(true);
  }, [shouldLockLandscape, supportsOrientationLock]);

  // If the viewer physically rotates the phone, drop the CSS fallback so we
  // don't rotate an already-landscape screen a second time.
  useEffect(() => {
    if (!forceRotate) return;
    const mq = window.matchMedia("(orientation: landscape)");
    const handleOrientationChange = () => {
      if (mq.matches) setForceRotate(false);
    };
    mq.addEventListener("change", handleOrientationChange);
    return () => mq.removeEventListener("change", handleOrientationChange);
  }, [forceRotate]);

  useEffect(() => {
    if (!forceRotate) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [forceRotate]);

  const updateLocalContinueWatching = useCallback(
    (payload: { completionPercent?: number; positionSec?: number; durationSec?: number }) => {
      if (typeof window === "undefined") return;
      if (!titleId) return;

      const { completionPercent, positionSec, durationSec } = payload;
      const hasCompletion =
        typeof completionPercent === "number" &&
        Number.isFinite(completionPercent) &&
        completionPercent > 0;
      const hasPosition =
        typeof positionSec === "number" && Number.isFinite(positionSec) && positionSec > 0;

      if (!hasCompletion && !hasPosition) return;

      try {
        const key = "wanzami:cw-progress";
        const raw = window.localStorage.getItem(key);
        const parsed =
          raw && typeof raw === "string"
            ? (JSON.parse(raw) as Record<
                string,
                {
                  completionPercent?: number;
                  positionSec?: number;
                  durationSec?: number;
                  updatedAt?: number;
                }
              >)
            : {};
        const idKey = String(titleId);
        const prev = parsed[idKey];

        const nextCompletion = (() => {
          if (!hasCompletion) return prev?.completionPercent;
          const incoming = Math.max(0, Math.min(1, completionPercent as number));
          if (typeof prev?.completionPercent === "number") {
            return Math.max(prev.completionPercent, incoming);
          }
          return incoming;
        })();

        const nextPosition = hasPosition ? positionSec : prev?.positionSec;
        const nextDuration =
          typeof durationSec === "number" && Number.isFinite(durationSec) && durationSec > 0
            ? durationSec
            : prev?.durationSec;

        parsed[idKey] = {
          completionPercent: nextCompletion,
          positionSec: nextPosition,
          durationSec: nextDuration,
          updatedAt: Date.now(),
        };
        window.localStorage.setItem(key, JSON.stringify(parsed));
      } catch {
        // ignore local persistence errors
      }
    },
    [titleId],
  );

  const emitEvent = useCallback(
    async (eventType: "PLAY_START" | "PLAY_END" | "SCRUB", metadata?: Record<string, any>, force = false) => {
      if (!accessToken || !titleId) return;
      const now = Date.now();
      if (!force && eventType === "PLAY_END" && now - lastProgressSent.current < 12000) {
        return;
      }
      lastProgressSent.current = now;
      const currentFromVideo = videoRef.current?.currentTime ?? 0;
      const time = lastKnownTime.current || currentFromVideo || 0;
      const dur = videoRef.current?.duration ?? duration ?? 0;
      const completionPercent = dur > 0 ? Math.max(0, Math.min(1, time / dur)) : 0;
      try {
        if (eventType === "PLAY_END" || eventType === "SCRUB") {
          updateLocalContinueWatching({
            completionPercent,
            positionSec: time,
            durationSec: dur,
          });
        }
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
                completionPercent,
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
    [accessToken, currentEpisode?.id, currentSrc?.label, deviceId, duration, profileId, titleId, updateLocalContinueWatching]
  );

  const hasPrev = currentEpisode
    ? normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) > 0
    : false;
  const hasNext = currentEpisode
    ? normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) < normalizedEpisodes.length - 1
    : false;

  const episodesForSelectedSeason = useMemo(() => {
    if (selectedSeason == null) return normalizedEpisodes;
    return normalizedEpisodes.filter((e) => (e.seasonNumber ?? 1) === selectedSeason);
  }, [normalizedEpisodes, selectedSeason]);

  // Default the drawer to whichever season is currently playing.
  useEffect(() => {
    if (!showEpisodePanel) return;
    setSelectedSeason((prev) => prev ?? currentEpisode?.seasonNumber ?? normalizedEpisodes[0]?.seasonNumber ?? 1);
  }, [showEpisodePanel, currentEpisode?.seasonNumber, normalizedEpisodes]);

  // End-card helpers
  const endCardEnabled = useMemo(() => {
    const epiFlag = currentEpisode?.enableEndCardRating;
    return epiFlag ?? enableEndCardRating ?? true;
  }, [currentEpisode?.enableEndCardRating, enableEndCardRating]);

  const endCardTriggerTime = useMemo(() => {
    if (currentEpisode?.endCreditsStart != null) return currentEpisode.endCreditsStart;
    if (endCreditsStart != null) return endCreditsStart;
    if (duration > 0) return Math.max(duration - 30, 10);
    return Number.POSITIVE_INFINITY;
  }, [currentEpisode?.endCreditsStart, duration, endCreditsStart]);

  const alreadyRated = useMemo(
    () => hasRatedEndcard(titleId, currentEpisode?.id),
    [currentEpisode?.id, titleId]
  );

  const maybeShowEndCard = useCallback(() => {
    if (!endCardEnabled) return;
    if (alreadyRated) return;
    if (showEndCard || endCardShownRef.current) return;
    if (duration > 0 && currentTime >= endCardTriggerTime) {
      endCardShownRef.current = true;
      setShowEndCard(true);
      setEndCardSentiment(null);
      setEndCardError(null);
      setEndCardRecs([]);
    }
  }, [alreadyRated, currentTime, duration, endCardEnabled, endCardTriggerTime, showEndCard]);

  // Show end-card when the viewer seeks close to the trigger time
  useEffect(() => {
    if (!endCardEnabled) return;
    if (alreadyRated) return;
    if (showEndCard || endCardShownRef.current) return;
    if (duration <= 0 || !Number.isFinite(endCardTriggerTime)) return;

    const threshold = Math.max(endCardTriggerTime - 1, 0);
    if (currentTime >= threshold) {
      endCardShownRef.current = true;
      setShowEndCard(true);
      setEndCardSentiment(null);
      setEndCardError(null);
      setEndCardRecs([]);
    }
  }, [
    alreadyRated,
    currentTime,
    duration,
    endCardEnabled,
    endCardTriggerTime,
    showEndCard,
  ]);

  const sendPlayStart = useCallback(
    (reason: string) => {
      if (hasSentStart.current) return;
      hasSentStart.current = true;
      void emitEvent("PLAY_START", { reason }, true);
    },
    [emitEvent]
  );

  useEffect(() => {
    setPipAvailable(Boolean((document as any).pictureInPictureEnabled));
  }, []);

  useEffect(() => {
    hasSentStart.current = false;
    endCardShownRef.current = false;
    setShowEndCard(false);
    setEndCardSentiment(null);
    setEndCardRecs([]);
    setEndCardError(null);
  }, [currentSrc?.src, currentEpisode?.id]);

  useEffect(() => {
    const video = videoRef.current;
    const src = currentEpisode?.streamUrl || currentSrc?.src;
    if (!video || !src) return;

    const isHlsSource = (source: string, type?: string) => {
      const lower = source.toLowerCase();
      if (lower.endsWith(".m3u8") || /\.m3u8($|\?)/i.test(source) || /[?&]key=[^&]*\.m3u8(?:$|&)/i.test(source)) return true;
      if (type && type.toLowerCase().includes("mpegurl")) return true;
      return false;
    };

    const hlsLike = isHlsSource(src, currentSrc?.type);

    const detachHls = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    if (hlsLike && typeof window !== "undefined") {
      if (Hls.isSupported()) {
        if (!hlsRef.current) {
          const hls = new Hls({ enableWorker: true });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            console.error("HLS error", data.type, data.details, data.fatal);
            if (data.fatal) {
              video.dispatchEvent(new Event("error"));
            }
          });
          hlsRef.current = hls;
        } else {
          hlsRef.current.detachMedia();
        }
        hlsRef.current.loadSource(src);
        hlsRef.current.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        detachHls();
        video.src = src;
        video.load();
      } else {
        detachHls();
        video.src = src;
        video.load();
      }
    } else {
      detachHls();
      video.src = src;
      video.load();
    }

    if (shouldAutoplay) {
      void video.play().catch(() => undefined);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.detachMedia();
      }
    };
  }, [currentSrc?.src, currentSrc?.type, currentEpisode?.streamUrl, shouldAutoplay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldAutoplay) return;
    video.autoplay = true;
    setIsPlaying(true);
    void video.play().catch(() => {
      pendingResume.current = true;
    });
    sendPlayStart("auto_play");
  }, [sendPlayStart, shouldAutoplay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      lastKnownTime.current = video.currentTime;
      void emitEvent("PLAY_END", { reason: "progress" }, false);
      maybeShowEndCard();
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
      maybeShowEndCard();
      if (hasNext) {
        handleNext();
        return;
      }
      void emitEvent("PLAY_END", { reason: "ended" }, true);
    };
    const handleError = () => {
      const idx = activeSources.findIndex((s) => s.src === currentSrc?.src);
      const fallback =
        activeSources[idx + 1] ?? activeSources.find((s) => s.src !== currentSrc?.src);
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
    const handlePlaying = () => {
      setIsPlaying(true);
      // "playing" fires whenever the video actually resumes advancing, including
      // after a mid-playback rebuffer where "canplay" doesn't reliably refire —
      // so this is the one authoritative place to clear the buffering spinner.
      setIsBuffering(false);
      sendPlayStart("playing");
      void enterLandscapeMode();
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
    };
  }, [emitEvent, hasNext, startTimeSeconds, currentSrc, activeSources, sendPlayStart, maybeShowEndCard, enterLandscapeMode]);

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
      setIsBuffering(true);
      void video.play().catch(() => undefined);
      setIsPlaying(true);
      sendPlayStart("play");
    }
  };

  const seekRelative = (deltaSec: number, reason: string = "key_seek") => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.duration || !Number.isFinite(video.duration)) return;
    setIsBuffering(true);
    const target = Math.max(0, Math.min(video.duration || 0, (video.currentTime || 0) + deltaSec));
    video.currentTime = target;
    setCurrentTime(target);
    lastKnownTime.current = target;
    void emitEvent("SCRUB", { reason, positionSec: target }, true);
    if (isPlaying) {
      pendingResume.current = true;
      void video.play().catch(() => undefined);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    setIsBuffering(true);
    video.currentTime = time;
    setCurrentTime(time);
    lastKnownTime.current = time;
    void emitEvent("SCRUB", { reason: "seek", positionSec: time }, true);
    if (isPlaying) {
      pendingResume.current = true;
      void video.play().catch(() => undefined);
    }
  };

  const adjustVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const base = isMuted ? volume : video.volume;
    const next = Math.min(1, Math.max(0, base + delta));
    video.volume = next;
    setVolume(next);
    setIsMuted(next === 0);
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
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container) return;

    // iOS Safari: use native fullscreen on the video element.
    if (typeof window !== "undefined" && /iPad|iPhone|iPod/.test(window.navigator.userAgent)) {
      const anyVideo = video as any;
      if (anyVideo && typeof anyVideo.webkitEnterFullscreen === "function") {
        anyVideo.webkitEnterFullscreen();
        return;
      }
    }

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => undefined);
      // Try to lock orientation to landscape where supported.
      if (typeof screen !== "undefined" && (screen as any).orientation?.lock) {
        (screen as any).orientation.lock("landscape").catch(() => undefined);
      }
    } else {
      document.exitFullscreen().catch(() => undefined);
      if (typeof screen !== "undefined" && (screen as any).orientation?.unlock) {
        (screen as any).orientation.unlock();
      }
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only react when focus is inside the player to avoid
      // hijacking global shortcuts elsewhere on the page.
      const container = containerRef.current;
      if (!container) return;
      const active = document.activeElement;
      if (active && !container.contains(active)) return;

      switch (e.key) {
        case " ":
        case "Spacebar":
        case "k":
        case "K":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekRelative(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekRelative(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          adjustVolume(0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          adjustVolume(-0.05);
          break;
        case "m":
        case "M":
          e.preventDefault();
          toggleMute();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "Escape":
          e.preventDefault();
          if (showEpisodePanel) {
            setShowEpisodePanel(false);
          } else if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => undefined);
          } else {
            const video = videoRef.current;
            if (video) {
              video.pause();
              video.removeAttribute("src");
              video.load();
            }
            onClose();
          }
          break;
        default:
          return;
      }

      setIsHovering(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [adjustVolume, onClose, seekRelative, toggleFullscreen, toggleMute, togglePlay, showEpisodePanel]);

  const handleQualityChange = (source: MediaSource) => {
    const video = videoRef.current;
    const time = video?.currentTime ?? 0;
    setIsBuffering(true);
    setCurrentSrc(source);
    setShowQualityMenu(false);
    if (video) {
      video.pause();
    }
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        pendingResume.current = true;
        void videoRef.current.play().catch(() => undefined);
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
    const epSources = buildSourcesFromEpisode(ep);
    if (ep.streamUrl) {
      setCurrentSrc(epSources[0] ?? activeSources[0]);
    } else if (epSources.length) {
      setCurrentSrc(epSources[0]);
    } else {
      setCurrentSrc(activeSources[0]);
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

  const fetchEndCardRecs = useCallback(async () => {
    if (!accessToken || !titleId) {
      setEndCardError("Sign in to see suggestions");
      setEndCardRecs([]);
      return;
    }
    try {
      setEndCardLoading(true);
      setEndCardError(null);
      const recRes = await fetchBecauseYouWatched(accessToken, profileId, {
        seed: String(titleId),
        limit: 2,
      });
      const items = (recRes?.items ?? []).slice(0, 2).map((item: any, idx: number) => {
        const fallbackImage = "https://placehold.co/600x900/111111/FD7E14?text=Wanzami";
        return {
          id: item?.id ?? item?.titleId ?? `${titleId}-rec-${idx}`,
          backendId: item?.titleId ?? item?.id,
          title: item?.name ?? item?.title ?? `Title ${item?.titleId ?? ""}`.trim(),
          image: item?.thumbnailUrl || item?.posterUrl || fallbackImage,
        };
      });
      setEndCardRecs(items);
    } catch (err: any) {
      setEndCardError(err?.message ?? "Could not load suggestions");
      setEndCardRecs([]);
    } finally {
      setEndCardLoading(false);
    }
  }, [accessToken, profileId, titleId]);

  const sendThumbFeedback = useCallback(
    async (sentiment: "UP" | "DOWN") => {
      setEndCardSentiment(sentiment);
      markRatedEndcard(titleId, currentEpisode?.id);
      if (accessToken && titleId) {
        try {
          await postEvents(
            [
              {
                eventType: sentiment === "UP" ? "THUMBS_UP" : "THUMBS_DOWN",
                titleId,
                episodeId: currentEpisode?.id,
                profileId,
                deviceId,
                metadata: {
                  source: "endcard",
                },
              },
            ],
            accessToken
          );
        } catch {
          // ignore send errors
        }
      }
      void fetchEndCardRecs();
    },
    [accessToken, currentEpisode?.id, deviceId, fetchEndCardRecs, profileId, titleId]
  );

  const handleRecClick = useCallback((recId?: string, backendId?: string) => {
    const target = backendId ?? recId;
    if (!target) return;
    window.location.href = `/title/${target}`;
  }, []);

  const handleEndCardSkip = () => {
    setShowEndCard(false);
  };

  const handleEndCardEnter = () => {
    if (!endCardRecs.length) {
      setShowEndCard(false);
      return;
    }
    const first = endCardRecs[0];
    setShowEndCard(false);
    handleRecClick(first.id, first.backendId);
  };

  useEffect(() => {
    return () => {
      unmounted.current = true;
      void emitEvent("PLAY_END", { reason: "unmount" }, true);
      unlockLandscape();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined);
      }
    };
  }, [emitEvent, unlockLandscape]);

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
    ? `S${currentEpisode.seasonNumber ?? "?"} · E${currentEpisode.episodeNumber ?? "?"}`
    : null;

  // Load VTT preview cues when available (episode > title fallback)
  useEffect(() => {
    const sourceVtt = currentEpisode?.previewVttUrl || previewVttUrl;
    if (!sourceVtt) {
      setPreviewCues([]);
      return;
    }
    let cancelled = false;
    const parseVtt = (text: string) => {
      const lines = text.split(/\r?\n/);
      const cues: { start: number; end: number; url: string; x?: number; y?: number; w?: number; h?: number }[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const timingMatch = line.match(/(\\d{2}:\\d{2}:\\d{2}\\.\\d{3}|\\d{2}:\\d{2}\\.\\d{3})\\s+-->\\s+(\\d{2}:\\d{2}:\\d{2}\\.\\d{3}|\\d{2}:\\d{2}\\.\\d{3})/);
        if (timingMatch && lines[i + 1]) {
          const toSeconds = (ts: string) => {
            const parts = ts.split(":").map(Number);
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            return 0;
          };
          const start = toSeconds(timingMatch[1]);
          const end = toSeconds(timingMatch[2]);
          const content = lines[i + 1].trim();
          const [urlPart, xywh] = content.split("#xywh=");
          const cue: any = { start, end, url: urlPart };
          if (xywh) {
            const [x, y, w, h] = xywh.split(",").map((v) => Number(v));
            cue.x = x;
            cue.y = y;
            cue.w = w;
            cue.h = h;
          }
          cues.push(cue);
        }
      }
      return cues;
    };
    const load = async () => {
      try {
        const res = await fetch(sourceVtt, { cache: "force-cache" });
        const text = await res.text();
        if (!cancelled) setPreviewCues(parseVtt(text));
      } catch {
        if (!cancelled) setPreviewCues([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentEpisode?.id, currentEpisode?.previewVttUrl, previewVttUrl]);

  const handleContainerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsHovering(true);
    const touch = e.touches[0];
    const container = containerRef.current;
    if (!touch || !container) return;

    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width || 1;

    const now = Date.now();
    const last = lastTapRef.current ?? 0;
    const lastX = lastTapXRef.current;
    const isDoubleTap =
      now - last < 350 && lastX != null && Math.abs(lastX - x) < width * 0.35;

    if (isDoubleTap) {
      e.preventDefault();
      const side = x < width / 2 ? "left" : "right";
      const delta = side === "left" ? -10 : 10;
      seekRelative(delta, "tap_skip");
      lastTapRef.current = null;
      lastTapXRef.current = null;
      ignoreClickUntil.current = now + 400;
    } else {
      lastTapRef.current = now;
      lastTapXRef.current = x;
    }
  };

  const handleContainerTouchEnd = () => {
    // Allow a brief period with controls visible after tap.
    window.setTimeout(() => setIsHovering(false), 2500);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-black group overflow-visible fixed ${forceRotate ? "" : "inset-0"}`}
      style={
        forceRotate
          ? {
              top: "50%",
              left: "50%",
              width: "100vh",
              height: "100vw",
              transform: "translate(-50%, -50%) rotate(90deg)",
              transformOrigin: "center center",
            }
          : undefined
      }
      tabIndex={0}
      role="region"
      aria-label={`${title} player`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => setIsHovering(true)}
      onTouchStart={handleContainerTouchStart}
      onTouchEnd={handleContainerTouchEnd}
    >
      <video
        ref={videoRef}
        src={currentEpisode?.streamUrl || currentSrc?.src}
        poster={poster ?? undefined}
        className={`absolute inset-0 w-full h-full object-contain bg-black ${isBuffering ? "blur-sm" : ""}`}
        onClick={() => {
          const now = Date.now();
          if (ignoreClickUntil.current && now < ignoreClickUntil.current) {
            return;
          }
          togglePlay();
        }}
        controls={false}
        style={{ zIndex: 1 }}
      />

      <div
        className="absolute top-0 left-0 right-0 h-3.5 md:h-4 bg-[#0a0908] overflow-hidden pointer-events-none"
        style={{ zIndex: 6 }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3.5 pl-3.5 w-max cs-sprocket-track">
          {Array.from({ length: 80 }).map((_, i) => (
            <span key={i} className="block w-2 h-2 rounded-[1px] bg-black/70" />
          ))}
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-3.5 md:h-4 bg-[#0a0908] overflow-hidden pointer-events-none"
        style={{ zIndex: 6 }}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3.5 pl-3.5 w-max cs-sprocket-track">
          {Array.from({ length: 80 }).map((_, i) => (
            <span key={i} className="block w-2 h-2 rounded-[1px] bg-black/70" />
          ))}
        </div>
      </div>

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
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                video.pause();
                video.removeAttribute("src");
                video.load();
              }
              onClose();
            }}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div className="text-white min-w-0">
            <div className="flex items-center gap-2 md:gap-3">
              {currentEpisodeLabel ? (
                <span
                  className="flex-none font-mono text-[10px] font-bold uppercase tracking-widest text-cs-ink bg-brand px-2 py-1 shadow-[3px_3px_0_rgba(0,0,0,0.55)]"
                  style={{ transform: "rotate(-2deg)" }}
                >
                  {currentEpisodeLabel}
                </span>
              ) : null}
              <div className="min-w-0">
                {currentEpisode ? (
                  <div className="font-mono text-[11px] uppercase tracking-widest text-white/60 truncate">
                    {title}
                  </div>
                ) : null}
                <div className="font-heading uppercase text-lg md:text-2xl leading-none text-white truncate">
                  {currentEpisode?.name ?? title}
                </div>
              </div>
            </div>
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
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 15 }}
        >
          <button
            onClick={togglePlay}
            aria-label="Play"
            className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/40 border-2 border-cs-paper flex items-center justify-center transition-all hover:scale-105 hover:bg-cs-rust hover:border-cs-rust active:scale-95 pointer-events-auto shadow-[6px_6px_0_rgba(0,0,0,0.5)]"
          >
            <Play className="w-8 h-8 md:w-10 md:h-10 text-cs-paper ml-1" fill="currentColor" />
          </button>
        </div>
      )}

      {isBuffering && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 30 }}
        >
          <div className="h-12 w-12 border-2 border-white/30 border-t-[#fd7e14] rounded-full animate-spin" />
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

        <div className="mb-3 md:mb-4 relative">
          {previewTime !== null && duration > 0 && (
            <div
              className="absolute bg-cs-paper text-cs-ink text-xs border-2 border-cs-ink shadow-[4px_4px_0_rgba(0,0,0,0.55)] overflow-hidden pointer-events-none"
              style={{
                left: `${previewPos}%`,
                top: "-134px",
                transform: "translateX(-50%) rotate(-1deg)",
                zIndex: 25,
              }}
            >
              <div className="w-40 h-24 bg-cs-ink/90 flex items-center justify-center p-1">
                {(() => {
                  const cue = previewCues.find((c) => previewTime >= c.start && previewTime <= c.end);
                  if (cue) {
                    if (cue.x !== undefined && cue.y !== undefined && cue.w && cue.h) {
                      return (
                        <div
                          style={{
                            width: `${cue.w}px`,
                            height: `${cue.h}px`,
                            backgroundImage: `url(${cue.url})`,
                            backgroundPosition: `-${cue.x}px -${cue.y}px`,
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "auto",
                          }}
                        />
                      );
                    }
                    return <img src={cue.url} alt="Preview" className="w-full h-full object-cover" />;
                  }
                  return poster || currentEpisode?.thumbnailUrl ? (
                    <img
                      src={currentEpisode?.thumbnailUrl ?? poster ?? ""}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/70 text-xs">Preview</div>
                  );
                })()}
              </div>
              <div className="px-2 py-1 text-center font-mono text-[11px] font-bold border-t-2 border-cs-ink">
                {formatTime(previewTime)}
              </div>
            </div>
          )}
          <div className="relative">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              onMouseMove={(e) => {
                if (!duration) return;
                const rect = (e.target as HTMLInputElement).getBoundingClientRect();
                const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                setPreviewPos(pct * 100);
                setPreviewTime(pct * duration);
              }}
              onMouseLeave={() => {
                setPreviewTime(null);
              }}
              className="cs-player-scrub w-full h-1.5 bg-white/20 appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #fd7e14 0%, #fd7e14 ${
                  duration ? (currentTime / duration) * 100 : 0
                }%, rgba(255,255,255,0.22) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.22) 100%)`,
              }}
            />
            <div className="absolute inset-0 flex items-center pointer-events-none px-[1px]">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-black/25 h-full last:border-r-0" />
              ))}
            </div>
          </div>
        </div>

        <div className="block md:hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-7 h-7" fill="white" /> : <Play className="w-7 h-7" fill="white" />}
              </button>
              <button
                onClick={() => seekRelative(-10, "button_seek")}
                className="text-white hover:scale-110 transition-transform"
                aria-label="Rewind 10 seconds"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={() => seekRelative(10, "button_seek")}
                className="text-white hover:scale-110 transition-transform"
                aria-label="Fast forward 10 seconds"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              {normalizedEpisodes.length > 1 && (
                <>
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
                </>
              )}
              <button onClick={toggleMute} className="text-white hover:scale-110 transition-transform">
                {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {normalizedEpisodes.length ? (
              <button
                type="button"
                onClick={() => setShowEpisodePanel(true)}
                className="text-white hover:text-brand hover:scale-110 transition-transform"
                aria-label="Show episodes"
              >
                <List className="w-6 h-6" />
              </button>
              ) : null}
              {activeSources.length > 0 ? (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu((v) => !v)}
                    className="text-white hover:scale-110 transition-transform"
                  >
                    <Settings className="w-6 h-6" />
                  </button>
                  {showQualityMenu && (
                    <div
                      className="absolute right-0 bg-black/95 backdrop-blur-sm rounded-lg overflow-hidden min-w-40 z-50 max-h-64 overflow-auto shadow-lg"
                      style={{ bottom: "calc(100% + 12px)" }}
                    >
                      <div className="p-2 border-b border-gray-700">
                        <p className="text-white text-sm">Quality</p>
                      </div>
                      {activeSources.map((quality) => (
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
            <button
              onClick={togglePlay}
              className="text-white hover:scale-110 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-8 h-8" fill="white" /> : <Play className="w-8 h-8" fill="white" />}
            </button>
            <button
              onClick={() => seekRelative(-10, "button_seek")}
              className="text-white hover:scale-110 transition-transform"
              aria-label="Rewind 10 seconds"
            >
              <SkipBack className="w-7 h-7" />
            </button>
            <button
              onClick={() => seekRelative(10, "button_seek")}
              className="text-white hover:scale-110 transition-transform"
              aria-label="Fast forward 10 seconds"
            >
              <SkipForward className="w-7 h-7" />
            </button>
            {normalizedEpisodes.length > 1 && (
              <>
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
              </>
            )}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="text-white hover:scale-110 transition-transform"
                aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-28 group-hover/volume:w-40 transition-all duration-300 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
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
              <button
                type="button"
                onClick={() => setShowEpisodePanel(true)}
                className="flex items-center gap-2 px-3 py-2 border-[1.5px] border-white/35 text-white font-mono text-xs font-bold uppercase tracking-widest hover:border-brand hover:bg-brand/10 transition-colors"
                aria-label="Show episodes"
              >
                <List className="w-4 h-4" />
                <span>Episodes</span>
              </button>
            ) : null}
            {activeSources.length > 0 ? (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu((v) => !v)}
                  className="text-white hover:scale-110 transition-transform"
                  aria-label="Change quality"
                >
                  <Settings className="w-7 h-7" />
                </button>
                {showQualityMenu && (
                  <div
                    className="absolute right-0 bg-black/95 backdrop-blur-sm rounded-lg overflow-hidden min-w-48 z-50 max-h-72 overflow-auto shadow-lg"
                    style={{ bottom: "calc(100% + 14px)" }}
                  >
                    <div className="p-3 border-b border-gray-700">
                      <p className="text-white">Quality</p>
                    </div>
                    {activeSources.map((quality) => (
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
            <button
              onClick={toggleFullscreen}
              className="text-white hover:scale-110 transition-transform"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-7 h-7" /> : <Maximize className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {showEndCard && !alreadyRated && (
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          style={{ zIndex: 26 }}
        >
          <div className="w-full max-w-4xl bg-black/90 border border-white/10 rounded-2xl p-5 md:p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white text-xl font-semibold mb-1">Did you enjoy this?</p>
                <p className="text-white/70 text-sm">Tell us so we can suggest what to watch next.</p>
              </div>
              <button
                onClick={() => setShowEndCard(false)}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Dismiss end card"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => sendThumbFeedback("UP")}
                disabled={endCardLoading}
                className={`px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 text-white hover:bg-white/10 transition-colors ${
                  endCardSentiment === "UP" ? "bg-white/15 border-[#fd7e14]" : ""
                } ${endCardLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Like</span>
              </button>
              <button
                onClick={() => sendThumbFeedback("DOWN")}
                disabled={endCardLoading}
                className={`px-4 py-2 rounded-full flex items-center gap-2 border border-white/20 text-white hover:bg-white/10 transition-colors ${
                  endCardSentiment === "DOWN" ? "bg-white/15 border-[#fd7e14]" : ""
                } ${endCardLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>Dislike</span>
              </button>
              {endCardLoading ? (
                <div className="text-white/70 flex items-center gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating suggestions...
                </div>
              ) : null}
              {endCardError ? <div className="text-red-300 text-sm">{endCardError}</div> : null}
            </div>

            {endCardRecs.length > 0 && (
              <div>
                <p className="text-white text-sm mb-3">Because you watched:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {endCardRecs.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => handleRecClick(rec.id, rec.backendId)}
                      className="group w-full flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 text-left transition-colors"
                    >
                      <div className="w-20 h-28 rounded-lg overflow-hidden bg-black/30 flex-shrink-0">
                        <img src={rec.image} alt={rec.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate group-hover:text-[#fd7e14] transition-colors">
                          {rec.title}
                        </p>
                        <p className="text-white/60 text-xs">Play next</p>
                      </div>
                      <Play className="w-5 h-5 text-white/70 group-hover:text-white" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleEndCardSkip}
                className="px-4 py-2 rounded-full border border-white/30 text-white/80 hover:bg-white/10 text-sm md:text-base"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleEndCardEnter}
                disabled={endCardRecs.length === 0}
                className="px-4 py-2 rounded-full bg-[#fd7e14] hover:bg-[#ff8b2b] text-sm md:text-base text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Enter
              </button>
            </div>
          </div>
        </div>
      )}

      {showEpisodePanel && normalizedEpisodes.length > 0 && (
        <>
          <div
            className="fixed inset-0 bg-black/60"
            style={{ zIndex: 59 }}
            onClick={() => setShowEpisodePanel(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 h-[82%] bg-cs-paper text-cs-ink border-t-[3px] border-cs-ink shadow-[0_-8px_0_rgba(0,0,0,0.35)] flex flex-col md:inset-x-auto md:right-0 md:top-0 md:h-auto md:w-[420px] md:border-t-0 md:border-l-[3px] md:shadow-[-8px_0_0_rgba(0,0,0,0.35)]"
            style={{ zIndex: 60 }}
            role="dialog"
            aria-label="Episode list"
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b-[1.5px] border-cs-line flex-none">
              <div className="min-w-0">
                <p className="cs-slug mb-1">Shooting Script &middot; Up Next</p>
                <h2 className="font-heading uppercase text-2xl leading-none truncate">{title}</h2>
              </div>
              <button
                onClick={() => setShowEpisodePanel(false)}
                className="flex-none w-9 h-9 flex items-center justify-center bg-cs-paper border-2 border-cs-ink hover:bg-cs-ink hover:text-cs-paper transition-colors"
                aria-label="Close episode list"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {seasonNumbers.length > 1 ? (
              <div className="flex gap-2 px-5 pt-3 flex-none overflow-x-auto scrollbar-hide">
                {seasonNumbers.map((season) => (
                  <button
                    key={season}
                    onClick={() => setSelectedSeason(season)}
                    className={`font-mono text-[11px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-1.5 border-[1.5px] border-cs-ink transition-colors ${
                      selectedSeason === season
                        ? "bg-cs-ink text-cs-paper"
                        : "bg-cs-panel text-cs-ink hover:bg-white"
                    }`}
                  >
                    Season {season}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {episodesForSelectedSeason.map((ep) => {
                const active = currentEpisode?.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => switchEpisode(ep)}
                    className={`flex gap-3 text-left bg-cs-panel border-2 border-cs-ink p-2.5 shadow-[3px_3px_0_var(--color-cs-ink)] transition-transform hover:-translate-y-0.5 active:translate-y-px active:shadow-[2px_2px_0_var(--color-cs-ink)] ${
                      active ? "outline outline-2 outline-brand outline-offset-2" : ""
                    }`}
                  >
                    <div className="relative flex-none w-24 h-16 sm:w-28 sm:h-[70px] border-[1.5px] border-cs-ink bg-cs-line overflow-hidden">
                      {ep.thumbnailUrl ? (
                        <img src={ep.thumbnailUrl} alt={ep.name ?? "Episode"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-cs-ink/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-cs-muted">
                          E{ep.episodeNumber ?? "?"}
                        </span>
                        {active ? <Sticker>Now Playing</Sticker> : null}
                        {ep.runtimeMinutes ? (
                          <span className="font-mono text-[10px] text-cs-muted ml-auto">{ep.runtimeMinutes}m</span>
                        ) : null}
                      </div>
                      <p className="font-heading uppercase text-sm leading-tight mb-1 truncate">
                        {ep.name ?? "Episode"}
                      </p>
                      {ep.synopsis ? (
                        <p className="text-xs text-cs-muted leading-snug line-clamp-2">{ep.synopsis}</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
