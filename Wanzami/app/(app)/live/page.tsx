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
    <div className="min-h-screen bg-cs-paper text-cs-ink pt-24 sm:pt-28 pb-12">
      <div className="container-page">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-cs-rust">Live</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wide text-cs-ink">Live</h1>
          <p className="mt-2 text-sm text-cs-muted">Now streaming, upcoming events, and recent replays.</p>
        </div>

        {loading && <p className="text-cs-muted">Loading live events...</p>}
        {error && <p className="text-cs-rust">{error}</p>}

        {!loading && sorted.length === 0 && (
          <div className="cs-border bg-cs-panel p-10 text-center">
            <p className="text-cs-muted">No live events yet.</p>
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
                className="group flex flex-col cs-border-thin bg-cs-panel hover:cs-shadow p-3 sm:p-4 transition-shadow"
              >
                <div className="relative w-full aspect-video overflow-hidden bg-cs-ink cs-border-thin">
                  {event.thumbnailUrl ? (
                    <Image
                      src={event.thumbnailUrl}
                      alt={event.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-mono text-xs text-cs-paper/50 uppercase tracking-wide">No thumbnail</div>
                  )}
                  <span
                    className={`absolute top-2 left-2 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wide px-2 py-1 border border-white/70 ${
                      isLive
                        ? "text-white bg-red-500/90"
                        : isScheduled
                        ? "text-cs-ink bg-brand"
                        : "text-white bg-black/60"
                    }`}
                  >
                    {isLive && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                    {isLive ? "Live" : isScheduled ? "Scheduled" : "Ended"}
                  </span>
                </div>

                <h3 className="mt-3 font-heading text-lg sm:text-xl uppercase tracking-wide text-cs-ink group-hover:text-cs-rust transition-colors line-clamp-1">
                  {event.title}
                </h3>

                {event.description && <p className="text-xs text-cs-muted mt-1 line-clamp-2">{event.description}</p>}

                <div className="mt-3">
                  {isScheduled && (
                    <p className="font-mono text-xs text-cs-rust">{countdown ? `Starts in ${countdown}` : "Scheduled"}</p>
                  )}

                  {isLive && (
                    <p className="font-mono text-xs text-cs-rust">● Live now{typeof event.viewerCount === "number" ? ` · ${event.viewerCount} watching` : ""}</p>
                  )}

                  {event.status === "ENDED" && (
                    <p className="text-xs text-cs-muted">
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
