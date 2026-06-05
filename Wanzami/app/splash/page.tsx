'use client';

import { useRouter } from "next/navigation";
import { Play, Download, Users, MonitorPlay, Tv } from "lucide-react";
import logo from "@/assets/logo.png";
import { Footer } from "@/components/Footer";
import { StartupSound } from "@/components/StartupSound";
import { useState } from "react";

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

const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
  <img src={src} alt={alt} className={className} />
);

function Header({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10 splash-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between inner">
        <div className="flex items-center gap-2 brand">
          <img
            src={(logo as { src?: string }).src ?? (logo as unknown as string)}
            alt="Wanzami"
            className="w-9 h-9 sm:w-10 sm:h-10"
          />
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

function Hero({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden splash-hero">
      <div className="absolute inset-0 z-0 hero-bg">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"
          alt="Streaming worlds collide"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black/90 hero-overlay" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(253,126,20,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_30%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5 sm:space-y-6 hero-content">
        <h1 className="font-heading text-foreground text-4xl sm:text-5xl md:text-6xl tracking-wide leading-none">
          Watch what matters.
        </h1>
        <p className="text-foreground/90 text-base sm:text-lg">
          Originals, series, films—everywhere you are.
        </p>
        <p className="text-foreground/70 max-w-2xl mx-auto text-sm sm:text-base">
          Personalized recommendations, seamless playback, kid-friendly profiles, and smart downloads. Start your free
          journey in under two minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center cta-row">
          <button
            onClick={onStart}
            className="bg-brand hover:bg-brand-dark text-black px-8 py-4 min-h-[44px] rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg font-semibold"
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

        <div className="flex flex-wrap gap-2 sm:gap-3 justify-center text-xs sm:text-sm text-foreground/80 tag-row">
          <span className="px-3 py-2 rounded-full border border-white/15">Offline ready</span>
          <span className="px-3 py-2 rounded-full border border-white/15">Profiles & kids mode</span>
          <span className="px-3 py-2 rounded-full border border-white/15">Multi-device resume</span>
          <span className="px-3 py-2 rounded-full border border-white/15">Pay-per-view & originals</span>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 splash-scroll-indicator">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <div className="bg-black pt-12 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-6 mt-12 splash-features">
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

export default function SplashPage() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

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
      <Header
        onLogin={() => {
          setNavigating(true);
          router.push("/login");
        }}
        onRegister={() => {
          setNavigating(true);
          router.push("/register");
        }}
      />
      <main className="pb-20">
        <Hero
          onStart={() => {
            setNavigating(true);
            router.push("/register");
          }}
          onSignIn={() => {
            setNavigating(true);
            router.push("/login");
          }}
        />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
