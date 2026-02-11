import { useEffect, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

type ReplayStatus = "NONE" | "PENDING_INFRA" | "PROCESSING" | "READY" | "FAILED";

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
  const [scheduledStartAt, setScheduledStartAt] = useState("");

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApiFetch("/api/admin/live/events");
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to load live events");
      setEvents(((res.data as any)?.events ?? []) as LiveEvent[]);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load live events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

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

      const res = await adminApiFetch("/api/admin/live/events", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          scheduledStartAt: normalizedScheduledStart,
        }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to create event");
      setTitle("");
      setDescription("");
      setThumbnailUrl("");
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
            placeholder="Thumbnail URL"
            className="bg-neutral-950 border-neutral-800 text-white"
          />
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
                      {event.replay?.note && <p className="text-xs text-orange-300">{event.replay.note}</p>}
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
