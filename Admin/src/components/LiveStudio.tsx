import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

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

async function adminApiFetch(path: string, init?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const liveStateBadge = (event?: LiveEvent | null) => {
  if (!event) return { label: "", className: "bg-neutral-700 text-neutral-200" };
  if (event.status === "LIVE") return { label: "Live", className: "bg-emerald-500/20 text-emerald-300" };
  if (event.status === "ENDED") return { label: "Ended", className: "bg-neutral-600/30 text-neutral-300" };
  if (event.isPublished) return { label: "Published", className: "bg-blue-500/20 text-blue-300" };
  return { label: "Draft", className: "bg-amber-500/20 text-amber-300" };
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
    <div className="overflow-hidden rounded-lg border border-neutral-800 bg-black aspect-video relative">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        controls
        playsInline
        preload="metadata"
        muted
        autoPlay
        crossOrigin="anonymous"
        aria-label={title}
      />
      {playerError ? (
        <div className="absolute inset-0 bg-black/70 text-red-200 text-xs p-3">
          <p className="font-semibold">Preview error</p>
          <p className="mt-1 break-words">{playerError}</p>
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
  const itemClass = (id: typeof section) =>
    `w-full text-left px-3 py-2 rounded-md text-sm ${
      section === id ? "bg-[#fd7e14]/10 text-[#fd7e14] border border-[#fd7e14]/30" : "text-neutral-300 hover:bg-neutral-900"
    }`;

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0">
        <div className="mb-3">
          <p className="text-white font-semibold">Live Studio</p>
          <p className="text-xs text-neutral-500">Stream • Webcam • Manage</p>
        </div>
        <div className="space-y-2">
          <button className={itemClass("stream")} onClick={() => onSection("stream")}>Stream</button>
          <button className={itemClass("webcam")} onClick={() => onSection("webcam")}>Webcam</button>
          <button className={itemClass("manage")} onClick={() => onSection("manage")}>Manage</button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
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

    void loadSourcesForEvent(selectedEventId).catch((err: any) => {
      toast.error(err?.message || "Failed to load event sources");
    });

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
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to load chat");
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

  return (
    <LiveStudioShell section={section} onSection={setSection}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-white font-semibold">{section === "stream" ? "Stream" : section === "webcam" ? "Webcam" : "Manage"}</h1>
          <p className="text-sm text-neutral-500 mt-1">Live Studio controls</p>
        </div>
        <Button onClick={loadEvents} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white" disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error ? <div className="text-sm text-red-400 mb-4">{error}</div> : null}

      {section !== "manage" ? (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="md:col-span-2">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {section === "webcam" ? (
                  <div className="aspect-video rounded-lg border border-neutral-800 bg-black/40 overflow-hidden">
                    <video ref={webcamPreviewRef} className="h-full w-full object-contain" playsInline muted autoPlay />
                  </div>
                ) : previewUrl ? (
                  <HlsPlayer src={previewUrl} title={selectedEvent?.title || "Preview"} />
                ) : (
                  <div className="aspect-video rounded-lg border border-neutral-800 bg-black/40 flex items-center justify-center text-neutral-400">
                    No preview available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-white">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-500">Event</label>
                  <select
                    className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white"
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
                      <Badge className={liveStateBadge(selectedEvent).className}>{liveStateBadge(selectedEvent).label}</Badge>
                      <Button variant="outline" className="border-neutral-700 text-neutral-200" onClick={() => copyText(shareLink(selectedEvent))}>
                        Copy Share Link
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-neutral-500">Preview source</label>
                        <button className="text-[11px] text-[#fd7e14]" onClick={() => void loadSourcesForEvent(selectedEvent.id)}>
                          Refresh sources
                        </button>
                      </div>
                      <select
                        className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white"
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
                      <p className="text-[11px] text-neutral-500">GO LIVE uses selected source when set. If none is selected, Live Studio starts ingest mode and waits for OBS/encoder input.</p>
                      {selectedSourceId ? (() => {
                        const s = (selectedEvent.sources ?? []).find((x) => x.id === selectedSourceId);
                        if (!s) return null;
                        return (
                          <p className="text-[11px] text-neutral-500">
                            Health: {s.status}
                            {s.health?.lastHeartbeatAt ? ` • last heartbeat ${new Date(s.health.lastHeartbeatAt).toLocaleTimeString()}` : " • no heartbeat yet"}
                          </p>
                        );
                      })() : null}
                    </div>

                    <div className="flex gap-2">
                      {selectedEvent.status !== "LIVE" ? (
                        <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white" onClick={goLive}>
                          GO LIVE
                        </Button>
                      ) : (
                        <Button className="bg-neutral-800 hover:bg-neutral-700 text-white" onClick={endLive}>
                          END LIVE
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="border-neutral-700 text-neutral-200"
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
                      </Button>
                    </div>

                    {section === "stream" ? (
                      <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs text-neutral-300">
                        <p className="text-xs uppercase tracking-wide text-neutral-400">Stream settings</p>
                        <div>
                          <span className="text-neutral-500">RTMPS URL:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-white/80 break-all flex-1">
                              {formatIngestUrl(selectedEvent.ingestEndpoint) || "Not available"}
                            </span>
                            {selectedEvent.ingestEndpoint ? (
                              <button className="text-[#fd7e14]" onClick={() => copyText(formatIngestUrl(selectedEvent.ingestEndpoint))}>
                                Copy
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <span className="text-neutral-500">Stream key:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-white/80 break-all flex-1">{selectedEvent.streamKey || "Hidden"}</span>
                            {selectedEvent.streamKey ? (
                              <button className="text-[#fd7e14]" onClick={() => copyText(selectedEvent.streamKey || "")}>
                                Copy
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="rounded border border-neutral-800 bg-neutral-950 p-2 text-[11px] space-y-1">
                          <p className="text-neutral-400">Operator checks (OBS/Encoder):</p>
                          <p className="text-neutral-500">• Use RTMPS URL + stream key exactly as shown (no extra spaces).</p>
                          <p className="text-neutral-500">• Start encoder output first, then click GO LIVE in Studio.</p>
                          <p className="text-neutral-500">• If preview stays empty, refresh sources and verify encoder is connected.</p>
                        </div>
                      </div>
                    ) : null}

                    {section === "webcam" ? (
                      <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs text-neutral-300">
                        <p className="text-xs uppercase tracking-wide text-neutral-400">Webcam checks</p>
                        <p className="text-neutral-400">1) Start preview and confirm camera + mic meters are active.</p>
                        <p className="text-neutral-400">2) Ensure event has ingest URL and stream key before broadcasting.</p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" className="bg-[#fd7e14] hover:bg-[#ff9940] text-white" onClick={startWebcamSession} disabled={cameraBusy}>
                            {cameraBusy ? "Starting..." : "Start Webcam Preview"}
                          </Button>
                          <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-200" onClick={startWebcamLive} disabled={cameraBusy || !browserLiveRef.current?.stream || selectedEvent.status === "LIVE"}>
                            Go LIVE (Webcam)
                          </Button>
                          <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-200" onClick={stopWebcamLive} disabled={cameraBusy || !browserLiveRef.current?.stream}>
                            Stop Webcam
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-neutral-700 text-neutral-200"
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
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <select
                            className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white"
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
                            className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white"
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
                        {cameraError ? <p className="text-red-400">{cameraError}</p> : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-neutral-400">Select an event to control.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {selectedEvent ? (
        <Card className="bg-neutral-900 border-neutral-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Chat moderation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-neutral-400">Recent messages for selected event</p>
              <Button variant="outline" className="border-neutral-700 text-neutral-200" onClick={loadChatMessages} disabled={chatBusy}>
                {chatBusy ? "Refreshing..." : "Refresh chat"}
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {chatMessages.length === 0 ? <p className="text-sm text-neutral-400">No messages yet.</p> : null}
              {chatMessages.map((m) => (
                <div key={m.id} className="rounded border border-neutral-800 bg-neutral-950 p-2">
                  <p className="text-xs text-neutral-400">
                    <span className="text-white font-medium">{m.userName}</span> ({m.userRole || "USER"})
                  </p>
                  <p className="text-sm text-neutral-200 mt-1 break-words">{m.message}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="border-neutral-700 text-neutral-200 h-8"
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
                    </Button>
                    <Button
                      variant="outline"
                      className="border-neutral-700 text-neutral-200 h-8"
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
                    </Button>
                    <Button
                      variant="outline"
                      className="border-amber-900/80 text-amber-300 h-8"
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
                    </Button>
                    <Button
                      variant="outline"
                      className="border-red-900/80 text-red-300 h-8"
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
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {section === "manage" ? (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">Live events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-neutral-400">No events.</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const badge = liveStateBadge(event);
                  return (
                    <div key={event.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-neutral-800 rounded-lg bg-neutral-950 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold truncate">{event.title}</p>
                          <Badge className={badge.className}>{badge.label}</Badge>
                        </div>
                        {event.description ? <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{event.description}</p> : null}
                        <p className="text-xs text-neutral-500 mt-2">ID: {event.id}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="border-neutral-700 text-neutral-200" onClick={() => copyText(shareLink(event))}>
                          Share link
                        </Button>
                        <Button
                          variant="outline"
                          className="border-neutral-700 text-neutral-200"
                          onClick={() => {
                            setSelectedEventId(event.id);
                            setSection("stream");
                          }}
                        >
                          Open
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-900/80 text-red-300 hover:bg-red-950/40"
                          disabled={event.status === "LIVE"}
                          title={event.status === "LIVE" ? "End the live first" : "Delete forever"}
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
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
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
    <Card className="bg-neutral-900 border-neutral-800 mt-6">
      <CardHeader>
        <CardTitle className="text-white">Create live event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-neutral-950 border-neutral-800 text-white" placeholder="Title" />
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-neutral-950 border-neutral-800 text-white" placeholder="Description" rows={3} />
        <Button onClick={create} disabled={saving || !title.trim()} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          {saving ? "Creating..." : "Create"}
        </Button>
      </CardContent>
    </Card>
  );
}
