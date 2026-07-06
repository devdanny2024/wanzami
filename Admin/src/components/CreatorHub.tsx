import { useEffect, useRef, useState } from "react";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { CsBox, CsButton, CsPageHeader, CsSlug, CsTag } from "./cs/kit";

type ReplayStatus = "NONE" | "PENDING_INFRA" | "PROCESSING" | "READY" | "FAILED";

type ReplayDraft = {
  status: ReplayStatus;
  playbackUrl: string;
  note: string;
};

type ViewerDraft = {
  viewerCount: string;
};

type LiveSource = {
  id: string;
  eventId?: string;
  type: "CAMERA" | "SCREEN" | "RTMP" | "CONTROL_DECK";
  label: string;
  status: "READY" | "DEGRADED" | "OFFLINE" | "ERROR";
  playbackUrl?: string | null;
  previewUrl?: string | null;
  metadata?: Record<string, any> | null;
  isActiveOutput: boolean;
};

type LiveEvent = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  category?: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  isPublished?: boolean;
  visibility?: "PUBLIC" | "UNLISTED" | "PRIVATE";
  ingestEndpoint?: string | null;
  playbackUrl?: string | null;
  streamKey?: string | null;
  scheduledStartAt?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  viewerCount?: number;
  activeSourceId?: string | null;
  activeSource?: LiveSource | null;
  sources?: LiveSource[];
  replay?: {
    status?: ReplayStatus;
    playbackUrl?: string | null;
    readyAt?: string | null;
    note?: string | null;
  };
};

type BrowserLiveSession = {
  stream: MediaStream;
  client: any;
  sourceId?: string;
};

declare global {
  interface Window {
    IVSBroadcastClient?: {
      create: (config: { streamConfig: { maxResolution: { width: number; height: number }; maxFramerate: number; maxBitrate: number } }) => any;
      BASIC_LANDSCAPE: { maxResolution: { width: number; height: number }; maxFramerate: number; maxBitrate: number };
    };
  }
}


const liveStateBadge = (event: LiveEvent): { label: string; tone: "good" | "bad" | "pending" | "neutral" } => {
  if (event.status === "LIVE") {
    return { label: "Live", tone: "good" };
  }
  if (event.status === "ENDED") {
    return { label: "Ended", tone: "neutral" };
  }
  if (event.isPublished) {
    return { label: "Published", tone: "good" };
  }
  return { label: "Draft", tone: "pending" };
};

const replayStatuses: ReplayStatus[] = ["NONE", "PENDING_INFRA", "PROCESSING", "READY", "FAILED"];

const pickPlayablePlaybackUrl = (event?: LiveEvent | null): string => {
  if (!event) return "";
  const activeSourceUrl = event.sources?.find((source) => source.isActiveOutput)?.playbackUrl?.trim();
  if (activeSourceUrl) return activeSourceUrl;
  const eventUrl = event.playbackUrl?.trim();
  if (eventUrl) return eventUrl;
  const fallbackSourceUrl = event.sources?.find((source) => source.playbackUrl?.trim())?.playbackUrl?.trim();
  return fallbackSourceUrl ?? "";
};

const replayBadge = (status?: ReplayStatus): "good" | "bad" | "pending" | "neutral" => {
  switch (status) {
    case "READY":
      return "good";
    case "PROCESSING":
      return "pending";
    case "PENDING_INFRA":
      return "pending";
    case "FAILED":
      return "bad";
    default:
      return "neutral";
  }
};

const LIVE_DIRECT_API_BASE =
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE ??
  "https://api.blvckcode.io/api";

