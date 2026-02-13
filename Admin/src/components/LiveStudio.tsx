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
  viewerCount?: number;
  sources?: LiveSource[];
  replay?: {
    status?: ReplayStatus;
    playbackUrl?: string | null;
    note?: string | null;
  };
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

  const selectedEvent = useMemo(() => events.find((e) => e.id === selectedEventId) ?? null, [events, selectedEventId]);
  const previewUrl = useMemo(() => pickPlayablePlaybackUrl(selectedEvent, selectedSourceId || undefined), [selectedEvent, selectedSourceId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApiFetch("/api/admin/live/events");
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to load live events");
      const next = (((res.data as any)?.events ?? []) as LiveEvent[]);
      setEvents(next);
      if (!selectedEventId && next[0]?.id) {
        setSelectedEventId(next[0].id);
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
    // reset selected source if it doesn't exist on newly selected event
    const sources = selectedEvent?.sources ?? [];
    if (selectedSourceId && !sources.some((s) => s.id === selectedSourceId)) {
      setSelectedSourceId("");
    }
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

  const goLive = async () => {
    if (!selectedEvent) return;
    const sourceId = selectedSourceId || selectedEvent.sources?.find((s) => s.isActiveOutput)?.id;
    if (!sourceId) {
      toast.error("Pick a source first");
      return;
    }

    try {
      setError(null);
      // 1) publish if needed
      if (!selectedEvent.isPublished) {
        const pub = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/publish`, {
          method: "PATCH",
          body: JSON.stringify({ isPublished: true }),
        });
        if (!pub.ok) throw new Error((pub.data as any)?.message || "Failed to publish");
      }

      // 2) switch active output (the thing users will see)
      const sw = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/sources/switch`, {
        method: "POST",
        body: JSON.stringify({ sourceId }),
      });
      if (!sw.ok) throw new Error((sw.data as any)?.message || "Failed to switch source");

      // 3) mark event live (B flow)
      const start = await adminApiFetch(`/api/admin/live/events/${selectedEvent.id}/start`, {
        method: "POST",
        body: JSON.stringify({ sourceId }),
      });
      if (!start.ok) throw new Error((start.data as any)?.message || "Failed to go live");

      toast.success("Event is now LIVE");
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
                {previewUrl ? (
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
                      <label className="text-xs text-neutral-500">Preview source</label>
                      <select
                        className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white"
                        value={selectedSourceId}
                        onChange={(e) => setSelectedSourceId(e.target.value)}
                      >
                        <option value="">(Auto)</option>
                        {(selectedEvent.sources ?? []).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} {s.isActiveOutput ? "(ACTIVE)" : ""}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-neutral-500">GO LIVE will use the selected source.</p>
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
                              {selectedEvent.ingestEndpoint ? `rtmps://${selectedEvent.ingestEndpoint}:443/app/` : "Not available"}
                            </span>
                            {selectedEvent.ingestEndpoint ? (
                              <button className="text-[#fd7e14]" onClick={() => copyText(`rtmps://${selectedEvent.ingestEndpoint}:443/app/`)}>
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
                      </div>
                    ) : null}

                    {section === "webcam" ? (
                      <div className="pt-2 border-t border-neutral-800 text-xs text-neutral-400">
                        Webcam broadcasting UI will be moved here next (we already have the working camera flow in CreatorHub).
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
