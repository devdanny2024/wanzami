'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Download, Users, MonitorPlay, Tv, ChevronRight, Clock } from "lucide-react";
import { Footer } from "@/components/Footer";
import { StartupSound } from "@/components/StartupSound";
import { fetchTitles, type Title } from "@/lib/contentClient";
import { getAvailabilityBadge } from "@/lib/availability";

const features = [
  {
    icon: Download,
    title: "Offline ready",
    description: "Download your favorites and watch anywhere, anytime—no internet needed.",
  },
  {
    icon: Users,
    title: "Profiles & kids mode",
    description: "Create personalized profiles for everyone, with safe, age-appropriate content for kids.",
  },
  {
    icon: MonitorPlay,
    title: "Multi-device resume",
    description: "Start on your TV, continue on your phone. Pick up exactly where you left off.",
  },
  {
    icon: Tv,
    title: "Pay-per-view & originals",
    description: "Access exclusive originals and premium content with flexible pay-per-view options.",
  },
];

const POSTER_FALLBACK = "https://placehold.co/600x900/111111/FD7E14?text=Wanzami";
const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80";

const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
  <img src={src} alt={alt} className={className} loading="lazy" />
);

function Header({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cs-paper border-b-[3px] border-cs-ink splash-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between inner">
        <div className="flex flex-col items-start leading-none brand">
          <span className="font-heading text-cs-ink text-2xl tracking-wide brand-name">WANZAMI</span>
          <span className="hidden sm:block font-mono text-[9px] uppercase tracking-[0.2em] text-cs-muted -mt-0.5">
            Production Office
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 actions">
          <button
            onClick={onLogin}
            className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-cs-muted hover:text-cs-ink transition-colors px-3 py-2 min-h-[40px]"
          >
            Login
          </button>
          <button
            onClick={onRegister}
            className="bg-cs-ink text-cs-paper px-4 sm:px-6 py-2 min-h-[40px] font-mono text-xs font-bold uppercase tracking-[0.08em] transition-transform hover:-translate-y-0.5"
          >
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero({
  featured,
  onStart,
  onSignIn,
}: {
  featured: Title | null;
  onStart: () => void;
  onSignIn: () => void;
}) {
  const backdrop = featured?.thumbnailUrl || featured?.posterUrl || HERO_FALLBACK;

  return (
    <div className="splash-hero max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-12">
      <div className="cs-slug mb-4 flex items-center gap-2">
        <span>Call sheet № 001 — INT. Wanzami — always</span>
        <span className="h-px flex-1 bg-cs-line" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center hero-content">
        <div className="space-y-5 sm:space-y-6">
          {featured && (
            <span
              className="inline-block bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-cs-ink cs-shadow-sm"
              style={{ transform: "rotate(-2deg)" }}
            >
              {featured.isOriginal ? "Wanzami Original" : "Featured"} · Now streaming
            </span>
          )}
          <h1 className="font-heading text-cs-ink text-5xl sm:text-6xl md:text-7xl tracking-wide leading-[0.9] uppercase">
            {featured?.name ?? "Watch what matters."}
          </h1>
          <p className="text-cs-ink/80 text-base sm:text-lg max-w-xl">
            Originals, series, films—everywhere you are. Personalized picks, seamless playback, kid-friendly
            profiles, and smart downloads. Start your free journey in under two minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center cta-row">
            <button
              onClick={onStart}
              className="bg-cs-rust text-cs-paper px-8 py-4 min-h-[52px] flex items-center justify-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.07em] cs-shadow transition-transform hover:-translate-y-0.5 active:translate-y-px"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Start free
            </button>
            <button
              onClick={onSignIn}
              className="bg-cs-paper text-cs-ink cs-border px-8 py-4 min-h-[52px] font-mono text-sm font-bold uppercase tracking-[0.07em] transition-colors hover:bg-cs-ink hover:text-cs-paper"
            >
              Sign in
            </button>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 tag-row">
            {["Offline ready", "Profiles & kids mode", "Multi-device resume", "Pay-per-view & originals"].map((t) => (
              <span key={t} className="px-3 py-2 font-mono text-[11px] uppercase tracking-[0.06em] text-cs-muted cs-border-thin">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Featured one-sheet */}
        <div className="cs-border cs-shadow-lg bg-cs-ink overflow-hidden aspect-[16/11] relative">
          <ImageWithFallback
            src={backdrop}
            alt={featured?.name ?? "Wanzami featured"}
            className="w-full h-full object-cover"
          />
          <span className="absolute left-3 top-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cs-paper bg-cs-ink/70 px-2 py-1">
            Reel 01
          </span>
        </div>
      </div>
    </div>
  );
}

function PosterCard({ title, onClick }: { title: Title; onClick: () => void }) {
  const poster = title.posterUrl || title.thumbnailUrl || POSTER_FALLBACK;
  const badge = getAvailabilityBadge(title);
  return (
    <button
      onClick={onClick}
      className="group relative shrink-0 w-32 sm:w-40 md:w-44 snap-start overflow-hidden cs-border-thin bg-cs-ink transition-shadow duration-200 hover:cs-shadow focus:outline-none focus:ring-2 focus:ring-cs-rust"
    >
      <div className="aspect-[2/3] w-full overflow-hidden">
        <ImageWithFallback
          src={poster}
          alt={title.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      {badge && (
        <div
          className={`absolute top-2 left-2 z-10 inline-flex items-center gap-1 border border-white/70 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide shadow-lg ${
            badge.kind === "COMING_SOON" ? "bg-sky-500/90 text-white" : "bg-rose-500/90 text-white"
          }`}
        >
          <Clock className="h-2.5 w-2.5" />
          {badge.label}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 p-2 text-left opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
        <p className="line-clamp-2 text-xs font-semibold text-white">{title.name}</p>
        {title.isOriginal && <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Original</span>}
      </div>
    </button>
  );
}

function PosterRail({ heading, items, onItemClick }: { heading: string; items: Title[]; onItemClick: () => void }) {
  if (items.length === 0) return null;
  return (
    <section className="splash-rail">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-xl sm:text-2xl tracking-wide text-cs-ink uppercase">
            <span className="inline-block h-3 w-3 bg-cs-rust" aria-hidden="true" />
            {heading}
          </h2>
          <button
            onClick={onItemClick}
            className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.08em] text-cs-muted transition-colors hover:text-cs-rust"
          >
            See all <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1">
          {items.map((title) => (
            <PosterCard key={title.id} title={title} onClick={onItemClick} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RailSkeleton({ heading }: { heading: string }) {
  return (
    <section className="splash-rail">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="mb-3 font-heading text-xl sm:text-2xl tracking-wide text-cs-ink/70 uppercase">{heading}</h2>
        <div className="flex gap-3 sm:gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] w-32 sm:w-40 md:w-44 shrink-0 animate-pulse cs-border-thin bg-cs-panel" />
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <div className="border-y-[3px] border-cs-ink bg-cs-panel pt-12 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-6 splash-features">
      <div className="max-w-6xl mx-auto inner">
        <p className="cs-slug mb-8">Scene 02 — the kit</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-cs-paper cs-border cs-shadow-sm p-5 space-y-3 card">
                <div className="inline-flex items-center justify-center w-14 h-14 cs-border-thin card-icon">
                  <Icon className="w-7 h-7 text-cs-rust" />
                </div>
                <h3 className="font-heading text-cs-ink text-lg tracking-wide uppercase card-title">{feature.title}</h3>
                <p className="text-cs-muted text-sm leading-relaxed card-text">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FinalCta({ onStart }: { onStart: () => void }) {
  return (
    <div className="px-4 sm:px-6 py-20">
      <div className="relative mx-auto max-w-5xl overflow-hidden cs-border cs-shadow-lg bg-cs-paper p-8 sm:p-12 text-center">
        <p className="cs-slug mb-4">Cut to: you. Sign the slate.</p>
        <div className="relative space-y-5">
          <h2 className="font-heading text-4xl sm:text-5xl tracking-wide text-cs-ink uppercase">
            Your next favorite is <span className="text-cs-rust">waiting.</span>
          </h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-cs-muted">
            Join Wanzami and start streaming originals, series, and films in minutes. No commitment, cancel anytime.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-cs-rust px-8 py-4 font-mono text-sm font-bold uppercase tracking-[0.07em] text-cs-paper cs-shadow transition-transform hover:-translate-y-0.5"
          >
            <Play className="h-5 w-5" fill="currentColor" />
            Start free
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SplashPage() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const country = typeof window !== "undefined" ? localStorage.getItem("countryCode") : null;
        const data = await fetchTitles(country ?? "NG");
        if (!mounted) return;
        setTitles(data.filter((t) => !t.archived && (t.posterUrl || t.thumbnailUrl)));
      } catch {
        // Landing still works without live catalog — hero + features carry it.
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { featured, trending, originals, newReleases } = useMemo(() => {
    const originalsList = titles.filter((t) => t.isOriginal);
    const byRecency = [...titles].sort(
      (a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
    );
    const heroPick = originalsList.find((t) => t.thumbnailUrl) ?? titles.find((t) => t.thumbnailUrl) ?? titles[0] ?? null;
    return {
      featured: heroPick,
      trending: titles.slice(0, 18),
      originals: originalsList.slice(0, 18),
      newReleases: byRecency.slice(0, 18),
    };
  }, [titles]);

  const goRegister = () => {
    setNavigating(true);
    router.push("/register");
  };
  const goLogin = () => {
    setNavigating(true);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root relative overflow-hidden splash-root">
      {navigating && (
        <div className="absolute inset-0 z-[70] flex items-start justify-center pointer-events-none">
          <div className="mt-6 px-4 py-3 bg-cs-paper cs-border cs-shadow flex items-center gap-3">
            <div className="w-6 h-6 border-[3px] border-cs-rust border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-cs-muted">Loading Wanzami…</p>
          </div>
        </div>
      )}
      <StartupSound />
      <Header onLogin={goLogin} onRegister={goRegister} />

      <main className="pb-10">
        <Hero featured={featured} onStart={goRegister} onSignIn={goLogin} />

        <div className="relative z-10 space-y-10 sm:space-y-12">
          {loading ? (
            <>
              <RailSkeleton heading="Trending now" />
              <RailSkeleton heading="Wanzami Originals" />
            </>
          ) : (
            <>
              <PosterRail heading="Trending now" items={trending} onItemClick={goRegister} />
              <PosterRail heading="Wanzami Originals" items={originals} onItemClick={goRegister} />
              <PosterRail heading="New & noteworthy" items={newReleases} onItemClick={goRegister} />
            </>
          )}
        </div>

        <div className="mt-16">
          <Features />
        </div>
        <FinalCta onStart={goRegister} />
      </main>

      <Footer />
    </div>
  );
}
