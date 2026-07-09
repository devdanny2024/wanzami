'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Check, Instagram, Users, Search, Tv, Youtube, Radio, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";
import { TopLoader } from "@/components/TopLoader";

type Step = 1 | 2;

type FormState = {
  preferredGenres: Record<string, number>;
  heardFrom: string;
  heardOther: string;
};

const GENRES = [
  "Action",
  "Comedy",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Documentary",
  "Animation",
  "Fantasy",
  "Mystery",
  "Adventure",
];

function GenresStep({
  selectedGenres,
  onUpdate,
  onNext,
}: {
  selectedGenres: Record<string, number>;
  onUpdate: (genres: Record<string, number>) => void;
  onNext: () => void;
}) {
  const selectedCount = Object.keys(selectedGenres).length;

  const handleGenreClick = (genre: string) => {
    const isSelected = selectedGenres[genre];
    if (isSelected) {
      const { [genre]: _removed, ...rest } = selectedGenres;
      onUpdate(rest);
    } else {
      onUpdate({ ...selectedGenres, [genre]: 1 });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl tracking-wide leading-none text-cs-ink uppercase mb-2">Choose your favorite genres</h2>
        <p className="text-cs-muted">Select all the genres you enjoy watching</p>
        {selectedCount > 0 && (
          <p className="text-cs-rust mt-2 font-mono text-xs uppercase tracking-[0.08em]">
            {selectedCount} {selectedCount === 1 ? "genre" : "genres"} selected
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {GENRES.map((genre) => {
          const isSelected = !!selectedGenres[genre];
          return (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              className={`relative p-5 transition-all text-left ${
                isSelected
                  ? "bg-brand cs-border cs-shadow-sm"
                  : "bg-cs-paper cs-border-thin hover:cs-shadow-sm"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 bg-cs-ink rounded-full p-1">
                  <Check className="w-4 h-4 text-cs-paper" />
                </div>
              )}
              <p className={`text-center font-mono text-sm font-bold uppercase tracking-[0.06em] ${isSelected ? "text-cs-ink" : "text-cs-ink"}`}>{genre}</p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          className="bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] px-8 py-3 cs-shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function DiscoveryStep({
  source,
  otherText,
  onUpdateSource,
  onUpdateOther,
  onComplete,
  onBack,
}: {
  source: string;
  otherText: string;
  onUpdateSource: (val: string) => void;
  onUpdateOther: (val: string) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const sources = [
    { id: "social", label: "Social Media", icon: Instagram },
    { id: "friend", label: "Friend or Family", icon: Users },
    { id: "search", label: "Search Engine", icon: Search },
    { id: "ad", label: "Advertisement", icon: Tv },
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "podcast", label: "Podcast", icon: Radio },
    { id: "article", label: "Article or Blog", icon: Facebook },
    { id: "other", label: "Other", icon: Twitter },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl tracking-wide leading-none text-cs-ink uppercase mb-2">How did you hear about us?</h2>
        <p className="text-cs-muted">Help us understand how you discovered Wanzami</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {sources.map((item) => {
          const Icon = item.icon;
          const isSelected = source === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onUpdateSource(item.id)}
              className={`p-6 transition-all ${
                isSelected
                  ? "bg-brand cs-border cs-shadow-sm"
                  : "bg-cs-paper cs-border-thin hover:cs-shadow-sm"
              }`}
            >
              <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? "text-cs-ink" : "text-cs-muted"}`} />
              <p className={`text-center font-mono text-xs font-bold uppercase tracking-[0.06em] text-cs-ink`}>{item.label}</p>
            </button>
          );
        })}
      </div>

      {source === "other" && (
        <div className="mb-8">
          <label htmlFor="other" className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink mb-2">
            Please specify
          </label>
          <input
            id="other"
            type="text"
            value={otherText}
            onChange={(e) => onUpdateOther(e.target.value)}
            className="w-full bg-cs-paper cs-border-thin px-4 py-3 text-cs-ink placeholder:text-cs-muted focus:outline-none focus:border-cs-rust focus:ring-1 focus:ring-cs-rust transition-colors"
            placeholder="Tell us where you heard about Wanzami"
          />
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={onBack}
          className="bg-cs-paper cs-border text-cs-ink font-mono text-sm font-bold uppercase tracking-[0.07em] px-8 py-3 transition-colors hover:bg-cs-ink hover:text-cs-paper"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={!source || (source === "other" && !otherText.trim())}
          className="bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] px-8 py-3 cs-shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Finish
        </button>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    preferredGenres: {},
    heardFrom: "",
    heardOther: "",
  });

  const ensureAccessToken = async (): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    let token = localStorage.getItem("accessToken");
    if (token) return token;

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.accessToken) return null;

      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      if (data.deviceId) localStorage.setItem("deviceId", data.deviceId);
      return data.accessToken as string;
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    const preferredGenres = Object.keys(form.preferredGenres);
    if (!preferredGenres.length) {
      toast.error("Please choose at least one genre.");
      setStep(1);
      return;
    }
    if (!form.heardFrom || (form.heardFrom === "other" && !form.heardOther.trim())) {
      toast.error("Please tell us how you heard about Wanzami.");
      setStep(2);
      return;
    }

    const accessToken = await ensureAccessToken();
    if (!accessToken) {
      toast.error("Your session expired. Please sign in again.");
      router.replace("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          preferredGenres,
          heardFrom: form.heardFrom === "other" ? form.heardOther : form.heardFrom,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data as any)?.message ?? "Unable to save your preferences right now.";
        toast.error(msg);
        return;
      }
      toast.success("Preferences saved. Pick a profile to start watching.");
      router.replace("/profiles");
    } catch {
      toast.error("Something went wrong while saving your preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root flex flex-col">
      <TopLoader active={loading} />
      <div className="w-full flex justify-center pt-6">
        <span className="font-heading text-4xl tracking-wide text-cs-ink">WANZAMI</span>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto container-page py-10">
        <div className="mb-10 text-center md:text-left">
          <p className="cs-slug mb-2">Scene 00 — personalize your slate</p>
          <h1 className="font-heading text-4xl md:text-5xl tracking-wide leading-none mb-2 uppercase text-cs-ink">Let&apos;s personalize Wanzami for you</h1>
          <p className="text-cs-muted">
            Choose the genres you love and tell us how you discovered Wanzami. This helps power your For You
            recommendations.
          </p>
        </div>

        <div className="bg-cs-panel cs-border cs-shadow p-5 sm:p-6 md:p-10 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1">
              <p className="cs-slug">Onboarding</p>
              <h2 className="font-heading text-2xl sm:text-3xl tracking-wide uppercase text-cs-ink">Tell us what you like</h2>
            </div>

            <div className="flex items-center gap-3 text-sm text-cs-muted">
              {[1, 2].map((s) => {
                const active = step === s;
                const done = step > s;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done
                          ? "bg-cs-ink border-cs-ink text-cs-paper"
                          : active
                          ? "border-cs-rust text-cs-rust"
                          : "border-cs-line text-cs-muted"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4 text-cs-paper" /> : s}
                    </div>
                    {s < 2 && <div className="w-10 h-0.5 bg-cs-line" />}
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-genres"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GenresStep
                  selectedGenres={form.preferredGenres}
                  onUpdate={(genres) => setForm((prev) => ({ ...prev, preferredGenres: genres }))}
                  onNext={() => setStep(2)}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-discovery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DiscoveryStep
                  source={form.heardFrom}
                  otherText={form.heardOther}
                  onUpdateSource={(val) => setForm((prev) => ({ ...prev, heardFrom: val }))}
                  onUpdateOther={(val) => setForm((prev) => ({ ...prev, heardOther: val }))}
                  onComplete={handleSave}
                  onBack={() => setStep(1)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
