'use client';

import Hls from "hls.js";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { LiveEvent, fetchLiveEventById } from "@/lib/contentClient";

function formatCountdown(targetIso?: string | null) {
  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - Date.now();
  if (diff <= 0) return "Starting soon";
  const sec = Math.floor(diff / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function LiveDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<InstanceType<typeof Hls> | null>(null);
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

    let cancelled = false;

    const load = async (background = false) => {
      try {
        if (!background) setLoading(true);
        if (!background) setError(null);

        const found = await fetchLiveEventById(params.id, token);
        if (cancelled) return;

        if (!found) {
          setError("Live event not found");
          setEvent(null);
        } else {
          setEvent(found);
          if (!background) setError(null);
        }
      } catch (err: any) {
        if (cancelled) return;
        if (!background) {
          setError(err?.message ?? "Failed to load live event");
        }
      } finally {
        if (!background && !cancelled) setLoading(false);
      }
    };

    void load(false);
    const refresh = setInterval(() => {
      void load(true);
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(refresh);
    };
  }, [params.id]);

  const primaryPlaybackUrl = useMemo(() => {
    if (!event) return null;
    if (event.status === "LIVE") return event.playbackUrl ?? null;
    if (event.status === "ENDED" && event.replay?.status === "READY") {
      return event.replay.playbackUrl ?? null;
    }
    return null;
  }, [event]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!primaryPlaybackUrl) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      return;
    }

    const src = primaryPlaybackUrl;
    const isHls = src.toLowerCase().includes(".m3u8");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hlsRef.current = hls;
    } else {
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [primaryPlaybackUrl]);

  if (loading) {
    return <div className="min-h-screen bg-black text-white px-4 md:px-12 pt-28">Loading live event...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 md:px-12 lg:px-16 pt-28 pb-10">
      <div className="mb-4">
        <Link href="/live" className="text-sm text-neutral-400 hover:text-white">← Back to Live</Link>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {!event ? null : (
        <>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h1 className="text-3xl font-semibold">{event.title}</h1>
              {event.description && <p className="text-neutral-400 mt-2">{event.description}</p>}
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${
                event.status === "LIVE"
                  ? "border-red-500/40 text-red-300 bg-red-500/10"
                  : event.status === "SCHEDULED"
                  ? "border-blue-500/40 text-blue-300 bg-blue-500/10"
                  : "border-neutral-500/40 text-neutral-300 bg-neutral-500/10"
              }`}
            >
              {event.status}
            </span>
          </div>

          {event.status === "SCHEDULED" && (
            <div className="mb-4 text-blue-300 text-sm">
              Starts in {formatCountdown(event.scheduledStartAt) ?? "soon"}
            </div>
          )}

          {event.status === "LIVE" && (
            <div className="mb-4 text-red-300 text-sm">
              ● Live now{typeof event.viewerCount === "number" ? ` · ${event.viewerCount} watching` : ""}
            </div>
          )}

          <div className="relative w-full max-w-5xl aspect-video bg-neutral-900 rounded-xl overflow-hidden">
            {primaryPlaybackUrl ? (
              <video ref={videoRef} controls autoPlay playsInline className="w-full h-full bg-black" />
            ) : event.status === "ENDED" ? (
              <div className="w-full h-full flex items-center justify-center text-center px-8">
                <div>
                  <p className="text-lg text-white mb-2">Replay not ready yet</p>
                  <p className="text-sm text-neutral-400">
                    {event.replay?.note || "Replay metadata is created. Recording/processing infra is still pending."}
                  </p>
                </div>
              </div>
            ) : event.thumbnailUrl ? (
              <div className="relative w-full h-full">
                <Image src={event.thumbnailUrl} alt={event.title} fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-neutral-200 text-sm">
                  Stream is not available yet.
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400">
                Stream is not available yet.
              </div>
            )}
          </div>

          {event.status === "ENDED" && (
            <div className="mt-4 text-xs text-neutral-400">
              Replay status: <span className="text-white">{event.replay?.status ?? "NONE"}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
