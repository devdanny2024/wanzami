'use client';

import Hls from "hls.js";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LiveChatMessage,
  LiveEvent,
  LiveReactionTotal,
  fetchLiveEngagementSnapshot,
  fetchLiveEventById,
  fetchLiveEventByUnlistedSlug,
  sendLiveChatMessage,
  sendLiveReaction,
  sendLiveViewerHeartbeat,
} from "@/lib/contentClient";

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

const reactionPresets = ["❤️", "🔥", "👏", "😂", "🎉"];

export default function LiveDetailPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [reactionTotals, setReactionTotals] = useState<LiveReactionTotal[]>([]);
  const [burstReactions, setBurstReactions] = useState<string[]>([]);
  const [lastEngagementSync, setLastEngagementSync] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<InstanceType<typeof Hls> | null>(null);
  const [availableLevels, setAvailableLevels] = useState<Array<{ index: number; label: string }>>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(-1);
  const [qualityLabel, setQualityLabel] = useState<string>("Auto");
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

        const isNumericId = /^\d+$/.test(params.id);
        const found = isNumericId
          ? await fetchLiveEventById(params.id, token)
          : await fetchLiveEventByUnlistedSlug(params.id, token);
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

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token || !event?.id) return;

    let cancelled = false;

    const sync = async () => {
      try {
        const snapshot = await fetchLiveEngagementSnapshot(event.id, token, lastEngagementSync);
        if (cancelled) return;
        setLastEngagementSync(snapshot.serverTime);
        setMessages((prev) => {
          const next = [...prev, ...snapshot.messages].slice(-200);
          const seen = new Set<string>();
          return next.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          });
        });
        setReactionTotals(snapshot.reactionTotals);
        setBurstReactions(snapshot.recentReactions.map((item) => item.type).slice(0, 12));
      } catch {
        // silent incremental sync errors
      }
    };

    void sync();
    const poll = setInterval(() => void sync(), 2500);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [event?.id, lastEngagementSync]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token || !event?.id || event.status !== "LIVE") return;

    let cancelled = false;

    const pingViewerHeartbeat = async () => {
      try {
        const payload = await sendLiveViewerHeartbeat(event.id, token);
        if (cancelled || typeof payload?.viewerCount !== "number") return;
        setEvent((prev) => (prev ? { ...prev, viewerCount: payload.viewerCount } : prev));
      } catch {
        // non-blocking telemetry ping
      }
    };

    void pingViewerHeartbeat();
    const interval = setInterval(() => {
      void pingViewerHeartbeat();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [event?.id, event?.status]);

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

    setAvailableLevels([]);
    setSelectedLevel(-1);
    setQualityLabel("Auto");

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
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((level, idx) => ({
          index: idx,
          label: level.height ? `${level.height}p` : `${Math.round((level.bitrate || 0) / 1000)}kbps`,
        }));
        setAvailableLevels(levels);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const current = hls.levels[data.level];
        setQualityLabel(data.level < 0 ? "Auto" : current?.height ? `${current.height}p` : "Manual");
      });
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

  const submitChat = async () => {
    if (!event?.id || !chatInput.trim()) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;

    setChatSending(true);
    try {
      const msg = await sendLiveChatMessage(event.id, token, chatInput.trim());
      if (msg) setMessages((prev) => [...prev, msg].slice(-200));
      setChatInput("");
    } catch (err: any) {
      setError(err?.message ?? "Failed to send chat");
    } finally {
      setChatSending(false);
    }
  };

  const emitReaction = async (type: string) => {
    if (!event?.id) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) return;
    setBurstReactions((prev) => [type, ...prev].slice(0, 12));
    try {
      await sendLiveReaction(event.id, token, type);
      setReactionTotals((prev) => {
        const existing = prev.find((x) => x.type === type);
        if (!existing) return [...prev, { type, count: 1 }];
        return prev.map((x) => (x.type === type ? { ...x, count: x.count + 1 } : x));
      });
    } catch {
      // soft fail on tap spam
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24 sm:pt-28">
        <div className="container-page text-muted-foreground">Loading live event...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 sm:pt-28 pb-12">
      <div className="container-page">
      <div className="mb-4">
        <Link href="/live" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Live</Link>
      </div>

      {error && <p className="text-destructive mb-4">{error}</p>}

      {!event ? null : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="font-heading text-3xl sm:text-4xl uppercase tracking-wide leading-tight">{event.title}</h1>
              {event.category ? <p className="text-xs text-muted-foreground mt-1">Category: {event.category}</p> : null}
              {event.description && <p className="text-muted-foreground mt-2 text-sm sm:text-base">{event.description}</p>}
            </div>
            <span
              className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${
                event.status === "LIVE"
                  ? "border-red-500/50 text-red-200 bg-red-500/15"
                  : event.status === "SCHEDULED"
                  ? "border-brand/50 text-brand bg-brand/15"
                  : "border-white/20 text-muted-foreground bg-graphite-2"
              }`}
            >
              {event.status === "LIVE" && <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />}
              {event.status}
            </span>
          </div>

          {event.status === "SCHEDULED" && (
            <div className="mb-4 text-brand text-sm">
              Starts in {formatCountdown(event.scheduledStartAt) ?? "soon"}
            </div>
          )}

          {event.status === "LIVE" && (
            <div className="mb-4 text-red-300 text-sm">● {event.viewerCount ?? 0} watching</div>
          )}

          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div>
              <div className="relative w-full max-w-5xl aspect-video bg-graphite-2 rounded-xl overflow-hidden border border-white/10">
                {primaryPlaybackUrl ? (
                  <video ref={videoRef} controls autoPlay playsInline className="w-full h-full bg-black" />
                ) : event.status === "ENDED" ? (
                  <div className="w-full h-full flex items-center justify-center text-center px-8 text-neutral-300">Live has ended</div>
                ) : event.thumbnailUrl ? (
                  <div className="relative w-full h-full">
                    <Image src={event.thumbnailUrl} alt={event.title} fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-foreground text-sm">
                      Stream is not available yet.
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">Stream is not available yet.</div>
                )}

                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs border border-white/10">Quality: {qualityLabel}</div>
                {burstReactions.length ? (
                  <div className="absolute bottom-3 right-3 flex flex-col gap-1 text-lg">
                    {burstReactions.slice(0, 5).map((icon, idx) => (
                      <span key={`${icon}-${idx}`} className="drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">{icon}</span>
                    ))}
                  </div>
                ) : null}
              </div>

              {availableLevels.length ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Video quality:</span>
                  <select
                    className="bg-graphite border border-white/10 text-foreground rounded-md px-2 py-1.5"
                    value={selectedLevel}
                    onChange={(e) => {
                      const level = Number(e.target.value);
                      setSelectedLevel(level);
                      if (hlsRef.current) {
                        hlsRef.current.currentLevel = level;
                        hlsRef.current.nextLevel = level;
                        hlsRef.current.loadLevel = level;
                      }
                      setQualityLabel(level < 0 ? "Auto" : availableLevels.find((l) => l.index === level)?.label || "Manual");
                    }}
                  >
                    <option value={-1}>Auto</option>
                    {availableLevels.map((l) => (
                      <option key={l.index} value={l.index}>{l.label}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="mt-4 flex gap-2 flex-wrap">
                {reactionPresets.map((item) => {
                  const count = reactionTotals.find((x) => x.type === item)?.count ?? 0;
                  return (
                    <button
                      key={item}
                      onClick={() => void emitReaction(item)}
                      className="min-h-[40px] px-3 py-1.5 rounded-full border border-white/10 bg-graphite hover:bg-graphite-2 hover:border-brand/40 text-sm transition-colors"
                    >
                      {item} {count > 0 ? <span className="text-muted-foreground">{count}</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="border border-white/10 rounded-2xl bg-card p-3 h-[60vh] xl:h-[70vh] flex flex-col">
              <h3 className="font-heading text-base uppercase tracking-wide mb-2">Live chat</h3>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {messages.length === 0 ? <p className="text-xs text-muted-foreground">No messages yet.</p> : null}
                {messages.map((m) => (
                  <div key={m.id} className="text-xs bg-graphite-2 rounded-lg p-2.5">
                    <p className="text-muted-foreground">
                      <span className="text-foreground font-medium">{m.userName}</span>
                      {m.userRole && m.userRole !== "USER" ? <span className="ml-1 text-brand">({m.userRole})</span> : null}
                    </p>
                    <p className="text-foreground/90 mt-0.5 break-words">{m.message}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void submitChat();
                    }
                  }}
                  placeholder="Say something..."
                  maxLength={500}
                  className="flex-1 min-h-[40px] rounded-lg border border-white/10 bg-graphite-2 px-3 py-2 text-sm focus:outline-none focus:border-brand/50"
                />
                <button
                  disabled={chatSending || !chatInput.trim()}
                  onClick={() => void submitChat()}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-brand hover:bg-brand-dark text-primary-foreground font-semibold disabled:opacity-50 transition-colors"
                >
                  Send
                </button>
              </div>
            </aside>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
