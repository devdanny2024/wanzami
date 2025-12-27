'use client';

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Play, Download, Users, MonitorPlay, Tv } from "lucide-react";
import logo from "@/assets/logo.png";
import { Footer } from "@/components/Footer";
import { StartupSound } from "@/components/StartupSound";

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={(logo as { src?: string }).src ?? (logo as unknown as string)}
            alt="Wanzami"
            className="w-10 h-10"
          />
          <span className="text-white text-lg font-semibold">Wanzami</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onLogin}
            className="text-white/80 hover:text-white transition-colors px-4 py-2"
          >
            Login
          </button>
          <button
            onClick={onRegister}
            className="bg-[#fd7e14] hover:bg-[#e86f0f] text-black px-6 py-2 rounded-lg transition-colors font-semibold"
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"
          alt="Streaming worlds collide"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(253,126,20,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.08),transparent_30%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
        <h1 className="text-white text-4xl md:text-5xl font-semibold leading-tight">
          Watch what matters.
        </h1>
        <p className="text-white/90 text-lg">
          Originals, series, films—everywhere you are.
        </p>
        <p className="text-white/70 max-w-2xl mx-auto">
          Personalized recommendations, seamless playback, kid-friendly profiles, and smart downloads. Start your free
          journey in under two minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onStart}
            className="bg-[#fd7e14] hover:bg-[#e86f0f] text-black px-8 py-4 rounded-lg flex items-center gap-2 transition-colors shadow-lg font-semibold"
          >
            <Play className="w-5 h-5" fill="currentColor" />
            Start free
          </button>
          <button
            onClick={onSignIn}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-lg border border-white/20 transition-colors"
          >
            Sign in
          </button>
        </div>

        <div className="flex flex-wrap gap-3 justify-center text-sm text-white/80">
          <span className="px-3 py-2 rounded-full border border-white/15">Offline ready</span>
          <span className="px-3 py-2 rounded-full border border-white/15">Profiles & kids mode</span>
          <span className="px-3 py-2 rounded-full border border-white/15">Multi-device resume</span>
          <span className="px-3 py-2 rounded-full border border-white/15">Pay-per-view & originals</span>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

function Features() {
  return (
    <div className="bg-black py-20 px-6 mt-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#fd7e14]/10 mb-2">
                  <Icon className="w-8 h-8 text-[#fd7e14]" />
                </div>
                <h3 className="text-white text-lg font-semibold">{feature.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
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

  return (
    <div className="min-h-screen bg-black text-white">
      <StartupSound />
      <Header onLogin={() => router.push("/login")} onRegister={() => router.push("/register")} />
      <main className="pb-20">
        <Hero onStart={() => router.push("/register")} onSignIn={() => router.push("/login")} />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
