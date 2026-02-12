import { useEffect, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";

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
  status: "READY" | "OFFLINE" | "ERROR";
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
  status: "SCHEDULED" | "LIVE" | "ENDED";
  isPublished?: boolean;
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


const liveStateBadge = (event: LiveEvent) => {
  if (event.status === "LIVE") {
    return { label: "Live", className: "bg-emerald-500/20 text-emerald-300" };
  }
  if (event.status === "ENDED") {
    return { label: "Ended", className: "bg-neutral-600/30 text-neutral-300" };
  }
  if (event.isPublished) {
    return { label: "Published", className: "bg-blue-500/20 text-blue-300" };
  }
  return { label: "Draft", className: "bg-amber-500/20 text-amber-300" };
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

const replayBadge = (status?: ReplayStatus) => {
  switch (status) {
    case "READY":
      return "bg-emerald-500/20 text-emerald-300";
    case "PROCESSING":
      return "bg-amber-500/20 text-amber-300";
    case "PENDING_INFRA":
      return "bg-orange-500/20 text-orange-300";
    case "FAILED":
      return "bg-red-500/20 text-red-300";
    default:
      return "bg-neutral-700 text-neutral-200";
  }
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

export function CreatorHub() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
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
          scheduledStartAt: normalizedScheduledStart,
        }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to create event");
      setTitle("");
      setDescription("");
      setThumbnailUrl("");
      setThumbnailFile(null);
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
      const res = await adminApiFetch(`/api/admin/live/events/${id}/${action}`, {
        method: "POST",
        body: action === "start" && sourceId ? JSON.stringify({ sourceId }) : undefined,
      });
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

  const openCameraGoLive = async (event: LiveEvent) => {
    try {
      setCameraError(null);
      setCameraBusy(true);
      cleanupBrowserLive();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      browserLiveRef.current = { stream, client: null };
      setCameraGoLiveEvent(event);
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.srcObject = stream;
          previewRef.current.muted = true;
          void previewRef.current.play().catch(() => undefined);
        }
      }, 0);
    } catch (err: any) {
      setCameraError(err?.message ?? "Unable to access camera/microphone.");
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

      const sdk = await ensureBroadcastSdk();
      const client = sdk.create({ streamConfig: sdk.BASIC_LANDSCAPE });

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) client.addVideoInputDevice(videoTrack, "camera", { index: 0 });
      if (audioTrack) client.addAudioInputDevice(audioTrack, "mic");

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">Creator Hub</h1>
          <p className="text-neutral-400 mt-1">Create, schedule, go-live, and end live streams</p>
        </div>
        <Button onClick={loadEvents} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          Refresh
        </Button>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Create / Schedule Live Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Live event title"
            className="bg-neutral-950 border-neutral-800 text-white"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="bg-neutral-950 border-neutral-800 text-white"
            rows={3}
          />
          <Input
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="Thumbnail URL (optional if file uploaded)"
            className="bg-neutral-950 border-neutral-800 text-white"
          />
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Or upload thumbnail file</label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
              className="bg-neutral-950 border-neutral-800 text-white"
            />
            {thumbnailFile && <p className="text-xs text-neutral-400">Selected: {thumbnailFile.name}</p>}
          </div>
          <div>
            <label className="text-sm text-neutral-400">Scheduled start (optional)</label>
            <Input
              type="datetime-local"
              value={scheduledStartAt}
              onChange={(e) => setScheduledStartAt(e.target.value)}
              className="bg-neutral-950 border-neutral-800 text-white mt-1"
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={saving || !title.trim()}
            className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
          >
            {saving ? "Creating..." : "Create Event"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Live Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-neutral-400">Loading...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-neutral-400">No live events yet.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const ingestUrl = event.ingestEndpoint ? `rtmps://${event.ingestEndpoint}:443/app/` : "";
                const stateBadge = liveStateBadge(event);
                return (
                  <div key={event.id} className="border border-neutral-800 rounded-xl p-4 bg-neutral-950 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-white font-semibold">{event.title}</p>
                        <p className="text-xs text-neutral-500">
                          Created {event.createdAt ? new Date(event.createdAt).toLocaleString() : "Unknown"}
                        </p>
                        {event.scheduledStartAt && (
                          <p className="text-xs text-blue-300 mt-1">
                            Scheduled: {new Date(event.scheduledStartAt).toLocaleString()}
                          </p>
                        )}
                        {event.startedAt && (
                          <p className="text-xs text-emerald-300 mt-1">
                            Started: {new Date(event.startedAt).toLocaleString()}
                          </p>
                        )}
                        {event.endedAt && (
                          <p className="text-xs text-neutral-400 mt-1">
                            Ended: {new Date(event.endedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={stateBadge.className}>{stateBadge.label}</Badge>
                        <Badge className={replayBadge(event.replay?.status)}>
                          Replay: {event.replay?.status ?? "NONE"}
                        </Badge>
                      </div>
                    </div>

                    {event.description && <p className="text-sm text-neutral-300">{event.description}</p>}

                    <div className="grid gap-2 text-xs text-neutral-400">
                      {/* RTMPS details moved into Advanced */}
                      {/* Stream key hidden from default simple flow */}
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Playback URL:</span>
                        <span className="text-white/80 break-all">{event.playbackUrl || "Not available"}</span>
                        {event.playbackUrl && (
                          <button onClick={() => copyText(event.playbackUrl)} className="text-[#fd7e14]">Copy</button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Replay URL:</span>
                        <span className="text-white/80 break-all">{event.replay?.playbackUrl || "Not available"}</span>
                        {event.replay?.playbackUrl && (
                          <button onClick={() => copyText(event.replay?.playbackUrl)} className="text-[#fd7e14]">Copy</button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500">Current Viewers:</span>
                        <span className="text-white/80">{event.viewerCount ?? 0}</span>
                      </div>
                      {event.replay?.note && <p className="text-xs text-orange-300">{event.replay.note}</p>}
                    </div>

                    <div className="border border-neutral-800 rounded-lg p-3 space-y-3 bg-neutral-900/40">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">Viewer Controls</p>
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-1">
                          <label className="text-xs text-neutral-500">Manual viewer count</label>
                          <Input
                            type="number"
                            min={0}
                            value={viewerDrafts[event.id]?.viewerCount ?? String(event.viewerCount ?? 0)}
                            onChange={(e) => updateViewerDraft(event.id, e.target.value)}
                            disabled={event.status !== "LIVE"}
                            className="w-48 bg-neutral-950 border-neutral-800 text-white disabled:opacity-60"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => bumpViewerDraft(event, -10)}
                            disabled={event.status !== "LIVE"}
                            className="border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                          >
                            -10
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => bumpViewerDraft(event, 10)}
                            disabled={event.status !== "LIVE"}
                            className="border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                          >
                            +10
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => bumpViewerDraft(event, 100)}
                            disabled={event.status !== "LIVE"}
                            className="border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                          >
                            +100
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => saveViewerCount(event)}
                          disabled={viewerSavingId === event.id || event.status !== "LIVE"}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white"
                        >
                          {viewerSavingId === event.id ? "Saving viewers..." : "Save Viewers"}
                        </Button>
                      </div>
                      {event.status !== "LIVE" && (
                        <p className="text-xs text-neutral-500">Viewer count can only be edited while this event is live.</p>
                      )}
                    </div>

                    <div className="border border-neutral-800 rounded-lg p-3 space-y-3 bg-neutral-900/40">
                      <p className="text-xs uppercase tracking-wide text-neutral-400">Replay Controls</p>
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                          <label className="text-xs text-neutral-500">Status</label>
                          <select
                            value={(replayDrafts[event.id]?.status ?? event.replay?.status ?? "NONE") as ReplayStatus}
                            onChange={(e) => updateReplayDraft(event.id, { status: e.target.value as ReplayStatus })}
                            className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white"
                          >
                            {replayStatuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs text-neutral-500">Replay playback URL</label>
                          <Input
                            value={replayDrafts[event.id]?.playbackUrl ?? event.replay?.playbackUrl ?? ""}
                            onChange={(e) => updateReplayDraft(event.id, { playbackUrl: e.target.value })}
                            placeholder="https://...m3u8"
                            className="bg-neutral-950 border-neutral-800 text-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-neutral-500">Replay note</label>
                        <Textarea
                          rows={2}
                          value={replayDrafts[event.id]?.note ?? event.replay?.note ?? ""}
                          onChange={(e) => updateReplayDraft(event.id, { note: e.target.value })}
                          placeholder="Internal note about replay state"
                          className="bg-neutral-950 border-neutral-800 text-white"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveReplay(event)}
                        disabled={replaySavingId === event.id}
                        className="bg-neutral-800 hover:bg-neutral-700 text-white"
                      >
                        {replaySavingId === event.id ? "Saving replay..." : "Save Replay"}
                      </Button>
                    </div>

                    <details className="border border-neutral-800 rounded-lg p-3 space-y-3 bg-neutral-900/40">
                      <summary className="text-xs uppercase tracking-wide text-neutral-300 cursor-pointer">Advanced</summary>
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-2 text-xs text-neutral-400">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">RTMPS URL:</span>
                            <span className="text-white/80 break-all">{ingestUrl || "Not available"}</span>
                            {ingestUrl && <button onClick={() => copyText(ingestUrl)} className="text-[#fd7e14]">Copy</button>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">Stream Key:</span>
                            <span className="text-white/80 break-all">{event.streamKey || "Hidden"}</span>
                            {event.streamKey && (
                              <button onClick={() => copyText(event.streamKey)} className="text-[#fd7e14]">Copy</button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs uppercase tracking-wide text-neutral-400">Source Deck</p>
                      <div className="grid gap-2 md:grid-cols-4">
                        <Input
                          value={sourceDrafts[event.id]?.label ?? ""}
                          onChange={(e) => updateSourceDraft(event.id, { label: e.target.value })}
                          placeholder="Source label"
                          className="bg-neutral-950 border-neutral-800 text-white"
                        />
                        <select
                          value={sourceDrafts[event.id]?.type ?? "CAMERA"}
                          onChange={(e) => updateSourceDraft(event.id, { type: e.target.value as LiveSource["type"] })}
                          className="rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white"
                        >
                          <option value="CAMERA">Camera</option>
                          <option value="SCREEN">Screen</option>
                          <option value="RTMP">RTMP</option>
                          <option value="CONTROL_DECK">Control Deck</option>
                        </select>
                        <Input
                          value={sourceDrafts[event.id]?.playbackUrl ?? ""}
                          onChange={(e) => updateSourceDraft(event.id, { playbackUrl: e.target.value })}
                          placeholder="Playback URL (optional)"
                          className="bg-neutral-950 border-neutral-800 text-white"
                        />
                        <Button
                          size="sm"
                          onClick={() => addSource(event)}
                          disabled={sourceBusyId === event.id}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white"
                        >
                          Add Source
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {(event.sources ?? []).length === 0 ? (
                          <p className="text-xs text-neutral-500">No sources configured. Legacy single-stream playback fallback remains active.</p>
                        ) : (
                          (event.sources ?? []).map((source) => (
                            <div key={source.id} className="flex items-center justify-between rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2">
                              <div>
                                <p className="text-sm text-white">
                                  {source.label} <span className="text-xs text-neutral-500">({source.type})</span>
                                </p>
                                <p className="text-xs text-neutral-400">
                                  {source.isActiveOutput ? "ACTIVE OUTPUT" : source.status}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {event.status === "LIVE" && !source.isActiveOutput && (
                                  <Button size="sm" variant="outline" className="border-neutral-700 text-neutral-200" onClick={() => switchSourceLive(event.id, source.id)}>
                                    Take Live
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-neutral-700 text-neutral-200"
                                  onClick={() => deleteSource(event.id, source.id)}
                                  disabled={event.status === "LIVE" && source.isActiveOutput}
                                  title={event.status === "LIVE" && source.isActiveOutput ? "Switch to another source or end stream before removing the active output." : "Remove source"}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      </div>
                    </details>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.status === "SCHEDULED" && (
                        <Button
                          size="sm"
                          onClick={() => void openCameraGoLive(event)}
                          disabled={cameraBusy}
                          className="bg-[#fd7e14] hover:bg-[#ff9940] text-white disabled:opacity-60"
                          title="Start browser camera flow"
                        >
                          Go Live with Camera
                        </Button>
                      )}
                      {event.status !== "ENDED" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(event.id, "end")}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white"
                        >
                          End Live
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublish(event)}
                        className="border-neutral-700 text-neutral-200 hover:bg-neutral-800"
                      >
                        {event.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteTargetEvent(event)}
                        disabled={deletingEventId === event.id || event.status === "LIVE"}
                        className="border-red-900/80 text-red-300 hover:bg-red-950/40"
                        title={event.status === "LIVE" ? "End this live event before deleting it." : "Delete this event"}
                      >
                        {deletingEventId === event.id ? "Deleting..." : "Delete Event"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(deleteTargetEvent)} onOpenChange={(open) => !open && setDeleteTargetEvent(null)}>
        <AlertDialogContent className="bg-neutral-950 border-neutral-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete live event?</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-300">
              This action is irreversible. Deleting this live event will permanently remove its metadata, source deck, and replay settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTargetEvent && (
            <div className="rounded-md border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
              You are about to delete <span className="font-semibold">{deleteTargetEvent.title}</span>.
              This cannot be undone.
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-neutral-700 bg-transparent text-neutral-200 hover:bg-neutral-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-500"
              disabled={!deleteTargetEvent || deletingEventId === deleteTargetEvent?.id}
              onClick={(e) => {
                e.preventDefault();
                if (deleteTargetEvent) {
                  void deleteEvent(deleteTargetEvent);
                }
              }}
            >
              {deleteTargetEvent && deletingEventId === deleteTargetEvent.id ? "Deleting..." : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {cameraGoLiveEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-4">
            <h3 className="text-white text-lg">Go Live with Camera</h3>
            <p className="text-sm text-neutral-400">Preview your camera, then start. No OBS or RTMP setup needed.</p>

            <div className="overflow-hidden rounded-lg border border-neutral-800 bg-black aspect-video">
              <video ref={previewRef} className="h-full w-full object-cover" playsInline autoPlay muted />
            </div>

            {cameraError && <p className="text-sm text-red-400">{cameraError}</p>}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                className="border-neutral-700 text-neutral-200"
                onClick={() => {
                  cleanupBrowserLive();
                  setCameraGoLiveEvent(null);
                }}
                disabled={cameraBusy}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-neutral-700 text-neutral-200"
                onClick={toggleCameraMute}
                disabled={cameraBusy || !browserLiveRef.current?.stream}
              >
                {cameraMuted ? "Unmute" : "Mute"}
              </Button>
              <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white" onClick={startCameraBroadcast} disabled={cameraBusy}>
                {cameraBusy ? "Starting..." : "Start"}
              </Button>
              <Button className="bg-neutral-800 hover:bg-neutral-700 text-white" onClick={() => void stopCameraBroadcast()} disabled={cameraBusy}>
                Stop
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
