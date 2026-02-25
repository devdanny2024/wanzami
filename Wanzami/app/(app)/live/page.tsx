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
    <div className="min-h-screen bg-black text-white px-4 md:px-12 lg:px-16 pt-28 pb-10">
      <div className="mb-6">
        <h1 className="text-3xl mb-2">Live</h1>
        <p className="text-neutral-400">Now streaming, upcoming events, and recent replays.</p>
      </div>

      {loading && <p className="text-neutral-400">Loading live events...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && sorted.length === 0 && <p className="text-neutral-400">No live events yet.</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((event) => {
          const isLive = event.status === "LIVE";
          const isScheduled = event.status === "SCHEDULED";
          const countdown = isScheduled ? formatCountdown(event.scheduledStartAt) : null;

          return (
            <Link
              key={event.id}
              href={`/live/${event.id}`}
              className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition-colors"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white group-hover:text-[#fd7e14] transition-colors">{event.title}</h3>
                <span
                  className={`text-[10px] px-2 py-1 rounded-full border ${
                    isLive
                      ? "border-red-500/40 text-red-300 bg-red-500/10"
                      : isScheduled
                      ? "border-blue-500/40 text-blue-300 bg-blue-500/10"
                      : "border-neutral-500/40 text-neutral-300 bg-neutral-500/10"
                  }`}
                >
                  {isLive ? "LIVE" : isScheduled ? "SCHEDULED" : "ENDED"}
                </span>
              </div>

              <div className="mt-3 relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-900">
                {event.thumbnailUrl ? (
                  <Image src={event.thumbnailUrl} alt={event.title} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">No thumbnail</div>
                )}
              </div>

              {event.description && <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{event.description}</p>}

              {isScheduled && (
                <p className="text-xs text-blue-300 mt-3">{countdown ? `Starts in ${countdown}` : "Scheduled"}</p>
              )}

              {isLive && (
                <p className="text-xs text-red-300 mt-3">● Live now{typeof event.viewerCount === "number" ? ` · ${event.viewerCount} watching` : ""}</p>
              )}

              {event.status === "ENDED" && (
                <p className="text-xs text-neutral-300 mt-3">
                  Replay: {event.replay?.status === "READY" ? "available" : "processing / pending"}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
