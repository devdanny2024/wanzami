import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CsBox, CsButton, CsEmpty, CsPageHeader, CsSlug, CsTag, type CsColumn, CsTable } from "./cs/kit";

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
  ...fieldStyle,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

type ReplayStatus = "NONE" | "PENDING_INFRA" | "PROCESSING" | "READY" | "FAILED";

type LiveSource = {
  id: string;
  eventId?: string;
  type: "CAMERA" | "SCREEN" | "RTMP" | "CONTROL_DECK";
  label: string;
  status: "READY" | "OFFLINE" | "ERROR" | "DEGRADED";
  reportedStatus?: "READY" | "OFFLINE" | "ERROR" | "DEGRADED";
  playbackUrl?: string | null;
  previewUrl?: string | null;
  metadata?: Record<string, any> | null;
  health?: {
    lastHeartbeatAt?: string | null;
    timeoutMs?: number;
    ageMs?: number | null;
    isTimedOut?: boolean;
    latencyMs?: number | null;
    bitrateKbps?: number | null;
    droppedFrames?: number | null;
    note?: string | null;
  };
  isActiveOutput: boolean;
};

type LiveEvent = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  isPublished?: boolean;
  ingestEndpoint?: string | null;
  playbackUrl?: string | null;
  streamKey?: string | null;
  scheduledStartAt?: string | null;
  viewerCount?: number;
  sources?: LiveSource[];
  replay?: {
    status?: ReplayStatus;
    playbackUrl?: string | null;
    note?: string | null;
  };
};

type LiveChatMessage = {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  message: string;
  isHidden?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  createdAt: string;
};

type BrowserLiveSession = {
  stream: MediaStream;
  client: any | null;
  sourceId?: string;
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

const liveStateBadge = (event?: LiveEvent | null): { label: string; tone: "good" | "bad" | "pending" | "neutral" } => {
  if (!event) return { label: "", tone: "neutral" };
  if (event.status === "LIVE") return { label: "Live", tone: "good" };
  if (event.status === "ENDED") return { label: "Ended", tone: "neutral" };
  if (event.isPublished) return { label: "Published", tone: "pending" };
  return { label: "Draft", tone: "pending" };
};

const pickPlayablePlaybackUrl = (event?: LiveEvent | null, sourceId?: string | null): string => {
  if (!event) return "";
  const sources = event.sources ?? [];
  const preferred = sourceId ? sources.find((s) => s.id === sourceId) : null;
  const byActive = sources.find((s) => s.isActiveOutput);
  const best = preferred?.playbackUrl?.trim() || byActive?.playbackUrl?.trim() || event.playbackUrl?.trim();
  return best || "";
};

const formatIngestUrl = (ingestEndpoint?: string | null) => {
  if (!ingestEndpoint) return "";
  const raw = ingestEndpoint.trim();
  if (!raw) return "";
  if (raw.startsWith("rtmp://") || raw.startsWith("rtmps://")) return raw;
  return `rtmps://${raw}:443/app/`;
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

function HlsPlayer({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);

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
    setPlayerError(null);

    if (!src) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      return cleanup;
    }

    const isHls = src.toLowerCase().includes(".m3u8");

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
          void video.play().catch(() => undefined);
          return;
        }
        const hls = new Hls({ lowLatencyMode: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          void video.play().catch(() => undefined);
        });
        hls.on(Hls.Events.ERROR, (_evt: any, data: any) => {
          if (data?.fatal) {
            setPlayerError(data?.details || data?.type || "Playback error");
          }
        });
        hlsRef.current = hls;
      })().catch((err) => {
        setPlayerError(err?.message || "Failed to load HLS player");
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
      className="relative"
      style={{ overflow: "hidden", background: "#000", aspectRatio: "16 / 9", border: "2.5px solid var(--cs-ink)" }}
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
      {playerError ? (
        <div className="absolute inset-0 p-3" style={{ background: "rgba(0,0,0,0.7)" }}>
          <p className="cs-mono font-bold uppercase" style={{ fontSize: 11, color: "#fff" }}>Preview error</p>
          <p className="cs-mono mt-1" style={{ fontSize: 11, color: "#f2b8b8", wordBreak: "break-word" }}>{playerError}</p>
        </div>
      ) : null}
    </div>
  );
}

