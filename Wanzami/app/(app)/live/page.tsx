'use client';

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchLiveEvents, LiveEvent } from "@/lib/contentClient";

function formatCountdown(targetIso?: string | null) {
  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - Date.now();
  if (diff <= 0) return "Starting soon";

  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function LivePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => tick((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const load = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);
        setError(null);
        const data = await fetchLiveEvents(token);
        setEvents(data ?? []);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load live events");
      } finally {
        if (!isBackground) setLoading(false);
      }
    };

    void load();

    const refreshTimer = setInterval(() => {
      void load(true);
    }, 30000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void load(true);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const sorted = useMemo(() => {
    const rank = (e: LiveEvent) => (e.status === "LIVE" ? 0 : e.status === "SCHEDULED" ? 1 : 2);
    return [...events].sort((a, b) => {
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      const at = new Date(a.scheduledStartAt || a.createdAt || 0).getTime();
      const bt = new Date(b.scheduledStartAt || b.createdAt || 0).getTime();
      return at - bt;
    });
  }, [events]);

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 sm:pt-28 pb-12">
      <div className="container-page">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs uppercase tracking-[0.2em] text-red-400">Live</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wide text-foreground">Live</h1>
          <p className="mt-2 text-sm text-muted-foreground">Now streaming, upcoming events, and recent replays.</p>
        </div>

        {loading && <p className="text-muted-foreground">Loading live events...</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && sorted.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-card p-10 text-center">
            <p className="text-muted-foreground">No live events yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((event) => {
            const isLive = event.status === "LIVE";
            const isScheduled = event.status === "SCHEDULED";
            const countdown = isScheduled ? formatCountdown(event.scheduledStartAt) : null;

            return (
              <Link
                key={event.id}
                href={`/live/${event.id}`}
                className="group flex flex-col rounded-2xl border border-white/10 bg-card hover:border-brand/40 hover:bg-graphite-2 p-3 sm:p-4 transition-colors"
              >
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-graphite-2">
                  {event.thumbnailUrl ? (
                    <Image
                      src={event.thumbnailUrl}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No thumbnail</div>
                  )}
                  <span
                    className={`absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full border backdrop-blur-sm ${
                      isLive
                        ? "border-red-500/50 text-red-200 bg-red-500/20"
                        : isScheduled
                        ? "border-brand/50 text-brand bg-brand/15"
                        : "border-white/20 text-muted-foreground bg-black/50"
                    }`}
                  >
                    {isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />}
                    {isLive ? "Live" : isScheduled ? "Scheduled" : "Ended"}
                  </span>
                </div>

                <h3 className="mt-3 font-heading text-lg sm:text-xl uppercase tracking-wide text-foreground group-hover:text-brand transition-colors line-clamp-1">
                  {event.title}
                </h3>

                {event.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}

                <div className="mt-3">
                  {isScheduled && (
                    <p className="text-xs text-brand">{countdown ? `Starts in ${countdown}` : "Scheduled"}</p>
                  )}

                  {isLive && (
                    <p className="text-xs text-red-300">● Live now{typeof event.viewerCount === "number" ? ` · ${event.viewerCount} watching` : ""}</p>
                  )}

                  {event.status === "ENDED" && (
                    <p className="text-xs text-muted-foreground">
                      Replay: {event.replay?.status === "READY" ? "available" : "processing / pending"}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
