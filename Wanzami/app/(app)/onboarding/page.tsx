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
        <h2 className="text-3xl font-semibold text-white mb-2">Choose your favorite genres</h2>
        <p className="text-white/60">Select all the genres you enjoy watching</p>
        {selectedCount > 0 && (
          <p className="text-orange-500 mt-2">
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
              className={`relative p-5 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "bg-orange-600/20 border-orange-600 shadow-lg shadow-orange-600/20"
                  : "bg-white/5 border-white/20 hover:border-orange-600/50 hover:bg-white/10"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 bg-orange-600 rounded-full p-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <p className={`text-center ${isSelected ? "text-white" : "text-white/80"}`}>{genre}</p>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={onNext}
          disabled={selectedCount === 0}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <h2 className="text-3xl font-semibold text-white mb-2">How did you hear about us?</h2>
        <p className="text-white/60">Help us understand how you discovered Wanzami</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {sources.map((item) => {
          const Icon = item.icon;
          const isSelected = source === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onUpdateSource(item.id)}
              className={`p-6 rounded-xl border transition-all ${
                isSelected
                  ? "bg-orange-600/20 border-orange-600 shadow-lg shadow-orange-600/20"
                  : "bg-white/10 border-white/20 hover:border-orange-600/50"
              }`}
            >
              <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? "text-orange-600" : "text-white/60"}`} />
              <p className={`text-center ${isSelected ? "text-white" : "text-white/80"}`}>{item.label}</p>
            </button>
          );
        })}
      </div>

      {source === "other" && (
        <div className="mb-8">
          <label htmlFor="other" className="block text-white mb-2">
            Please specify
          </label>
          <input
            id="other"
            type="text"
            value={otherText}
            onChange={(e) => onUpdateOther(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
            placeholder="Tell us where you heard about Wanzami"
          />
        </div>
      )}

      <div className="flex gap-4 justify-center">
        <button
          onClick={onBack}
          className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg border border-white/20 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onComplete}
          disabled={!source || (source === "other" && !otherText.trim())}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

    const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
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
      toast.success("Preferences saved. Enjoy Wanzami!");
      router.replace("/");
    } catch {
      toast.error("Something went wrong while saving your preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <TopLoader active={loading} />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold mb-2">Let&apos;s personalize Wanzami for you</h1>
          <p className="text-white/70">
            Choose the genres you love and tell us how you discovered Wanzami. This helps power your For You
            recommendations.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1">
              <p className="text-sm text-white/60 uppercase tracking-wide">Onboarding</p>
              <h2 className="text-2xl font-semibold">Tell us what you like</h2>
            </div>

            <div className="flex items-center gap-3 text-sm text-white/80">
              {[1, 2].map((s) => {
                const active = step === s;
                const done = step > s;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done
                          ? "bg-orange-600 border-orange-600"
                          : active
                          ? "border-orange-600 text-orange-500"
                          : "border-white/20 text-white/60"
                      }`}
                    >
                      {done ? <Check className="w-4 h-4 text-white" /> : s}
                    </div>
                    {s < 2 && <div className="w-10 h-0.5 bg-white/15" />}
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

