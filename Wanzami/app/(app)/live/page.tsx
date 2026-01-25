'use client';

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { fetchLiveEvents, LiveEvent } from "@/lib/contentClient";

export default function LivePage() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LiveEvent | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<InstanceType<typeof Hls> | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchLiveEvents(token);
        setEvents(data ?? []);
        setSelected((prev) => prev ?? (data?.[0] ?? null));
      } catch (err: any) {
        setError(err?.message ?? "Failed to load live events");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const src = selected?.playbackUrl;
    if (!src) return;

    const isHls = src.toLowerCase().includes(".m3u8");
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = src;
    }
  }, [selected?.playbackUrl]);

  return (
    <div className="min-h-screen bg-black text-white px-4 md:px-12 lg:px-16 pt-28 pb-10">
      <h1 className="text-3xl mb-2">Live</h1>
      <p className="text-neutral-400 mb-6">Watch live events and streams.</p>

      {loading && <p className="text-neutral-400">Loading live events...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {selected?.playbackUrl ? (
        <div className="relative w-full max-w-5xl aspect-video bg-neutral-900 rounded-xl overflow-hidden">
          <video ref={videoRef} controls autoPlay playsInline className="w-full h-full bg-black" />
        </div>
      ) : (
        !loading && <p className="text-neutral-400">No live stream is active yet.</p>
      )}

      {events.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelected(event)}
              className={`text-left p-4 rounded-xl border ${
                selected?.id === event.id
                  ? "border-[#fd7e14] bg-[#fd7e14]/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              } transition-colors`}
            >
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">{event.title}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    event.status === "LIVE"
                      ? "border-red-500/40 text-red-300 bg-red-500/10"
                      : "border-blue-500/40 text-blue-300 bg-blue-500/10"
                  }`}
                >
                  {event.status === "LIVE" ? "Live" : "Scheduled"}
                </span>
              </div>
              {event.description && <p className="text-xs text-neutral-400 mt-2 line-clamp-2">{event.description}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
