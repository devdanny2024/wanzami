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
import { hasRatedEndcard, markRatedEndcard } from "@/lib/endCardCache";

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
}: CustomMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedStart = useRef(false);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);
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

  const buildSourcesFromEpisode = useCallback((ep?: Episode | null): MediaSource[] => {
    if (!ep?.assetVersions?.length) return [];
    const rank: Record<string, number> = { R4K: 5, R2K: 4, R1080: 3, R720: 2, R360: 1 };
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
        type: "video/mp4",
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

  const shouldAutoplay = useMemo(
    () =>
      Boolean(
        (activeSources?.length ?? 0) > 0 ||
          episodes?.some((ep) => ep.streamUrl)
      ),
    [activeSources?.length, episodes]
  );
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
  const hasSentStart = useRef(false);
  const unmounted = useRef(false);
  const endCardShownRef = useRef(false);
  const [showEndCard, setShowEndCard] = useState(false);
  const [endCardSentiment, setEndCardSentiment] = useState<"UP" | "DOWN" | null>(null);
  const [endCardLoading, setEndCardLoading] = useState(false);
  const [endCardError, setEndCardError] = useState<string | null>(null);
  const [endCardRecs, setEndCardRecs] = useState<
    { id: string; backendId?: string; title: string; image: string }[]
  >([]);

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
      const completionPercent = dur > 0 ? Math.max(0, Math.min(1, time / dur)) : 0;
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
    [accessToken, currentEpisode?.id, currentSrc?.label, deviceId, duration, profileId, titleId]
  );

  const hasPrev = currentEpisode
    ? normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) > 0
    : false;
  const hasNext = currentEpisode
    ? normalizedEpisodes.findIndex((e) => e.id === currentEpisode.id) < normalizedEpisodes.length - 1
    : false;

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
    if (!video || !currentSrc?.src) return;
    video.src = currentEpisode?.streamUrl || currentSrc.src;
    video.load();
    if (shouldAutoplay) {
      void video.play().catch(() => undefined);
    }
  }, [currentSrc?.src, currentEpisode?.streamUrl, shouldAutoplay]);

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
      sendPlayStart("playing");
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
  }, [emitEvent, hasNext, startTimeSeconds, currentSrc, activeSources, sendPlayStart, maybeShowEndCard]);

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
      sendPlayStart("play");
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black group overflow-visible"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={() => setIsHovering(true)}
    >
      <video
        ref={videoRef}
        src={currentEpisode?.streamUrl || currentSrc?.src}
        poster={poster ?? undefined}
        className={`absolute inset-0 w-full h-full object-contain bg-black ${isBuffering ? "blur-sm" : ""}`}
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 14 }}>
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

        <div className="mb-3 md:mb-4 relative">
          {previewTime !== null && duration > 0 && (
            <div
              className="absolute bg-black/90 text-white text-xs rounded-lg shadow-lg overflow-hidden border border-white/10 pointer-events-none"
              style={{ left: `${previewPos}%`, top: "-130px", transform: "translateX(-50%)", zIndex: 25 }}
            >
              <div className="w-40 h-24 bg-black flex items-center justify-center">
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
              <div className="px-2 py-1 text-center border-t border-white/10">{formatTime(previewTime)}</div>
            </div>
          )}
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
            {activeSources.length > 0 ? (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu((v) => !v)}
                  className="text-white hover:scale-110 transition-transform"
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
            <button onClick={toggleFullscreen} className="text-white hover:scale-110 transition-transform">
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
          </div>
        </div>
      )}

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
