'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Download, Users, MonitorPlay, Tv, ChevronRight, Clock } from "lucide-react";
import logo from "@/assets/logo.png";
import { Footer } from "@/components/Footer";
import { StartupSound } from "@/components/StartupSound";
import { fetchTitles, resolveCdnImageUrl, type Title } from "@/lib/contentClient";
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

const logoSrc = (logo as { src?: string }).src ?? (logo as unknown as string);

function Header({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/70 backdrop-blur-md border-b border-white/10 splash-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between inner">
        <div className="flex items-center gap-2 brand">
          <img src={logoSrc} alt="Wanzami" className="w-9 h-9 sm:w-10 sm:h-10" />
          <span className="font-heading text-foreground text-xl tracking-wide brand-name">Wanzami</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 actions">
          <button
            onClick={onLogin}
            className="text-foreground/80 hover:text-foreground transition-colors px-3 sm:px-4 py-2 min-h-[40px]"
          >
            Login
          </button>
          <button
            onClick={onRegister}
            className="bg-brand hover:bg-brand-dark text-black px-4 sm:px-6 py-2 min-h-[40px] rounded-lg transition-colors font-semibold"
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
    <div className="relative min-h-[88vh] flex items-center overflow-hidden splash-hero">
      <div className="absolute inset-0 z-0 hero-bg">
        <ImageWithFallback
          src={backdrop}
          alt={featured?.name ?? "Wanzami featured"}
          className="w-full h-full object-cover scale-105"
        />
        {/* Cinematic left-to-right + bottom fade so text stays legible over any art */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(253,126,20,0.18),transparent_45%)]" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-16 hero-content">
        <div className="max-w-2xl space-y-5 sm:space-y-6">
          {featured && (
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
              {featured.isOriginal ? "Wanzami Original" : "Featured"} · Now streaming
            </div>
          )}
          <h1 className="font-heading text-foreground text-5xl sm:text-6xl md:text-7xl tracking-wide leading-[0.95]">
            {featured?.name ?? "Watch what matters."}
          </h1>
          <p className="text-foreground/90 text-base sm:text-lg">
            Originals, series, films—everywhere you are.
          </p>
          <p className="text-foreground/70 max-w-xl text-sm sm:text-base">
            Personalized recommendations, seamless playback, kid-friendly profiles, and smart downloads. Start your free
            journey in under two minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center cta-row">
            <button
              onClick={onStart}
              className="bg-brand hover:bg-brand-dark text-black px-8 py-4 min-h-[44px] rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand/20 font-semibold"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              Start free
            </button>
            <button
              onClick={onSignIn}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-foreground px-8 py-4 min-h-[44px] rounded-lg border border-white/20 transition-colors"
            >
              Sign in
            </button>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-foreground/80 tag-row">
            <span className="px-3 py-2 rounded-full border border-white/15 bg-black/30">Offline ready</span>
            <span className="px-3 py-2 rounded-full border border-white/15 bg-black/30">Profiles & kids mode</span>
            <span className="px-3 py-2 rounded-full border border-white/15 bg-black/30">Multi-device resume</span>
            <span className="px-3 py-2 rounded-full border border-white/15 bg-black/30">Pay-per-view & originals</span>
          </div>
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
      className="group relative shrink-0 w-32 sm:w-40 md:w-44 snap-start overflow-hidden rounded-xl border border-white/10 bg-card transition-transform duration-200 hover:scale-[1.04] hover:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand"
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
          className={`absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-lg backdrop-blur-sm ${
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
          <h2 className="font-heading text-xl sm:text-2xl tracking-wide text-foreground">{heading}</h2>
          <button
            onClick={onItemClick}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-brand"
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
        <h2 className="mb-3 font-heading text-xl sm:text-2xl tracking-wide text-foreground/80">{heading}</h2>
        <div className="flex gap-3 sm:gap-4 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] w-32 sm:w-40 md:w-44 shrink-0 animate-pulse rounded-xl bg-card" />
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <div className="bg-black pt-12 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-6 splash-features">
      <div className="max-w-6xl mx-auto inner">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center space-y-3 card">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand/10 mb-2 card-icon">
                  <Icon className="w-8 h-8 text-brand" />
                </div>
                <h3 className="font-heading text-foreground text-lg tracking-wide card-title">{feature.title}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed card-text">{feature.description}</p>
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
    <div className="px-4 sm:px-6 pb-20">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand/20 via-card to-black p-8 sm:p-12 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(253,126,20,0.25),transparent_60%)]" />
        <div className="relative space-y-5">
          <h2 className="font-heading text-3xl sm:text-4xl tracking-wide text-foreground">Your next favorite is waiting.</h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-foreground/70">
            Join Wanzami and start streaming originals, series, and films in minutes. No commitment, cancel anytime.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-8 py-4 font-semibold text-black shadow-lg shadow-brand/20 transition-colors hover:bg-brand-dark"
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
    <div className="min-h-screen bg-black text-white relative overflow-hidden splash-root">
      {navigating && (
        <div className="absolute inset-0 z-[70] flex items-start justify-center pointer-events-none">
          <div className="mt-6 px-4 py-3 bg-black/75 border border-white/10 rounded-2xl shadow-lg flex items-center gap-3">
            <div className="w-6 h-6 border-[3px] border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-foreground/80 text-sm">Loading Wanzami…</p>
          </div>
        </div>
      )}
      <StartupSound />
      <Header onLogin={goLogin} onRegister={goRegister} />

      <main className="pb-10">
        <Hero featured={featured} onStart={goRegister} onSignIn={goLogin} />

        <div className="relative z-10 -mt-10 space-y-10 sm:space-y-12">
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