function toDirectApiUrl(path: string) {
  const normalized = path.startsWith("/api") ? path.slice(4) : path;
  return `${LIVE_DIRECT_API_BASE}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}

async function adminApiFetch(path: string, init?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const headers = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const attempt = async (target: string) => {
    const res = await fetch(target, {
      ...init,
      headers,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  };

  try {
    const primary = await attempt(path);
    if (primary.ok) return primary;

    const shouldFallbackDirect =
      path.startsWith("/api/admin/live") && [502, 503, 504].includes(primary.status);
    if (!shouldFallbackDirect) return primary;

    return attempt(toDirectApiUrl(path));
  } catch (error: any) {
    if (path.startsWith("/api/admin/live")) {
      return attempt(toDirectApiUrl(path));
    }
    return {
      ok: false,
      status: 502,
      data: { message: "Request failed", error: error?.message || "fetch failed" },
    };
  }
}

function LivePlaybackPlayer({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const cleanup = () => {
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy?.();
        } catch {
          // ignore
        }
        hlsRef.current = null;
      }
    };

    cleanup();

    if (!src) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      return cleanup;
    }

    const isHls = src.toLowerCase().includes(".m3u8");

    // Safari can play HLS natively; Chromium needs hls.js.
    if (isHls && typeof window !== "undefined") {
      const canNativePlay = video.canPlayType("application/vnd.apple.mpegurl") !== "";
      if (canNativePlay) {
        video.src = src;
        void video.play().catch(() => undefined);
        return cleanup;
      }

      let cancelled = false;
      (async () => {
        const mod = await import("hls.js");
        if (cancelled) return;
        const Hls = (mod as any).default;
        if (!Hls?.isSupported?.()) {
          video.src = src;
          return;
        }
        const hls = new Hls({ lowLatencyMode: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          void video.play().catch(() => undefined);
        });
        hlsRef.current = hls;
      })().catch(() => {
        video.src = src;
      });

      return () => {
        cancelled = true;
        cleanup();
      };
    }

    video.src = src;
    void video.play().catch(() => undefined);
    return cleanup;
  }, [src]);

  return (
    <div
      className="overflow-hidden cs-border"
      style={{ background: "#000", aspectRatio: "16 / 9" }}
    >
      <video
        ref={videoRef}
        className="h-full w-full"
        style={{ objectFit: "contain" }}
        controls
        playsInline
        preload="metadata"
        muted
        autoPlay
        crossOrigin="anonymous"
        aria-label={title}
      />
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  border: "2px solid var(--cs-ink)",
  background: "var(--cs-paper)",
  color: "var(--cs-ink)",
  fontFamily: "var(--font-smono), monospace",
  fontSize: 12,
  padding: "9px 12px",
  width: "100%",
};

const selectStyle: React.CSSProperties = {
  border: "2px solid var(--cs-ink)",
  background: "var(--cs-paper)",
  color: "var(--cs-ink)",
  fontFamily: "var(--font-smono), monospace",
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  padding: "8px 10px",
};

const labelSlugStyle: React.CSSProperties = {
  fontFamily: "var(--font-smono), monospace",
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  color: "var(--cs-muted)",
};

export function CreatorHub() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [scheduledStartAt, setScheduledStartAt] = useState("");
  const [replayDrafts, setReplayDrafts] = useState<Record<string, ReplayDraft>>({});
  const [replaySavingId, setReplaySavingId] = useState<string | null>(null);
  const [viewerDrafts, setViewerDrafts] = useState<Record<string, ViewerDraft>>({});
  const [viewerSavingId, setViewerSavingId] = useState<string | null>(null);
  const [sourceDrafts, setSourceDrafts] = useState<
    Record<string, { label: string; type: LiveSource["type"]; playbackUrl: string; previewUrl: string }>
  >({});
  const [sourceBusyId, setSourceBusyId] = useState<string | null>(null);
  const [cameraGoLiveEvent, setCameraGoLiveEvent] = useState<LiveEvent | null>(null);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<LiveEvent | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraMuted, setCameraMuted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [cameraWizardStep, setCameraWizardStep] = useState<0 | 1 | 2>(0);
  const [privacy, setPrivacy] = useState<"public" | "unlisted" | "private">("public");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>("");

  const previewRef = useRef<HTMLVideoElement | null>(null);
  const browserLiveRef = useRef<BrowserLiveSession | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApiFetch("/api/admin/live/events");
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to load live events");
      const nextEvents = (((res.data as any)?.events ?? []) as LiveEvent[]);
      setEvents(nextEvents);
      setReplayDrafts(() => {
        const next: Record<string, ReplayDraft> = {};
        for (const event of nextEvents) {
          next[event.id] = {
            status: event.replay?.status ?? "NONE",
            playbackUrl: event.replay?.playbackUrl ?? "",
            note: event.replay?.note ?? "",
          };
        }
        return next;
      });
      setViewerDrafts(() => {
        const next: Record<string, ViewerDraft> = {};
        for (const event of nextEvents) {
          next[event.id] = {
            viewerCount: String(event.viewerCount ?? 0),
          };
        }
        return next;
      });
      setSourceDrafts(() => {
        const next: Record<string, { label: string; type: LiveSource["type"]; playbackUrl: string; previewUrl: string }> = {};
        for (const event of nextEvents) {
          next[event.id] = {
            label: "",
            type: "CAMERA",
            playbackUrl: "",
            previewUrl: "",
          };
        }
        return next;
      });
    } catch (err: any) {
      setError(err?.message ?? "Failed to load live events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  useEffect(() => {
    return () => {
      cleanupBrowserLive();
    };
  }, []);

  const uploadThumbnailAsset = async (file: File): Promise<string> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const presignRes = await fetch("/api/admin/assets/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ contentType: file.type || "application/octet-stream", kind: "thumbnail" }),
    });

    const presignData = await presignRes.json().catch(() => ({}));
    if (!presignRes.ok || !presignData.url || !presignData.key) {
      throw new Error(presignData?.message || "Failed to prepare thumbnail upload");
    }

    const putRes = await fetch(presignData.url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!putRes.ok) {
      throw new Error("Thumbnail upload failed");
    }

    return (presignData.publicUrl as string) || (presignData.key as string);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      setSaving(true);
      setError(null);
      const normalizedScheduledStart = (() => {
        if (!scheduledStartAt) return undefined;
        const parsed = new Date(scheduledStartAt);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
      })();

      if (normalizedScheduledStart === null) {
        throw new Error("Scheduled start time is invalid");
      }

      let resolvedThumbnailUrl = thumbnailUrl.trim() || undefined;
      if (thumbnailFile) {
        resolvedThumbnailUrl = await uploadThumbnailAsset(thumbnailFile);
      } else if (resolvedThumbnailUrl) {
        try {
          new URL(resolvedThumbnailUrl);
        } catch {
          throw new Error("Thumbnail URL must be a valid URL, or upload a thumbnail file instead.");
        }
      }

      const res = await adminApiFetch("/api/admin/live/events", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          thumbnailUrl: resolvedThumbnailUrl,
          category: category.trim() || undefined,
          scheduledStartAt: normalizedScheduledStart,
        }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to create event");
      setTitle("");
      setDescription("");
      setThumbnailUrl("");
      setThumbnailFile(null);
      setCategory("");
      setScheduledStartAt("");
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, action: "start" | "end", sourceId?: string) => {
    const previousEvents = events;
    if (action === "end") {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === id
            ? {
                ...event,
                status: "ENDED",
                endedAt: new Date().toISOString(),
              }
            : event
        )
      );
    }

    try {
      setError(null);
      let res = await adminApiFetch(`/api/admin/live/events/${id}/${action}`, {
        method: "POST",
        body: action === "start" && sourceId ? JSON.stringify({ sourceId }) : undefined,
      });

      if (!res.ok && action === "start" && (res.data as any)?.code === "LIVE_PLAYBACK_UNAVAILABLE") {
        const shouldForceStart =
          typeof window !== "undefined" &&
          window.confirm("Playback URL is not reachable yet. Start live anyway with force start?");

        if (shouldForceStart) {
          res = await adminApiFetch(`/api/admin/live/events/${id}/${action}`, {
            method: "POST",
            body: JSON.stringify({ ...(sourceId ? { sourceId } : {}), forceStart: true }),
          });
        }
      }

      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to update event");
      if ((res.data as any)?.event) {
        const nextEvent = (res.data as any).event as LiveEvent;
        setEvents((prev) => prev.map((event) => (event.id === id ? nextEvent : event)));
      }
      await loadEvents();
    } catch (err: any) {
      setEvents(previousEvents);
      setError(err?.message ?? "Failed to update event");
    }
  };

  const togglePublish = async (event: LiveEvent) => {
    const targetPublished = !Boolean(event.isPublished);
    const previousEvents = events;

    setEvents((prev) =>
      prev.map((item) => (item.id === event.id ? { ...item, isPublished: targetPublished } : item))
    );

    try {
      setError(null);
      const res = await adminApiFetch(`/api/admin/live/events/${event.id}/publish`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: targetPublished }),
      });
      if (!res.ok) {
        const backendMessage = (res.data as any)?.message;
        const backendCode = (res.data as any)?.code;
        throw new Error(
          backendCode && backendMessage
            ? `${backendMessage} (${backendCode})`
            : backendMessage || "Failed to update publish status"
        );
      }
      if ((res.data as any)?.event) {
        const nextEvent = (res.data as any).event as LiveEvent;
        setEvents((prev) => prev.map((item) => (item.id === event.id ? nextEvent : item)));
      }
    } catch (err: any) {
      setEvents(previousEvents);
      setError(err?.message ?? "Failed to update publish status");
    }
  };

  const deleteEvent = async (event: LiveEvent) => {
    const previousEvents = events;
    setDeletingEventId(event.id);
    setDeleteTargetEvent(null);
    setEvents((prev) => prev.filter((item) => item.id !== event.id));

    try {
      setError(null);
      const res = await adminApiFetch(`/api/admin/live/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error((res.data as any)?.message || "Failed to delete live event");
      }
      toast.success((res.data as any)?.message || `Deleted "${event.title}"`);
    } catch (err: any) {
      setEvents(previousEvents);
      const message = err?.message ?? "Failed to delete live event";
      setError(message);
      toast.error(message);
    } finally {
      setDeletingEventId(null);
    }
  };

  const updateSourceDraft = (
    eventId: string,
    patch: Partial<{ label: string; type: LiveSource["type"]; playbackUrl: string; previewUrl: string }>
  ) => {
    setSourceDrafts((prev) => ({
      ...prev,
      [eventId]: {
        label: prev[eventId]?.label ?? "",
        type: prev[eventId]?.type ?? "CAMERA",
        playbackUrl: prev[eventId]?.playbackUrl ?? "",
        previewUrl: prev[eventId]?.previewUrl ?? "",
        ...patch,
      },
    }));
  };

  const addSource = async (event: LiveEvent) => {
    const eventId = event.id;
    const draft = sourceDrafts[eventId] ?? { label: "", type: "CAMERA" as LiveSource["type"], playbackUrl: "", previewUrl: "" };
    const label = draft.label.trim() || `${draft.type} Source ${(event.sources?.length ?? 0) + 1}`;
    try {
      setError(null);
      setSourceBusyId(eventId);
      const res = await adminApiFetch(`/api/admin/live/events/${eventId}/sources`, {
        method: "POST",
        body: JSON.stringify({
          type: draft.type,
          label,
          playbackUrl: draft.playbackUrl.trim() || undefined,
          previewUrl: draft.previewUrl.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to add source");
      updateSourceDraft(eventId, { label: "", playbackUrl: "", previewUrl: "" });
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Failed to add source");
    } finally {
      setSourceBusyId(null);
    }
  };

  const deleteSource = async (eventId: string, sourceId: string) => {
    try {
      setError(null);
      setSourceBusyId(eventId);
      const res = await adminApiFetch(`/api/admin/live/events/${eventId}/sources/${sourceId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to remove source");
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Failed to remove source");
    } finally {
      setSourceBusyId(null);
    }
  };

  const switchSourceLive = async (eventId: string, sourceId: string) => {
    try {
      setError(null);
      setSourceBusyId(eventId);
      const res = await adminApiFetch(`/api/admin/live/events/${eventId}/sources/switch`, {
        method: "POST",
        body: JSON.stringify({ sourceId }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to switch source");
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Failed to switch source");
    } finally {
      setSourceBusyId(null);
    }
  };

  const updateReplayDraft = (eventId: string, patch: Partial<ReplayDraft>) => {
    setReplayDrafts((prev) => ({
      ...prev,
      [eventId]: {
        status: prev[eventId]?.status ?? "NONE",
        playbackUrl: prev[eventId]?.playbackUrl ?? "",
        note: prev[eventId]?.note ?? "",
        ...patch,
      },
    }));
  };

  const saveReplay = async (event: LiveEvent) => {
    const draft = replayDrafts[event.id] ?? {
      status: event.replay?.status ?? "NONE",
      playbackUrl: event.replay?.playbackUrl ?? "",
      note: event.replay?.note ?? "",
    };

    const playbackUrl = draft.playbackUrl.trim();
    const note = draft.note.trim();

    if (draft.status === "READY" && !playbackUrl) {
      setError("Replay playback URL is required when status is READY");
      return;
    }

    try {
      setError(null);
      setReplaySavingId(event.id);
      const res = await adminApiFetch(`/api/admin/live/events/${event.id}/replay`, {
        method: "PATCH",
        body: JSON.stringify({
          status: draft.status,
          playbackUrl: playbackUrl || undefined,
          note: note || undefined,
        }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to update replay metadata");
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update replay metadata");
    } finally {
      setReplaySavingId(null);
    }
  };

  const updateViewerDraft = (eventId: string, viewerCount: string) => {
    setViewerDrafts((prev) => ({
      ...prev,
      [eventId]: {
        viewerCount,
      },
    }));
  };

  const bumpViewerDraft = (event: LiveEvent, delta: number) => {
    const rawValue = viewerDrafts[event.id]?.viewerCount ?? String(event.viewerCount ?? 0);
    const parsed = Number(rawValue);
    const currentValue = Number.isFinite(parsed) ? parsed : event.viewerCount ?? 0;
    const nextValue = Math.max(0, Math.round(currentValue + delta));
    updateViewerDraft(event.id, String(nextValue));
  };

  const saveViewerCount = async (event: LiveEvent) => {
    const rawValue = (viewerDrafts[event.id]?.viewerCount ?? String(event.viewerCount ?? 0)).trim();
    if (!rawValue) {
      setError("Viewer count is required");
      return;
    }

    const viewerCount = Number(rawValue);
    if (!Number.isInteger(viewerCount) || viewerCount < 0) {
      setError("Viewer count must be a non-negative whole number");
      return;
    }

    try {
      setError(null);
      setViewerSavingId(event.id);
      const res = await adminApiFetch(`/api/admin/live/events/${event.id}/viewers`, {
        method: "PATCH",
        body: JSON.stringify({ viewerCount }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to update viewer count");
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update viewer count");
    } finally {
      setViewerSavingId(null);
    }
  };

  const copyText = async (value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
  };

  const ensureBroadcastSdk = async () => {
    if (typeof window === "undefined") throw new Error("Browser environment required");
    if (window.IVSBroadcastClient) return window.IVSBroadcastClient;

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-ivs-broadcast="1"]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load IVS broadcast SDK")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://web-broadcast.live-video.net/1.29.0/amazon-ivs-web-broadcast.js";
      script.async = true;
      script.dataset.ivsBroadcast = "1";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load IVS broadcast SDK"));
      document.head.appendChild(script);
    });

    if (!window.IVSBroadcastClient) throw new Error("IVS broadcast SDK unavailable after loading");
    return window.IVSBroadcastClient;
  };

  const cleanupBrowserLive = () => {
    const session = browserLiveRef.current;
    if (session?.client) {
      try {
        session.client.stopBroadcast?.();
      } catch {
        // ignore
      }
    }
    session?.stream?.getTracks().forEach((track) => track.stop());
    browserLiveRef.current = null;
    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }
    setCameraMuted(false);
  };

  const loadMediaDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices();
    const nextVideo = devices.filter((d) => d.kind === "videoinput");
    const nextAudio = devices.filter((d) => d.kind === "audioinput");
    setVideoDevices(nextVideo);
    setAudioDevices(nextAudio);
    if (!selectedVideoDeviceId && nextVideo[0]?.deviceId) setSelectedVideoDeviceId(nextVideo[0].deviceId);
    if (!selectedAudioDeviceId && nextAudio[0]?.deviceId) setSelectedAudioDeviceId(nextAudio[0].deviceId);
  };

  const startPreviewStream = async (opts?: { videoDeviceId?: string; audioDeviceId?: string }) => {
    const videoDeviceId = opts?.videoDeviceId ?? selectedVideoDeviceId;
    const audioDeviceId = opts?.audioDeviceId ?? selectedAudioDeviceId;

    cleanupBrowserLive();

    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoDeviceId
        ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
    });

    browserLiveRef.current = { stream, client: null };

    setTimeout(() => {
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        previewRef.current.muted = true;
        void previewRef.current.play().catch(() => undefined);
      }
    }, 0);

    return stream;
  };

  const openCameraGoLive = async (event: LiveEvent) => {
    try {
      setCameraError(null);
      setCameraBusy(true);
      setCameraWizardStep(0);

      const nextPrivacy: "public" | "unlisted" | "private" =
        event.visibility === "PRIVATE" ? "private" : event.visibility === "UNLISTED" ? "unlisted" : "public";
      setPrivacy(nextPrivacy);

      if (event.scheduledStartAt) {
        const d = new Date(event.scheduledStartAt);
        if (!Number.isNaN(d.getTime())) {
          const pad = (n: number) => String(n).padStart(2, "0");
          setScheduleEnabled(true);
          setScheduleDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
          setScheduleTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
        } else {
          setScheduleEnabled(false);
          setScheduleDate("");
          setScheduleTime("");
        }
      } else {
        setScheduleEnabled(false);
        setScheduleDate("");
        setScheduleTime("");
      }

      // Request permissions + start preview, then enumerate device labels.
      await startPreviewStream();
      await loadMediaDevices();

      setCameraGoLiveEvent(event);
    } catch (err: any) {
      setCameraError(err?.message ?? "Unable to access camera/microphone.");
    } finally {
      setCameraBusy(false);
    }
  };

  const saveGoLiveSetup = async () => {
    if (!cameraGoLiveEvent) return;

    const visibility: LiveEvent["visibility"] =
      privacy === "private" ? "PRIVATE" : privacy === "unlisted" ? "UNLISTED" : "PUBLIC";

    const scheduledIso = scheduleEnabled ? (() => {
      if (!scheduleDate || !scheduleTime) return null;
      const [y, m, d] = scheduleDate.split("-").map((v) => Number(v));
      const [hh, mm] = scheduleTime.split(":").map((v) => Number(v));
      if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
      const local = new Date(y, m - 1, d, hh, mm, 0, 0);
      if (Number.isNaN(local.getTime())) return null;
      return local.toISOString();
    })() : null;

    setCameraBusy(true);
    try {
      const res = await adminApiFetch(`/api/admin/live/events/${cameraGoLiveEvent.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          visibility,
          scheduledStartAt: scheduledIso,
        }),
      });
      if (!res.ok) {
        throw new Error((res.data as any)?.message || "Failed to save go-live setup");
      }
      const nextEvent = (res.data as any)?.event as LiveEvent | undefined;
      if (nextEvent) {
        setCameraGoLiveEvent(nextEvent);
        setEvents((prev) => prev.map((e) => (e.id === nextEvent.id ? nextEvent : e)));
      }
    } finally {
      setCameraBusy(false);
    }
  };

  const startCameraBroadcast = async () => {
    if (!cameraGoLiveEvent) return;
    // Publishing is attempted automatically before start if needed.
    if (!cameraGoLiveEvent.ingestEndpoint || !cameraGoLiveEvent.streamKey) {
      setCameraError("Ingest endpoint or stream key is missing for this event.");
      return;
    }

    const stream = browserLiveRef.current?.stream;
    if (!stream) {
      setCameraError("Camera preview is not ready.");
      return;
    }

    try {
      setCameraError(null);
      setCameraBusy(true);

      // Ensure event visibility matches the wizard choice before publishing/starting.
      if (privacy !== "private") {
        const desiredVisibility = privacy === "unlisted" ? "UNLISTED" : "PUBLIC";
        try {
          await adminApiFetch(`/api/admin/live/events/${cameraGoLiveEvent.id}`, {
            method: "PATCH",
            body: JSON.stringify({ visibility: desiredVisibility }),
          });
        } catch {
          // best-effort; publishing step below will still run
        }
      }

      const sdk = await ensureBroadcastSdk();
      const client = sdk.create({ streamConfig: sdk.BASIC_LANDSCAPE });

      // IVS Web Broadcast expects a MediaStream (not a single MediaStreamTrack).
      // Passing a track causes runtime errors like: getVideoTracks/getAudioTracks is not a function.
      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;
      if (hasVideo) client.addVideoInputDevice(stream, "camera", { index: 0 });
      if (hasAudio) client.addAudioInputDevice(stream, "mic");

      await client.startBroadcast(cameraGoLiveEvent.streamKey, cameraGoLiveEvent.ingestEndpoint);

      const latestEventRes = await adminApiFetch(`/api/admin/live/events/${cameraGoLiveEvent.id}`);
      const latestEvent = latestEventRes.ok ? ((latestEventRes.data as any)?.event as LiveEvent | undefined) : cameraGoLiveEvent;
      const playbackUrlForPublish = pickPlayablePlaybackUrl(latestEvent);

      let sourceId: string | undefined;
      const existingSource = (latestEvent?.sources ?? []).find((source) => source.label === "Browser Camera" && source.type === "CAMERA");
      if (existingSource) {
        sourceId = existingSource.id;
        const updateSourceRes = await adminApiFetch(`/api/admin/live/events/${cameraGoLiveEvent.id}/sources/${existingSource.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "READY",
            playbackUrl: playbackUrlForPublish || undefined,
            isActiveOutput: true,
          }),
        });
        if (!updateSourceRes.ok) {
          throw new Error((updateSourceRes.data as any)?.message || "Failed to prepare Browser Camera source");
        }
      } else {
        const createdSourceRes = await adminApiFetch(`/api/admin/live/events/${cameraGoLiveEvent.id}/sources`, {
          method: "POST",
          body: JSON.stringify({
            type: "CAMERA",
            label: "Browser Camera",
            status: "READY",
            playbackUrl: playbackUrlForPublish || undefined,
            isActiveOutput: true,
          }),
        });
        if (!createdSourceRes.ok) {
          throw new Error((createdSourceRes.data as any)?.message || "Failed to create Browser Camera source");
        }
        sourceId = (createdSourceRes.data as any)?.source?.id;
      }

      if (!latestEvent?.isPublished) {
        const publishRes = await adminApiFetch(`/api/admin/live/events/${cameraGoLiveEvent.id}/publish`, {
          method: "PATCH",
          body: JSON.stringify({ isPublished: true }),
        });
        if (!publishRes.ok) {
          throw new Error((publishRes.data as any)?.message || "Failed to publish event before going live");
        }
      }

      browserLiveRef.current = { stream, client, sourceId };
      await updateStatus(cameraGoLiveEvent.id, "start", sourceId);
    } catch (err: any) {
      setCameraError(err?.message ?? "Failed to start browser camera live stream.");
    } finally {
      setCameraBusy(false);
    }
  };

  const toggleCameraMute = () => {
    const stream = browserLiveRef.current?.stream;
    if (!stream) return;
    const nextMuted = !cameraMuted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    setCameraMuted(nextMuted);
  };

  const stopCameraBroadcast = async () => {
    const targetEvent = cameraGoLiveEvent;
    try {
      setCameraBusy(true);
      if (targetEvent?.status === "LIVE") {
        await updateStatus(targetEvent.id, "end");
      }
    } finally {
      cleanupBrowserLive();
      setCameraGoLiveEvent(null);
      setCameraBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="Creator Hub"
        chip={loading ? "···" : `${events.length} events`}
        slug="Create, schedule, go-live, and end live streams"
        actions={
          <CsButton variant="outline" onClick={loadEvents}>
            Refresh
          </CsButton>
        }
      />

      {error && (
        <div className="cs-border p-4" style={{ borderColor: "var(--cs-rust)" }}>
          <p className="cs-mono text-xs font-bold uppercase" style={{ color: "var(--cs-rust)" }}>
            {error}
          </p>
        </div>
      )}

      <CsBox className="p-5">
        <CsSlug>Create / schedule live event</CsSlug>
        <div className="mt-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Live event title"
            style={fieldStyle}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            style={fieldStyle}
            rows={3}
          />
          <input
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Thumbnail URL (optional if file uploaded)"
            style={fieldStyle}
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g., Sports, News, Entertainment)"
            style={fieldStyle}
          />
          <div className="space-y-1">
            <label style={labelSlugStyle}>Or upload thumbnail file</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
              style={fieldStyle}
            />
            {thumbnailFile && (
              <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                Selected: {thumbnailFile.name}
              </p>
            )}
          </div>
          <div>
            <label style={labelSlugStyle}>Scheduled start (optional)</label>
            <input
              type="datetime-local"
              value={scheduledStartAt}
              onChange={(e) => setScheduledStartAt(e.target.value)}
              style={{ ...fieldStyle, marginTop: 4 }}
            />
          </div>
          <CsButton variant="rust" onClick={handleCreate} disabled={saving || !title.trim()}>
            {saving ? "Creating..." : "Create Event"}
          </CsButton>
        </div>
      </CsBox>

      <CsBox className="p-5">
        <CsSlug>Live events</CsSlug>
        <div className="mt-4">
          {loading ? (
            <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>Loading...</p>
          ) : events.length === 0 ? (
            <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>No live events yet.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const ingestUrl = event.ingestEndpoint ? `rtmps://${event.ingestEndpoint}:443/app/` : "";
                const stateBadge = liveStateBadge(event);
                return (
                  <div key={event.id} className="cs-border p-4 space-y-3" style={{ background: "var(--cs-panel)" }}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="cs-display" style={{ fontSize: 22, color: "var(--cs-ink)" }}>{event.title}</p>
                        <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                          Created {event.createdAt ? new Date(event.createdAt).toLocaleString() : "Unknown"}
                        </p>
                        {event.scheduledStartAt && (
                          <p className="cs-mono mt-1" style={{ fontSize: 11, color: "var(--cs-ink)" }}>
                            Scheduled: {new Date(event.scheduledStartAt).toLocaleString()}
                          </p>
                        )}
                        {event.startedAt && (
                          <p className="cs-mono mt-1" style={{ fontSize: 11, color: "var(--cs-ink)" }}>
                            Started: {new Date(event.startedAt).toLocaleString()}
                          </p>
                        )}
                        {event.endedAt && (
                          <p className="cs-mono mt-1" style={{ fontSize: 11, color: "var(--cs-muted)" }}>
                            Ended: {new Date(event.endedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <CsTag label={stateBadge.label} tone={stateBadge.tone} />
                        <CsTag label={`Replay: ${event.replay?.status ?? "NONE"}`} tone={replayBadge(event.replay?.status)} />
                      </div>
                    </div>

                    {event.description && <p className="text-sm" style={{ color: "var(--cs-ink)" }}>{event.description}</p>}

                    <div className="grid gap-2 text-xs" style={{ color: "var(--cs-muted)" }}>
                      {/* RTMPS details moved into Advanced */}
                      {/* Stream key hidden from default simple flow */}
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--cs-muted)" }}>Playback URL:</span>
                        <span className="truncate" style={{ color: "var(--cs-ink)" }}>{event.playbackUrl || "Not available"}</span>
                        {event.playbackUrl && (
                          <button onClick={() => copyText(event.playbackUrl)} className="cs-mono font-bold uppercase" style={{ color: "var(--cs-rust)", fontSize: 10 }}>Copy</button>
                        )}
                      </div>

                      {event.status === "LIVE" && pickPlayablePlaybackUrl(event) ? (
                        <div className="mt-2">
                          <p className="mb-2" style={labelSlugStyle}>Live Preview (Admin)</p>
                          <LivePlaybackPlayer src={pickPlayablePlaybackUrl(event)} title={event.title} />
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--cs-muted)" }}>Replay URL:</span>
                        <span className="truncate" style={{ color: "var(--cs-ink)" }}>{event.replay?.playbackUrl || "Not available"}</span>
                        {event.replay?.playbackUrl && (
                          <button onClick={() => copyText(event.replay?.playbackUrl)} className="cs-mono font-bold uppercase" style={{ color: "var(--cs-rust)", fontSize: 10 }}>Copy</button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: "var(--cs-muted)" }}>Current Viewers:</span>
                        <span style={{ color: "var(--cs-ink)" }}>{event.viewerCount ?? 0}</span>
                      </div>
                      {event.replay?.note && <p className="text-xs" style={{ color: "var(--cs-rust)" }}>{event.replay.note}</p>}
                    </div>

                    <div className="cs-border-thin p-3 space-y-3" style={{ background: "var(--cs-paper)" }}>
                      <p style={labelSlugStyle}>Viewer Controls</p>
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-1">
                          <label style={labelSlugStyle}>Manual viewer count</label>
                          <input
                            type="number"
                            min={0}
                            value={viewerDrafts[event.id]?.viewerCount ?? String(event.viewerCount ?? 0)}
                            onChange={(e) => updateViewerDraft(event.id, e.target.value)}
                            disabled={event.status !== "LIVE"}
                            style={{ ...fieldStyle, width: 192 }}
                            className="disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <CsButton
                            variant="outline"
                            onClick={() => bumpViewerDraft(event, -10)}
                            disabled={event.status !== "LIVE"}
                          >
                            -10
                          </CsButton>
                          <CsButton
                            variant="outline"
                            onClick={() => bumpViewerDraft(event, 10)}
                            disabled={event.status !== "LIVE"}
                          >
                            +10
                          </CsButton>
                          <CsButton
                            variant="outline"
                            onClick={() => bumpViewerDraft(event, 100)}
                            disabled={event.status !== "LIVE"}
                          >
                            +100
                          </CsButton>
                        </div>
                        <CsButton
                          variant="ink"
                          onClick={() => saveViewerCount(event)}
                          disabled={viewerSavingId === event.id || event.status !== "LIVE"}
                        >
                          {viewerSavingId === event.id ? "Saving viewers..." : "Save Viewers"}
                        </CsButton>
                      </div>
                      {event.status !== "LIVE" && (
                        <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>Viewer count can only be edited while this event is live.</p>
                      )}
                    </div>

                    <div className="cs-border-thin p-3 space-y-3" style={{ background: "var(--cs-paper)" }}>
                      <p style={labelSlugStyle}>Replay Controls</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                          <label style={labelSlugStyle}>Status</label>
                          <select
                            value={(replayDrafts[event.id]?.status ?? event.replay?.status ?? "NONE") as ReplayStatus}
                            onChange={(e) => updateReplayDraft(event.id, { status: e.target.value as ReplayStatus })}
                            style={{ ...selectStyle, width: "100%" }}
                          >
                            {replayStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label style={labelSlugStyle}>Replay playback URL</label>
                          <input
                            value={replayDrafts[event.id]?.playbackUrl ?? event.replay?.playbackUrl ?? ""}
                            onChange={(e) => updateReplayDraft(event.id, { playbackUrl: e.target.value })}
                            placeholder="https://...m3u8"
                            style={fieldStyle}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label style={labelSlugStyle}>Replay note</label>
                        <textarea
                          rows={2}
                          value={replayDrafts[event.id]?.note ?? event.replay?.note ?? ""}
                          onChange={(e) => updateReplayDraft(event.id, { note: e.target.value })}
                          placeholder="Internal note about replay state"
                          style={fieldStyle}
                        />
                      </div>
                      <CsButton
                        variant="ink"
                        onClick={() => saveReplay(event)}
                        disabled={replaySavingId === event.id}
                      >
                        {replaySavingId === event.id ? "Saving replay..." : "Save Replay"}
                      </CsButton>
                    </div>

                    <details className="cs-border-thin p-3 space-y-3" style={{ background: "var(--cs-paper)" }}>
                      <summary className="cs-mono cursor-pointer font-bold uppercase" style={{ fontSize: 11, letterSpacing: "0.09em", color: "var(--cs-ink)" }}>Advanced</summary>
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-2 text-xs" style={{ color: "var(--cs-muted)" }}>
                          <div className="flex items-center gap-2">
                            <span style={{ color: "var(--cs-muted)" }}>RTMPS URL:</span>
                            <span className="truncate" style={{ color: "var(--cs-ink)" }}>{ingestUrl || "Not available"}</span>
                            {ingestUrl && <button onClick={() => copyText(ingestUrl)} className="cs-mono font-bold uppercase" style={{ color: "var(--cs-rust)", fontSize: 10 }}>Copy</button>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span style={{ color: "var(--cs-muted)" }}>Stream Key:</span>
                            <span className="truncate" style={{ color: "var(--cs-ink)" }}>{event.streamKey || "Hidden"}</span>
                            {event.streamKey && (
                              <button onClick={() => copyText(event.streamKey)} className="cs-mono font-bold uppercase" style={{ color: "var(--cs-rust)", fontSize: 10 }}>Copy</button>
                            )}
                          </div>
                        </div>
                        <p style={labelSlugStyle}>Source Deck</p>
                      <div className="grid gap-2 md:grid-cols-4">
                        <input
                          value={sourceDrafts[event.id]?.label ?? ""}
                          onChange={(e) => updateSourceDraft(event.id, { label: e.target.value })}
                          placeholder="Source label"
                          style={fieldStyle}
                        />
                        <select
                          value={sourceDrafts[event.id]?.type ?? "CAMERA"}
                          onChange={(e) => updateSourceDraft(event.id, { type: e.target.value as LiveSource["type"] })}
                          style={selectStyle}
                        >
                          <option value="CAMERA">Camera</option>
                          <option value="SCREEN">Screen</option>
                          <option value="RTMP">RTMP</option>
                          <option value="CONTROL_DECK">Control Deck</option>
                        </select>
                        <input
                          value={sourceDrafts[event.id]?.playbackUrl ?? ""}
                          onChange={(e) => updateSourceDraft(event.id, { playbackUrl: e.target.value })}
                          placeholder="Playback URL (optional)"
                          style={fieldStyle}
                        />
                        <CsButton
                          variant="ink"
                          onClick={() => addSource(event)}
                          disabled={sourceBusyId === event.id}
                        >
                          Add Source
                        </CsButton>
                      </div>

                      <div className="space-y-2">
                        {(event.sources ?? []).length === 0 ? (
                          <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>No sources configured. Legacy single-stream playback fallback remains active.</p>
                        ) : (
                          (event.sources ?? []).map((source) => (
                            <div key={source.id} className="flex items-center justify-between cs-border-thin px-3 py-2" style={{ background: "var(--cs-panel)" }}>
                              <div>
                                <p className="text-sm" style={{ color: "var(--cs-ink)" }}>
                                  {source.label} <span className="text-xs" style={{ color: "var(--cs-muted)" }}>({source.type})</span>
                                </p>
                                <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                                  {source.isActiveOutput ? "ACTIVE OUTPUT" : source.status}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {event.status === "LIVE" && !source.isActiveOutput && (
                                  <CsButton variant="outline" onClick={() => switchSourceLive(event.id, source.id)}>
                                    Take Live
                                  </CsButton>
                                )}
                                <CsButton
                                  variant="outline"
                                  onClick={() => deleteSource(event.id, source.id)}
                                  disabled={event.status === "LIVE" && source.isActiveOutput}
                                >
                                  Remove
                                </CsButton>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      </div>
                    </details>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.status === "SCHEDULED" && (
                        <CsButton
                          variant="rust"
                          onClick={() => void openCameraGoLive(event)}
                          disabled={cameraBusy}
                        >
                          Go Live with Camera
                        </CsButton>
                      )}
                      {event.status !== "ENDED" && (
                        <CsButton
                          variant="ink"
                          onClick={() => updateStatus(event.id, "end")}
                        >
                          End Live
                        </CsButton>
                      )}
                      <CsButton
                        variant="outline"
                        onClick={() => togglePublish(event)}
                      >
                        {event.isPublished ? "Unpublish" : "Publish"}
                      </CsButton>
                      <CsButton
                        variant="outline"
                        onClick={() => setDeleteTargetEvent(event)}
                        disabled={deletingEventId === event.id || event.status === "LIVE"}
                      >
                        {deletingEventId === event.id ? "Deleting..." : "Delete Event"}
                      </CsButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CsBox>

      {deleteTargetEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(22, 19, 16, 0.55)" }}
          onClick={() => setDeleteTargetEvent(null)}
        >
          <div
            className="cs-border cs-shadow w-full max-w-sm p-6"
            style={{ background: "var(--cs-paper)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <CsSlug>Delete live event?</CsSlug>
            <p className="mt-2 text-sm" style={{ color: "var(--cs-ink)" }}>
              This action is irreversible. Deleting this live event will permanently remove its metadata, source deck, and replay settings.
            </p>
            <div className="cs-border-thin mt-4 p-3" style={{ borderColor: "var(--cs-rust)", background: "var(--cs-panel)" }}>
              <p className="text-sm" style={{ color: "var(--cs-rust)" }}>
                You are about to delete <span className="font-bold">{deleteTargetEvent.title}</span>.
                This cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <CsButton variant="outline" onClick={() => setDeleteTargetEvent(null)}>
                Cancel
              </CsButton>
              <CsButton
                variant="rust"
                disabled={deletingEventId === deleteTargetEvent.id}
                onClick={() => void deleteEvent(deleteTargetEvent)}
              >
                {deletingEventId === deleteTargetEvent.id ? "Deleting..." : "Delete permanently"}
              </CsButton>
            </div>
          </div>
        </div>
      )}

      {cameraGoLiveEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(22, 19, 16, 0.55)" }}>
          <div className="cs-border cs-shadow w-full max-w-4xl p-4 md:p-6" style={{ background: "var(--cs-paper)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CsSlug>Camera wizard</CsSlug>
                <h3 className="cs-display mt-1" style={{ fontSize: 28, color: "var(--cs-ink)" }}>Create stream</h3>
                <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>Set up your camera, then choose visibility & scheduling.</p>
              </div>
              <CsButton
                variant="outline"
                onClick={() => {
                  cleanupBrowserLive();
                  setCameraGoLiveEvent(null);
                }}
                disabled={cameraBusy}
              >
                Close
              </CsButton>
            </div>

            <div className="mt-5 cs-border-thin p-4" style={{ background: "var(--cs-panel)" }}>
              <div className="flex items-center justify-between gap-3">
                {(
                  [
                    { id: 0 as const, label: "Details" },
                    { id: 1 as const, label: "Customization" },
                    { id: 2 as const, label: "Visibility" },
                  ]
                ).map((s, idx, arr) => {
                  const active = cameraWizardStep === s.id;
                  const done = cameraWizardStep > s.id;
                  return (
                    <div key={s.id} className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center justify-center text-xs"
                          style={{
                            height: 24,
                            width: 24,
                            borderRadius: "50%",
                            border: "1.5px solid var(--cs-ink)",
                            background: done ? "var(--cs-ink)" : active ? "var(--cs-brand)" : "var(--cs-paper)",
                            color: done || active ? "#fff" : "var(--cs-muted)",
                          }}
                        >
                          {done ? "✓" : idx + 1}
                        </div>
                        <p className="cs-mono text-xs font-bold uppercase" style={{ color: active ? "var(--cs-ink)" : "var(--cs-muted)" }}>{s.label}</p>
                      </div>
                      {idx < arr.length - 1 ? (
                        <div className="mt-3" style={{ height: 1, width: "100%", background: "var(--cs-line)" }} />
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-5">
                <div className="md:col-span-3">
                  <div className="overflow-hidden cs-border" style={{ background: "#000", aspectRatio: "16 / 9" }}>
                    <video ref={previewRef} className="h-full w-full" style={{ objectFit: "cover" }} playsInline autoPlay muted />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>Event: <span style={{ color: "var(--cs-ink)" }}>{cameraGoLiveEvent.title}</span></p>
                    <CsButton
                      variant="outline"
                      onClick={toggleCameraMute}
                      disabled={cameraBusy || !browserLiveRef.current?.stream}
                    >
                      {cameraMuted ? "Unmute" : "Mute"}
                    </CsButton>
                  </div>
                </div>

                <div className="md:col-span-2">
                  {cameraWizardStep === 0 ? (
                    <div className="space-y-4">
                      <div className="cs-border-thin p-4" style={{ background: "var(--cs-paper)" }}>
                        <p className="text-sm font-bold" style={{ color: "var(--cs-ink)" }}>Camera & microphone</p>
                        <p className="cs-mono text-xs mt-1" style={{ color: "var(--cs-muted)" }}>Choose the devices to use for this stream.</p>

                        <div className="mt-4 space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs" style={{ color: "var(--cs-muted)" }}>Camera</Label>
                            <Select
                              value={selectedVideoDeviceId}
                              onValueChange={(v) => {
                                setSelectedVideoDeviceId(v);
                                void startPreviewStream({ videoDeviceId: v });
                              }}
                            >
                              <SelectTrigger style={{ ...fieldStyle, height: "auto" }}>
                                <SelectValue placeholder="Select camera" />
                              </SelectTrigger>
                              <SelectContent style={{ background: "var(--cs-paper)", color: "var(--cs-ink)", border: "2px solid var(--cs-ink)" }}>
                                {videoDevices.length ? (
                                  videoDevices.map((d, idx) => (
                                    <SelectItem key={d.deviceId} value={d.deviceId}>
                                      {d.label || `Camera ${idx + 1}`}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="__none" disabled>
                                    No camera devices
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs" style={{ color: "var(--cs-muted)" }}>Microphone</Label>
                            <Select
                              value={selectedAudioDeviceId}
                              onValueChange={(v) => {
                                setSelectedAudioDeviceId(v);
                                void startPreviewStream({ audioDeviceId: v });
                              }}
                            >
                              <SelectTrigger style={{ ...fieldStyle, height: "auto" }}>
                                <SelectValue placeholder="Select microphone" />
                              </SelectTrigger>
                              <SelectContent style={{ background: "var(--cs-paper)", color: "var(--cs-ink)", border: "2px solid var(--cs-ink)" }}>
                                {audioDevices.length ? (
                                  audioDevices.map((d, idx) => (
                                    <SelectItem key={d.deviceId} value={d.deviceId}>
                                      {d.label || `Microphone ${idx + 1}`}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="__none" disabled>
                                    No microphone devices
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="cs-border-thin p-4" style={{ background: "var(--cs-paper)" }}>
                        <p className="text-sm font-bold" style={{ color: "var(--cs-ink)" }}>Tips</p>
                        <ul className="mt-2 space-y-1 text-xs list-disc pl-4" style={{ color: "var(--cs-muted)" }}>
                          <li>Make sure your camera isn’t in use by another app.</li>
                          <li>Use headphones to avoid feedback.</li>
                        </ul>
                      </div>
                    </div>
                  ) : cameraWizardStep === 1 ? (
                    <div className="space-y-4">
                      <div className="cs-border-thin p-4" style={{ background: "var(--cs-paper)" }}>
                        <p className="text-sm font-bold" style={{ color: "var(--cs-ink)" }}>Customization</p>
                        <p className="cs-mono text-xs mt-1" style={{ color: "var(--cs-muted)" }}>More customization options will be added here.</p>
                        <div className="mt-4 cs-border-thin p-3" style={{ background: "var(--cs-panel)" }}>
                          <p style={labelSlugStyle}>Current title</p>
                          <p className="text-sm mt-1" style={{ color: "var(--cs-ink)" }}>{cameraGoLiveEvent.title}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="cs-border-thin p-4" style={{ background: "var(--cs-paper)" }}>
                        <p className="text-sm font-bold" style={{ color: "var(--cs-ink)" }}>Privacy</p>
                        <p className="cs-mono text-xs mt-1" style={{ color: "var(--cs-muted)" }}>Make your stream public, unlisted, or private.</p>

                        <RadioGroup
                          value={privacy}
                          onValueChange={(v) => setPrivacy(v as "public" | "unlisted" | "private")}
                          className="mt-4 space-y-2"
                        >
                          {(
                            [
                              {
                                value: "private",
                                label: "Private",
                                desc: "Only you and people you choose can watch your stream",
                              },
                              {
                                value: "unlisted",
                                label: "Unlisted",
                                desc: "Anyone with the stream link can watch your stream",
                              },
                              {
                                value: "public",
                                label: "Public",
                                desc: "Everyone can watch your stream",
                              },
                            ] as const
                          ).map((opt) => (
                            <label
                              key={opt.value}
                              className="flex items-start gap-3 p-3 cursor-pointer"
                              style={{
                                border: privacy === opt.value ? "2px solid var(--cs-ink)" : "1.5px solid var(--cs-line)",
                                background: privacy === opt.value ? "var(--cs-panel)" : "var(--cs-paper)",
                              }}
                            >
                              <RadioGroupItem value={opt.value} className="mt-1" />
                              <div>
                                <p className="text-sm" style={{ color: "var(--cs-ink)" }}>{opt.label}</p>
                                <p className="text-xs mt-0.5" style={{ color: "var(--cs-muted)" }}>{opt.desc}</p>
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      <div className="cs-border-thin p-4" style={{ background: "var(--cs-paper)" }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold" style={{ color: "var(--cs-ink)" }}>Schedule</p>
                            <p className="cs-mono text-xs mt-1" style={{ color: "var(--cs-muted)" }}>Select the date and time you want to go live.</p>
                          </div>
                          <CsButton
                            variant="outline"
                            onClick={() => setScheduleEnabled((p) => !p)}
                          >
                            {scheduleEnabled ? "Disable" : "Enable"}
                          </CsButton>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2" style={scheduleEnabled ? undefined : { opacity: 0.5, pointerEvents: "none" }}>
                          <div className="space-y-1">
                            <Label className="text-xs" style={{ color: "var(--cs-muted)" }}>Date</Label>
                            <input
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              style={fieldStyle}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs" style={{ color: "var(--cs-muted)" }}>Time</Label>
                            <input
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              style={fieldStyle}
                            />
                          </div>
                        </div>
                        {scheduleEnabled && (!scheduleDate || !scheduleTime) ? (
                          <p className="cs-mono text-xs mt-2" style={{ color: "var(--cs-rust)" }}>Pick both a date and time to schedule.</p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {cameraError && <p className="cs-mono text-xs" style={{ color: "var(--cs-rust)" }}>{cameraError}</p>}

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <CsButton
                      variant="outline"
                      onClick={() =>
                        setCameraWizardStep((s) => {
                          if (s === 0) return 0;
                          if (s === 1) return 0;
                          return 1;
                        })
                      }
                      disabled={cameraBusy || cameraWizardStep === 0}
                    >
                      Back
                    </CsButton>

                    <div className="flex items-center gap-2">
                      <CsButton
                        variant="outline"
                        onClick={() => {
                          cleanupBrowserLive();
                          setCameraGoLiveEvent(null);
                        }}
                        disabled={cameraBusy}
                      >
                        Cancel
                      </CsButton>

                      {cameraWizardStep < 2 ? (
                        <CsButton
                          variant="rust"
                          onClick={() =>
                            setCameraWizardStep((s) => {
                              if (s === 0) return 1;
                              if (s === 1) return 2;
                              return 2;
                            })
                          }
                          disabled={cameraBusy}
                        >
                          Next
                        </CsButton>
                      ) : (
                        <CsButton
                          variant="rust"
                          onClick={() => {
                            if (scheduleEnabled && (!scheduleDate || !scheduleTime)) {
                              toast.error("Please select both a schedule date and time.");
                              return;
                            }
                            if (!scheduleEnabled && privacy === "private") {
                              toast.error("Private live streams aren't supported yet. Choose Public or Unlisted to go live.");
                              return;
                            }

                            void (async () => {
                              try {
                                await saveGoLiveSetup();
                              } catch (err: any) {
                                toast.error(err?.message || "Failed to save go-live setup");
                                return;
                              }

                              if (scheduleEnabled) {
                                toast.success("Live event scheduled.");
                                cleanupBrowserLive();
                                setCameraGoLiveEvent(null);
                                return;
                              }

                              await startCameraBroadcast();
                            })();
                          }}
                          disabled={cameraBusy}
                        >
                          {cameraBusy ? "Saving..." : scheduleEnabled ? "Done" : "Done"}
                        </CsButton>
                      )}

                      <CsButton
                        variant="ink"
                        onClick={() => void stopCameraBroadcast()}
                        disabled={cameraBusy}
                      >
                        Stop
                      </CsButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
