'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { ArrowRight, Check, Clapperboard, Coins, Film, Search } from "lucide-react";
import { completeOnboarding, fetchMe, getCreatorTokens, type CreatorProfile } from "@/lib/creatorClient";

const INK = "#161310";
const PAPER = "#f2ead9";
const PANEL = "#f7f1e3";
const RUST = "#d1490f";

type Step = 0 | 1 | 2;

// The marquee CSS animates to translateX(-50%), so it only loops seamlessly
// if the track holds two identical copies back to back (same trick the
// /creators film-strip reel uses) — a single row would jump on each cycle.
function SprocketRow() {
  return (
    <div aria-hidden="true" className="flex shrink-0 gap-2 px-1.5">
      {Array.from({ length: 24 }).map((_, i) => (
        <span key={i} className="h-3 w-2 rounded-[2px]" style={{ backgroundColor: PAPER }} />
      ))}
    </div>
  );
}

function SprocketStrip({ reverse = false }: { reverse?: boolean }) {
  return (
    <div className={reverse ? "creators-marquee-reverse" : "creators-marquee"}>
      <div className="flex w-max">
        <SprocketRow />
        <SprocketRow />
      </div>
    </div>
  );
}

function StepDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {[0, 1, 2].map((s) => (
        <div key={s} className="relative h-2.5 w-2.5 rounded-full" style={{ border: `1.5px solid ${INK}` }}>
          {s <= step && (
            <motion.div
              layoutId="onboarding-dot"
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: RUST }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const fadeSlide: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: "easeIn" } },
};

const stagger: Variants = {
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const cardIn: Variants = {
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

const HOW_IT_WORKS = [
  { n: "01", t: "Submit", d: "Upload your film from the dashboard, any time.", icon: Film },
  { n: "02", t: "Review", d: "We watch it ourselves. No bots, no forms, no waiting three years for a note.", icon: Search },
  { n: "03", t: "Release", d: "Approved films go live with your price, your countries, your date.", icon: Clapperboard },
  { n: "04", t: "Get paid", d: "Every buy tracked. Every payout in naira.", icon: Coins },
];

export default function CreatorOnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(0);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const { accessToken } = getCreatorTokens();
    if (!accessToken) {
      router.replace("/creators/login");
      return;
    }
    fetchMe()
      .then((me) => {
        if (me.onboarded) {
          router.replace("/creators/dashboard");
          return;
        }
        setProfile(me);
        setLoading(false);
      })
      .catch(() => router.replace("/creators/login"));
  }, [router]);

  const finish = async () => {
    setFinishing(true);
    try {
      await completeOnboarding();
    } catch {
      // Dashboard re-checks onboarded status on load; worst case they land
      // back here and finish again. Never block the door on this call.
    } finally {
      router.replace("/creators/dashboard");
    }
  };

  const firstName = profile?.name.split(" ")[0] ?? "there";

  if (loading) {
    return (
      <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-widest">Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen flex flex-col">
      <div className="border-b-[3px] overflow-hidden py-2.5" style={{ backgroundColor: INK, borderColor: INK }}>
        <SprocketStrip />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step-0" variants={fadeSlide} initial="initial" animate="animate" exit="exit" className="text-center">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.1 } }}
                  className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6b5f4d]"
                >
                  Wanzami Pictures &middot; Crew sign-in
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
                  className="mt-4 font-heading text-5xl uppercase leading-[0.9] tracking-wide sm:text-7xl"
                >
                  Welcome to the crew,
                  <br />
                  <span style={{ color: RUST }}>{firstName}.</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.5 } }}
                  className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-[#3c342a]"
                >
                  Your account is live already, no waiting on us. Here&rsquo;s how the studio floor works before
                  you upload your first film.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.4 } }}
                  className="mt-10"
                >
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold shadow-[5px_5px_0_#161310] transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: RUST, color: PAPER }}
                  >
                    Show me around
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </motion.div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step-1" variants={fadeSlide} initial="initial" animate="animate" exit="exit">
                <div className="text-center">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#6b5f4d]">Scene 01 &mdash; the shoot</p>
                  <h2 className="mt-2 font-heading text-4xl uppercase tracking-wide sm:text-5xl">How it works</h2>
                </div>

                <motion.div
                  variants={stagger}
                  initial="initial"
                  animate="animate"
                  className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2"
                >
                  {HOW_IT_WORKS.map((s) => {
                    const Icon = s.icon;
                    return (
                      <motion.div
                        key={s.n}
                        variants={cardIn}
                        className="border-[2.5px] p-5 shadow-[4px_4px_0_#161310]"
                        style={{ borderColor: INK, backgroundColor: PANEL }}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center border-2 font-heading text-lg"
                            style={{ borderColor: INK }}
                          >
                            {s.n}
                          </span>
                          <Icon className="h-5 w-5" style={{ color: RUST }} />
                          <p className="font-bold uppercase tracking-wide">{s.t}</p>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-[#3c342a]">{s.d}</p>
                      </motion.div>
                    );
                  })}
                </motion.div>

                <div className="mt-10 flex justify-center gap-4">
                  <button
                    onClick={() => setStep(0)}
                    className="px-6 py-3 text-sm font-bold uppercase tracking-wider border-[2.5px] transition-colors hover:bg-[#161310] hover:text-[#f2ead9]"
                    style={{ borderColor: INK }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold uppercase tracking-wider shadow-[4px_4px_0_#161310] transition-transform hover:-translate-y-0.5"
                    style={{ backgroundColor: RUST, color: PAPER }}
                  >
                    Got it
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step-2" variants={fadeSlide} initial="initial" animate="animate" exit="exit" className="text-center">
                <motion.div
                  initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ backgroundColor: RUST }}
                >
                  <Check className="h-10 w-10" style={{ color: PAPER }} />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
                  className="mt-6 font-heading text-4xl uppercase tracking-wide sm:text-5xl"
                >
                  You&rsquo;re set, {firstName}.
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }}
                  className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#3c342a]"
                >
                  Your dashboard is where you&rsquo;ll upload films, track review status, and watch the numbers
                  once something&rsquo;s live.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                  className="mt-10"
                >
                  <button
                    onClick={finish}
                    disabled={finishing}
                    className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold shadow-[5px_5px_0_#161310] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ backgroundColor: INK, color: PAPER }}
                  >
                    {finishing ? "Taking you in…" : "Go to my dashboard"}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-14">
            <StepDots step={step} />
          </div>
        </div>
      </main>

      <div className="border-t-[3px] overflow-hidden py-2.5" style={{ backgroundColor: INK, borderColor: INK }}>
        <SprocketStrip reverse />
      </div>
    </div>
  );
}
