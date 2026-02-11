import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

type ReplayStatus = "NONE" | "PENDING_INFRA" | "PROCESSING" | "READY" | "FAILED";

type ReplayDraft = {
  status: ReplayStatus;
  playbackUrl: string;
  note: string;
};

type ViewerDraft = {
  viewerCount: string;
};

type LiveEvent = {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  ingestEndpoint?: string | null;
  playbackUrl?: string | null;
  streamKey?: string | null;
  scheduledStartAt?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  viewerCount?: number;
  replay?: {
    status?: ReplayStatus;
    playbackUrl?: string | null;
    readyAt?: string | null;
    note?: string | null;
  };
};

const statusBadge = (status: LiveEvent["status"]) => {
  switch (status) {
    case "SCHEDULED":
      return "bg-blue-500/20 text-blue-300";
    case "LIVE":
      return "bg-emerald-500/20 text-emerald-300";
    case "ENDED":
      return "bg-neutral-600/30 text-neutral-300";
    default:
      return "bg-neutral-700 text-neutral-200";
  }
};

const replayStatuses: ReplayStatus[] = ["NONE", "PENDING_INFRA", "PROCESSING", "READY", "FAILED"];

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
    } catch (err: any) {
      setError(err?.message ?? "Failed to load live events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
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

  const updateStatus = async (id: string, action: "start" | "end") => {
    try {
      setError(null);
      const res = await adminApiFetch(`/api/admin/live/events/${id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to update event");
      await loadEvents();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update event");
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
                        <Badge className={statusBadge(event.status)}>{event.status}</Badge>
                        <Badge className={replayBadge(event.replay?.status)}>
                          Replay: {event.replay?.status ?? "NONE"}
                        </Badge>
                      </div>
                    </div>

                    {event.description && <p className="text-sm text-neutral-300">{event.description}</p>}

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
                            className="w-48 bg-neutral-950 border-neutral-800 text-white"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => saveViewerCount(event)}
                          disabled={viewerSavingId === event.id}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white"
                        >
                          {viewerSavingId === event.id ? "Saving viewers..." : "Save Viewers"}
                        </Button>
                      </div>
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

                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.status === "SCHEDULED" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(event.id, "start")}
                          className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
                        >
                          Go Live
                        </Button>
                      )}
                      {event.status === "LIVE" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(event.id, "end")}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white"
                        >
                          End Live
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