function LiveStudioShell({
  section,
  onSection,
  children,
}: {
  section: "stream" | "webcam" | "manage";
  onSection: (s: "stream" | "webcam" | "manage") => void;
  children: React.ReactNode;
}) {
  const tabs: { id: "stream" | "webcam" | "manage"; label: string }[] = [
    { id: "stream", label: "Stream" },
    { id: "webcam", label: "Webcam" },
    { id: "manage", label: "Manage" },
  ];

  return (
    <div className="space-y-6">
      <div className="cs-border inline-flex" style={{ background: "var(--cs-paper)" }}>
        {tabs.map((tab, idx) => {
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSection(tab.id)}
              className="cs-mono font-bold uppercase transition-colors"
              style={{
                fontSize: 12,
                letterSpacing: "0.07em",
                padding: "10px 20px",
                background: active ? "var(--cs-ink)" : "var(--cs-paper)",
                color: active ? "#fff" : "var(--cs-ink)",
                borderLeft: idx === 0 ? "none" : "2.5px solid var(--cs-ink)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function LiveStudio() {
  const [section, setSection] = useState<"stream" | "webcam" | "manage">("stream");
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState("");
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState("");
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraMuted, setCameraMuted] = useState(false);
  const browserLiveRef = useRef<BrowserLiveSession | null>(null);
  const webcamPreviewRef = useRef<HTMLVideoElement | null>(null);

  const selectedEvent = useMemo(() => events.find((e) => e.id === selectedEventId) ?? null, [events, selectedEventId]);
  const previewUrl = useMemo(() => pickPlayablePlaybackUrl(selectedEvent, selectedSourceId || undefined), [selectedEvent, selectedSourceId]);

  const loadSourcesForEvent = async (eventId: string) => {
    const res = await adminApiFetch(`/api/admin/live/events/${eventId}/sources`);
    if (!res.ok) throw new Error((res.data as any)?.message || "Failed to load event sources");

    const nextSources = (((res.data as any)?.sources ?? []) as LiveSource[]);
    setEvents((prev) =>
      prev.map((event) => (event.id === eventId ? { ...event, sources: nextSources } : event))
    );

    return nextSources;
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApiFetch("/api/admin/live/events");
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to load live events");
      const next = (((res.data as any)?.events ?? []) as LiveEvent[]);
      setEvents(next);

      const initialSelectedEventId = selectedEventId || next[0]?.id || "";
      if (!selectedEventId && initialSelectedEventId) {
        setSelectedEventId(initialSelectedEventId);
      }

      if (initialSelectedEventId) {
        await loadSourcesForEvent(initialSelectedEventId);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load live events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
    const t = setInterval(() => void loadEvents(), 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;

    void loadSourcesForEvent(selectedEventId).catch(() => undefined);

    const t = setInterval(() => {
      void loadSourcesForEvent(selectedEventId).catch(() => undefined);
    }, 5000);

    return () => clearInterval(t);
  }, [selectedEventId]);

  useEffect(() => {
    const sources = selectedEvent?.sources ?? [];

    if (selectedSourceId && !sources.some((s) => s.id === selectedSourceId)) {
      setSelectedSourceId("");
      return;
    }

    if (!selectedSourceId && sources.length > 0) {
      const preferred = sources.find((s) => s.isActiveOutput) ?? sources[0];
      if (preferred?.id) {
        setSelectedSourceId(preferred.id);
      }
    }
  }, [selectedEvent, selectedSourceId]);

  useEffect(() => {
    if (section === "webcam") {
      void loadMediaDevices().catch(() => undefined);
    }
  }, [section]);

  useEffect(() => () => cleanupBrowserLive(), []);

  const loadChatMessages = async () => {
    if (!selectedEventId) return;
    setChatBusy(true);
    try {
      const res = await adminApiFetch(`/api/admin/live/events/${selectedEventId}/chat?limit=80`);
      if (!res.ok) {
        const status = res.status;
        // Keep polling resilient during transient upstream issues.
        if (status === 404 || status === 502 || status === 503 || status === 504) return;
        throw new Error((res.data as any)?.message || "Failed to load chat");
      }
      setChatMessages(((res.data as any)?.messages ?? []) as LiveChatMessage[]);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load chat");
    } finally {
      setChatBusy(false);
    }
  };

  useEffect(() => {
    void loadChatMessages();
    const t = setInterval(() => void loadChatMessages(), 8000);
    return () => clearInterval(t);
  }, [selectedEventId]);

  const copyText = async (value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
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
    if (webcamPreviewRef.current) {
      webcamPreviewRef.current.srcObject = null;
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

    const stream = await withTimeout(
      navigator.mediaDevices.getUserMedia({
        video: videoDeviceId ? { deviceId: { exact: videoDeviceId } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
      }),
      15000,
      "Camera/microphone request timed out. Check browser permission and device availability.",
    );

    browserLiveRef.current = { stream, client: null };
    if (webcamPreviewRef.current) {
      webcamPreviewRef.current.srcObject = stream;
      webcamPreviewRef.current.muted = true;
      void webcamPreviewRef.current.play().catch(() => undefined);
    }

    return stream;
  };

  const startWebcamSession = async () => {
    try {
      setCameraError(null);
      setCameraBusy(true);
      await startPreviewStream();
      await loadMediaDevices();
    } catch (err: any) {
      setCameraError(err?.message || "Unable to access camera/microphone.");
    } finally {
      setCameraBusy(false);
    }
  };

  const ensureBroadcastSdk = async () => {
    if (typeof window === "undefined") throw new Error("Browser environment required");
    const w = window as any;
    if (w.IVSBroadcastClient) return w.IVSBroadcastClient;
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://web-broadcast.live-video.net/1.29.0/amazon-ivs-web-broadcast.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load IVS broadcast SDK"));
      document.head.appendChild(script);
    });
    if (!w.IVSBroadcastClient) throw new Error("IVS broadcast SDK unavailable");
    return w.IVSBroadcastClient;
  };

  const startWebcamLive = async () => {
    if (!selectedEvent) return;
    const ingestEndpoint = selectedEvent.ingestEndpoint?.trim() || "";
    if (!ingestEndpoint || !selectedEvent.streamKey) {
      setCameraError("Event ingest details are missing. Use Stream settings to copy RTMPS URL + stream key.");
      return;
    }

    const stream = browserLiveRef.current?.stream;
    if (!stream) {
      setCameraError("Start webcam preview first.");
      return;
    }

    try {
      setCameraError(null);
      setCameraBusy(true);

      if (!selectedEvent.isPublished) {
        const pub = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/publish`, {
          method: "PATCH",
          body: JSON.stringify({ isPublished: true }),
        });
        if (!pub.ok) throw new Error((pub.data as any)?.message || "Failed to publish");
      }

      const sdk = await ensureBroadcastSdk();
      const client = sdk.create({ streamConfig: sdk.BASIC_LANDSCAPE });
      if (stream.getVideoTracks().length) client.addVideoInputDevice(stream, "camera", { index: 0 });
      if (stream.getAudioTracks().length) client.addAudioInputDevice(stream, "mic");

      await withTimeout(
        client.startBroadcast(selectedEvent.streamKey, ingestEndpoint),
        15000,
        "Webcam broadcast start timed out. Check ingest URL/network and retry.",
      );

      // Give IVS ingest a short warm-up window before backend probes playback m3u8.
      await new Promise((resolve) => setTimeout(resolve, 8000));

      let sourceId: string | undefined;
      const latest = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}`);
      const latestEvent = latest.ok ? ((latest.data as any)?.event as LiveEvent) : selectedEvent;
      const sourcePlaybackUrl = latestEvent.playbackUrl || selectedEvent.playbackUrl || null;
      const existing = (latestEvent.sources ?? []).find((s) => s.type === "CAMERA" && s.label === "Browser Camera");
      if (existing) {
        sourceId = existing.id;
        await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/sources/${existing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "READY", isActiveOutput: true, playbackUrl: sourcePlaybackUrl }),
        });
      } else {
        const created = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/sources`, {
          method: "POST",
          body: JSON.stringify({ type: "CAMERA", label: "Browser Camera", status: "READY", isActiveOutput: true, playbackUrl: sourcePlaybackUrl }),
        });
        sourceId = (created.data as any)?.source?.id;
      }

      if (sourceId) {
        setSelectedSourceId(sourceId);
      }

      const start = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/start`, {
        method: "POST",
        body: JSON.stringify(sourceId ? { sourceId } : {}),
      });
      if (!start.ok) throw new Error((start.data as any)?.message || "Failed to go live");

      browserLiveRef.current = { stream, client, sourceId };
      toast.success("Webcam is now LIVE");
      await loadEvents();
    } catch (err: any) {
      setCameraError(err?.message || "Failed to start webcam live.");
      toast.error(err?.message || "Failed to start webcam live.");
    } finally {
      setCameraBusy(false);
    }
  };

  const stopWebcamLive = async () => {
    if (!selectedEvent) return;
    try {
      setCameraBusy(true);
      if (selectedEvent.status === "LIVE") {
        await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/end`, { method: "POST" });
      }
      cleanupBrowserLive();
      await loadEvents();
    } finally {
      setCameraBusy(false);
    }
  };

  const goLive = async () => {
    if (!selectedEvent) return;

    const sources = selectedEvent.sources ?? [];
    const sourceId = selectedSourceId || sources.find((s) => s.isActiveOutput)?.id || sources[0]?.id;

    try {
      setError(null);
      if (!selectedEvent.isPublished) {
        const pub = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/publish`, {
          method: "PATCH",
          body: JSON.stringify({ isPublished: true }),
        });
        if (!pub.ok) throw new Error((pub.data as any)?.message || "Failed to publish");
      }

      const start = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/start`, {
        method: "POST",
        body: JSON.stringify(sourceId ? { sourceId } : {}),
      });
      if (!start.ok) throw new Error((start.data as any)?.message || "Failed to go live");

      toast.success(sourceId ? "Event is now LIVE with selected source" : "Event is now LIVE. Waiting for ingest signal.");
      await loadEvents();
    } catch (err: any) {
      const msg = err?.message || "Failed to go live";
      setError(msg);
      toast.error(msg);
    }
  };

  const endLive = async () => {
    if (!selectedEvent) return;
    try {
      setError(null);
      const res = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/end`, { method: "POST" });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to end live");
      toast.success("Live ended");
      await loadEvents();
    } catch (err: any) {
      const msg = err?.message || "Failed to end live";
      setError(msg);
      toast.error(msg);
    }
  };

  const shareLink = (event?: LiveEvent | null) => {
    if (!event) return "";
    // Userend live details page
    return `${window.location.origin.replace("admin", "").replace(/\/$/, "")}/live/${event.id}`;
  };

  const manageColumns: CsColumn<LiveEvent>[] = [
    {
      key: "title",
      header: "Event",
      cell: (event) => (
        <div>
          <p className="cs-mono text-xs font-bold uppercase" style={{ color: "var(--cs-ink)" }}>{event.title}</p>
          {event.description ? (
            <p className="text-xs mt-1" style={{ color: "var(--cs-muted)" }}>{event.description}</p>
          ) : null}
          <p className="cs-mono mt-1" style={{ fontSize: 10, color: "var(--cs-muted)" }}>ID: {event.id}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (event) => {
        const badge = liveStateBadge(event);
        return <CsTag tone={badge.tone} label={badge.label} />;
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (event) => (
        <div className="flex flex-wrap gap-2 justify-end">
          <CsButton variant="outline" onClick={() => copyText(shareLink(event))}>
            Share link
          </CsButton>
          <CsButton
            variant="outline"
            onClick={() => {
              setSelectedEventId(event.id);
              setSection("stream");
            }}
          >
            Open
          </CsButton>
          <CsButton
            variant="rust"
            disabled={event.status === "LIVE"}
            onClick={async () => {
              if (!confirm(`Delete "${event.title}" forever?`)) return;
              const res = await adminApiFetch(`/api/admin/live/events/${event.id}`, { method: "DELETE" });
              if (res.ok) {
                toast.success("Deleted");
                await loadEvents();
              } else {
                toast.error((res.data as any)?.message || "Delete failed");
              }
            }}
          >
            Delete
          </CsButton>
        </div>
      ),
    },
  ];

  return (
    <LiveStudioShell section={section} onSection={setSection}>
      <CsPageHeader
        title={section === "stream" ? "The broadcast" : section === "webcam" ? "The webcam" : "The roster"}
        chip={section === "stream" ? "Stream" : section === "webcam" ? "Webcam" : "Manage"}
        slug="Live Studio · ingest, preview, and moderation controls"
        actions={
          <CsButton variant="rust" onClick={loadEvents} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </CsButton>
        }
      />

      {error ? (
        <div className="cs-border p-4 mt-6" style={{ borderColor: "var(--cs-rust)" }}>
          <p className="cs-mono text-xs font-bold uppercase" style={{ color: "var(--cs-rust)" }}>{error}</p>
        </div>
      ) : null}

      {section !== "manage" ? (
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <div className="md:col-span-2">
            <CsBox className="p-5">
              <CsSlug>Preview</CsSlug>
              <div className="mt-4">
                {section === "webcam" ? (
                  <div
                    className="relative"
                    style={{ overflow: "hidden", background: "#000", aspectRatio: "16 / 9", border: "2.5px solid var(--cs-ink)" }}
                  >
                    <video ref={webcamPreviewRef} className="h-full w-full" style={{ objectFit: "contain" }} playsInline muted autoPlay />
                  </div>
                ) : previewUrl ? (
                  <HlsPlayer src={previewUrl} title={selectedEvent?.title || "Preview"} />
                ) : (
                  <CsEmpty slug="No preview available" body="Select an event with an active source, or start ingest to see a live preview here." />
                )}
              </div>
            </CsBox>
          </div>

          <div>
            <CsBox className="p-5">
              <CsSlug>Controls</CsSlug>
              <div className="space-y-3 mt-4">
                <div className="space-y-1">
                  <CsSlug>Event</CsSlug>
                  <select
                    style={selectStyle}
                    className="w-full"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select event
                    </option>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.title} ({e.status})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedEvent ? (
                  <>
                    <div className="flex items-center justify-between">
                      <CsTag tone={liveStateBadge(selectedEvent).tone} label={liveStateBadge(selectedEvent).label} />
                      <CsButton variant="outline" onClick={() => copyText(shareLink(selectedEvent))}>
                        Copy Share Link
                      </CsButton>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <CsSlug>Preview source</CsSlug>
                        <button
                          className="cs-mono font-bold uppercase"
                          style={{ fontSize: 10, color: "var(--cs-rust)", letterSpacing: "0.07em" }}
                          onClick={() => void loadSourcesForEvent(selectedEvent.id)}
                        >
                          Refresh sources
                        </button>
                      </div>
                      <select
                        style={selectStyle}
                        className="w-full"
                        value={selectedSourceId}
                        onChange={(e) => setSelectedSourceId(e.target.value)}
                      >
                        <option value="">(Auto)</option>
                        {(selectedEvent.sources ?? []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} [{s.status}] {s.isActiveOutput ? "(ACTIVE)" : ""}
                          </option>
                        ))}
                      </select>
                      <p className="cs-mono mt-1" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
                        GO LIVE uses selected source when set. If none is selected, Live Studio starts ingest mode and waits for OBS/encoder input.
                      </p>
                      {selectedSourceId ? (() => {
                        const s = (selectedEvent.sources ?? []).find((x) => x.id === selectedSourceId);
                        if (!s) return null;
                        return (
                          <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
                            Health: {s.status}
                            {s.health?.lastHeartbeatAt ? ` • last heartbeat ${new Date(s.health.lastHeartbeatAt).toLocaleTimeString()}` : " • no heartbeat yet"}
                          </p>
                        );
                      })() : null}
                    </div>

                    <div className="flex gap-2">
                      {selectedEvent.status !== "LIVE" ? (
                        <CsButton variant="rust" onClick={goLive}>
                          GO LIVE
                        </CsButton>
                      ) : (
                        <CsButton variant="ink" onClick={endLive}>
                          END LIVE
                        </CsButton>
                      )}
                      <CsButton
                        variant="outline"
                        onClick={async () => {
                          const target = !Boolean(selectedEvent.isPublished);
                          const res = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/publish`, {
                            method: "PATCH",
                            body: JSON.stringify({ isPublished: target }),
                          });
                          if (res.ok) {
                            toast.success(target ? "Published" : "Unpublished");
                            await loadEvents();
                          } else {
                            toast.error((res.data as any)?.message || "Failed");
                          }
                        }}
                      >
                        {selectedEvent.isPublished ? "Unpublish" : "Publish"}
                      </CsButton>
                    </div>

                    {section === "stream" ? (
                      <div className="pt-3 mt-1 space-y-2" style={{ borderTop: "1.5px solid var(--cs-line)" }}>
                        <CsSlug>Stream settings</CsSlug>
                        <div>
                          <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>RTMPS URL:</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="cs-mono flex-1" style={{ fontSize: 11, color: "var(--cs-ink)", wordBreak: "break-all" }}>
                              {formatIngestUrl(selectedEvent.ingestEndpoint) || "Not available"}
                            </span>
                            {selectedEvent.ingestEndpoint ? (
                              <button
                                className="cs-mono font-bold uppercase"
                                style={{ fontSize: 10, color: "var(--cs-rust)" }}
                                onClick={() => copyText(formatIngestUrl(selectedEvent.ingestEndpoint))}
                              >
                                Copy
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>Stream key:</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="cs-mono flex-1" style={{ fontSize: 11, color: "var(--cs-ink)", wordBreak: "break-all" }}>
                              {selectedEvent.streamKey || "Hidden"}
                            </span>
                            {selectedEvent.streamKey ? (
                              <button
                                className="cs-mono font-bold uppercase"
                                style={{ fontSize: 10, color: "var(--cs-rust)" }}
                                onClick={() => copyText(selectedEvent.streamKey || "")}
                              >
                                Copy
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="p-2 space-y-1" style={{ border: "1.5px solid var(--cs-line)", background: "var(--cs-panel)" }}>
                          <p className="cs-mono font-bold uppercase" style={{ fontSize: 10, color: "var(--cs-ink)" }}>Operator checks (OBS/Encoder):</p>
                          <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>• Use RTMPS URL + stream key exactly as shown (no extra spaces).</p>
                          <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>• Start encoder output first, then click GO LIVE in Studio.</p>
                          <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>• If preview stays empty, refresh sources and verify encoder is connected.</p>
                        </div>
                      </div>
                    ) : null}

                    {section === "webcam" ? (
                      <div className="pt-3 mt-1 space-y-2" style={{ borderTop: "1.5px solid var(--cs-line)" }}>
                        <CsSlug>Webcam checks</CsSlug>
                        <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>1) Start preview and confirm camera + mic meters are active.</p>
                        <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>2) Ensure event has ingest URL and stream key before broadcasting.</p>
                        <div className="flex flex-wrap gap-2">
                          <CsButton variant="rust" onClick={startWebcamSession} disabled={cameraBusy}>
                            {cameraBusy ? "Starting..." : "Start Webcam Preview"}
                          </CsButton>
                          <CsButton variant="outline" onClick={startWebcamLive} disabled={cameraBusy || !browserLiveRef.current?.stream || selectedEvent.status === "LIVE"}>
                            Go LIVE (Webcam)
                          </CsButton>
                          <CsButton variant="outline" onClick={stopWebcamLive} disabled={cameraBusy || !browserLiveRef.current?.stream}>
                            Stop Webcam
                          </CsButton>
                          <CsButton
                            variant="outline"
                            onClick={() => {
                              const stream = browserLiveRef.current?.stream;
                              if (!stream) return;
                              const nextMuted = !cameraMuted;
                              stream.getAudioTracks().forEach((track) => {
                                track.enabled = !nextMuted;
                              });
                              setCameraMuted(nextMuted);
                            }}
                            disabled={!browserLiveRef.current?.stream}
                          >
                            {cameraMuted ? "Unmute Mic" : "Mute Mic"}
                          </CsButton>
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <select
                            style={selectStyle}
                            value={selectedVideoDeviceId}
                            onChange={(e) => {
                              setSelectedVideoDeviceId(e.target.value);
                              void startPreviewStream({ videoDeviceId: e.target.value }).catch((err: any) => setCameraError(err?.message || "Failed to switch camera"));
                            }}
                          >
                            <option value="">Default Camera</option>
                            {videoDevices.map((d, idx) => (
                              <option key={d.deviceId || `v-${idx}`} value={d.deviceId}>
                                {d.label || `Camera ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                          <select
                            style={selectStyle}
                            value={selectedAudioDeviceId}
                            onChange={(e) => {
                              setSelectedAudioDeviceId(e.target.value);
                              void startPreviewStream({ audioDeviceId: e.target.value }).catch((err: any) => setCameraError(err?.message || "Failed to switch microphone"));
                            }}
                          >
                            <option value="">Default Microphone</option>
                            {audioDevices.map((d, idx) => (
                              <option key={d.deviceId || `a-${idx}`} value={d.deviceId}>
                                {d.label || `Microphone ${idx + 1}`}
                              </option>
                            ))}
                          </select>
                        </div>
                        {cameraError ? (
                          <p className="cs-mono font-bold" style={{ fontSize: 10, color: "var(--cs-rust)" }}>{cameraError}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="cs-mono" style={{ fontSize: 12, color: "var(--cs-muted)" }}>Select an event to control.</p>
                )}
              </div>
            </CsBox>
          </div>
        </div>
      ) : null}

      {selectedEvent ? (
        <CsBox className="p-5 mt-6">
          <div className="flex items-center justify-between">
            <CsSlug>Chat moderation</CsSlug>
            <CsButton variant="outline" onClick={loadChatMessages} disabled={chatBusy}>
              {chatBusy ? "Refreshing..." : "Refresh chat"}
            </CsButton>
          </div>
          <p className="cs-mono mt-2" style={{ fontSize: 10, color: "var(--cs-muted)" }}>Recent messages for selected event</p>
          <div className="space-y-2 mt-3" style={{ maxHeight: 256, overflowY: "auto" }}>
            {chatMessages.length === 0 ? (
              <p className="cs-mono" style={{ fontSize: 12, color: "var(--cs-muted)" }}>No messages yet.</p>
            ) : null}
            {chatMessages.map((m) => (
              <div key={m.id} className="p-2" style={{ border: "1.5px solid var(--cs-line)", background: "var(--cs-panel)" }}>
                <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
                  <span className="font-bold" style={{ color: "var(--cs-ink)" }}>{m.userName}</span> ({m.userRole || "USER"})
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--cs-ink)", wordBreak: "break-word" }}>{m.message}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <CsButton
                    variant="outline"
                    onClick={async () => {
                      const res = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/chat/${m.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ isHidden: !m.isHidden }),
                      });
                      if (res.ok) {
                        toast.success(!m.isHidden ? "Message hidden" : "Message restored");
                        await loadChatMessages();
                      } else {
                        toast.error((res.data as any)?.message || "Failed");
                      }
                    }}
                  >
                    {m.isHidden ? "Unhide" : "Hide"}
                  </CsButton>
                  <CsButton
                    variant="outline"
                    onClick={async () => {
                      const res = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/chat/${m.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ isPinned: !m.isPinned }),
                      });
                      if (res.ok) {
                        toast.success(!m.isPinned ? "Pinned" : "Unpinned");
                        await loadChatMessages();
                      } else {
                        toast.error((res.data as any)?.message || "Failed");
                      }
                    }}
                  >
                    {m.isPinned ? "Unpin" : "Pin"}
                  </CsButton>
                  <button
                    className="cs-mono font-bold uppercase"
                    style={{ fontSize: 10, letterSpacing: "0.07em", padding: "10px 18px", border: "2.5px solid var(--cs-rust)", color: "var(--cs-rust)", background: "var(--cs-paper)" }}
                    onClick={async () => {
                      const res = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/chat/mute`, {
                        method: "POST",
                        body: JSON.stringify({ userId: m.userId, mutedMinutes: 30, reason: "Moderator action" }),
                      });
                      if (res.ok) {
                        toast.success(`Muted ${m.userName} for 30 mins`);
                      } else {
                        toast.error((res.data as any)?.message || "Failed");
                      }
                    }}
                  >
                    Mute 30m
                  </button>
                  <CsButton
                    variant="rust"
                    onClick={async () => {
                      const res = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/chat/${m.id}`, {
                        method: "DELETE",
                      });
                      if (res.ok) {
                        toast.success("Message removed");
                        await loadChatMessages();
                      } else {
                        toast.error((res.data as any)?.message || "Failed");
                      }
                    }}
                  >
                    Delete
                  </CsButton>
                </div>
              </div>
            ))}
          </div>
        </CsBox>
      ) : null}

      {section === "manage" ? (
        <CsBox className="p-5">
          <CsSlug>Live events</CsSlug>
          <div className="mt-4">
            <CsTable
              columns={manageColumns}
              rows={events}
              rowKey={(event) => event.id}
              emptySlug="No events"
              emptyBody="Create a live event below to get started."
            />
          </div>
        </CsBox>
      ) : null}

      {/* Quick create event (simple) */}
      {section === "manage" ? <CreateLiveEventCard onCreated={loadEvents} /> : null}
    </LiveStudioShell>
  );
}

function CreateLiveEventCard({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    if (!title.trim()) return;
    try {
      setSaving(true);
      setError(null);
      const res = await adminApiFetch("/api/admin/live/events", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to create");
      toast.success("Event created");
      setTitle("");
      setDescription("");
      onCreated();
    } catch (err: any) {
      setError(err?.message || "Failed");
      toast.error(err?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CsBox className="p-5 mt-6">
      <CsSlug>Create live event</CsSlug>
      <div className="space-y-3 mt-4">
        {error ? (
          <p className="cs-mono font-bold" style={{ fontSize: 11, color: "var(--cs-rust)" }}>{error}</p>
        ) : null}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={fieldStyle}
          placeholder="Title"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={fieldStyle}
          placeholder="Description"
          rows={3}
        />
        <CsButton variant="rust" onClick={create} disabled={saving || !title.trim()}>
          {saving ? "Creating..." : "Create"}
        </CsButton>
      </div>
    </CsBox>
  );
}
