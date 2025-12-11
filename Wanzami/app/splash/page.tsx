'use client';

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Logo } from "@/components/Logo";

export default function SplashPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0b0b0c] to-black text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-20 top-10 w-96 h-96 bg-[#fd7e14]/15 rounded-full blur-3xl" />
        <div className="absolute right-0 bottom-0 w-[28rem] h-[28rem] bg-[#ff9f4d]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14 md:py-20 flex flex-col gap-12">
        <div className="flex items-center justify-between">
          <Logo size="splash" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 rounded-xl border border-white/15 text-white hover:border-white/40 transition"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/register")}
              className="px-4 py-2 rounded-xl bg-[#fd7e14] text-black font-semibold hover:bg-[#e86f0f] transition"
            >
              Get started
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-semibold leading-tight"
            >
              Watch what matters.
              <br />
              Originals, series, films—everywhere you are.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/70 text-lg"
            >
              Personalized recommendations, seamless playback, kid-friendly profiles, and smart downloads. Start your
              free journey in under two minutes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3 text-sm text-white/80"
            >
              <span className="px-3 py-2 rounded-full border border-white/15">Offline ready</span>
              <span className="px-3 py-2 rounded-full border border-white/15">Profiles & kids mode</span>
              <span className="px-3 py-2 rounded-full border border-white/15">Multi-device resume</span>
              <span className="px-3 py-2 rounded-full border border-white/15">Pay-per-view & originals</span>
            </motion.div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/register")}
                className="px-5 py-3 rounded-xl bg-[#fd7e14] text-black font-semibold hover:bg-[#e86f0f] transition"
              >
                Start free
              </button>
              <button
                onClick={() => router.push("/login")}
                className="px-5 py-3 rounded-xl border border-white/15 text-white hover:border-white/40 transition"
              >
                Sign in
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#111] via-[#0b0b0c] to-[#111] shadow-2xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(253,126,20,0.08),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(255,159,77,0.08),transparent_25%)]" />
            <div className="absolute top-6 left-6">
              <Logo size="medium" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 space-y-3">
              <div className="text-white text-lg font-semibold">Continue Watching</div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-xl bg-white/5 border border-white/10" />
                ))}
              </div>
              <div className="text-white/60 text-sm">Pick up on any device exactly where you left off.</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
