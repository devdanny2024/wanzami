'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Lock, User, Calendar, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { TopLoader } from "@/components/TopLoader";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const GENRES = [
  "Action",
  "Drama",
  "Comedy",
  "Thriller",
  "Romance",
  "Horror",
  "Sci-Fi",
  "Fantasy",
  "Documentary",
  "Kids",
  "Anime",
  "Reality",
];

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    birthYear: "",
    genres: [] as string[],
  });

  const canNext = useMemo(() => {
    if (step === 1) {
      return form.name.trim() && form.email.trim() && form.password.trim();
    }
    return true;
  }, [form.email, form.name, form.password, step]);

  const toggleGenre = (genre: string) => {
    setForm((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          preferredGenres: form.genres,
          birthYear: form.birthYear ? Number(form.birthYear) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message ?? "Registration failed";
        toast.error(msg);
        return;
      }
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("deviceId", data.deviceId);
      toast.success("Account created");
      router.replace("/profiles");
    } catch (err) {
      toast.error("Unable to register right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0b0b0c] to-black text-white relative overflow-hidden">
      <TopLoader active={loading} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-10 w-72 h-72 bg-[#fd7e14]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#ff9f4d]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center justify-between mb-10">
          <Logo size="splash" />
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Already have an account? <span className="text-[#fd7e14] font-semibold">Login</span>
          </button>
        </div>

        <div className="grid md:grid-cols-[1.1fr_1fr] gap-10 items-start">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl font-semibold">Create your Wanzami account</h1>
            <p className="text-white/70">
              A quick 2-step setup. We&apos;ll personalize your experience and get you streaming fast.
            </p>
            <div className="flex items-center gap-3 text-sm text-white/80">
              {[1, 2, 3].map((s) => {
                const active = step === s;
                const done = step > s;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full border flex items-center justify-center ${
                        done
                          ? "bg-[#fd7e14] border-[#fd7e14]"
                          : active
                          ? "border-[#fd7e14] text-[#fd7e14]"
                          : "border-white/20 text-white/60"
                      }`}
                    >
                      {done ? <Check className="w-5 h-5 text-black" /> : s}
                    </div>
                    {s < 3 && <div className="w-10 h-px bg-white/20" />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white focus:border-[#fd7e14] outline-none"
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Full name"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white focus:border-[#fd7e14] outline-none"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="you@email.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white focus:border-[#fd7e14] outline-none"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="Create a password"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Birth Year (optional)</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                      <input
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-3 py-3 text-white focus:border-[#fd7e14] outline-none"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={form.birthYear}
                        onChange={(e) => setForm((p) => ({ ...p, birthYear: e.target.value }))}
                        placeholder="1995"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-white/70 mb-2">Pick a few favorite genres (optional)</div>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map((g) => {
                        const active = form.genres.includes(g);
                        return (
                          <button
                            type="button"
                            key={g}
                            onClick={() => toggleGenre(g)}
                            className={`px-3 py-2 rounded-full border text-sm transition ${
                              active
                                ? "border-[#fd7e14] bg-[#fd7e14]/20 text-white"
                                : "border-white/15 text-white/80 hover:border-white/40"
                            }`}
                          >
                            {g}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold">Review &amp; create account</h3>
                  <div className="space-y-2 text-sm text-white/80">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span>Name</span>
                      <span className="font-semibold text-white">{form.name || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span>Email</span>
                      <span className="font-semibold text-white">{form.email || "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span>Birth year</span>
                      <span className="font-semibold text-white">{form.birthYear || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Genres</span>
                      <span className="font-semibold text-white">
                        {form.genres.length ? form.genres.join(", ") : "None selected"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => (step === 1 ? router.push("/login") : setStep((s) => (Math.max(1, s - 1) as Step)))}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 1 ? "Back to login" : "Back"}
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => ((Math.min(3, s + 1) as Step)))}
                  disabled={!canNext}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#fd7e14] hover:bg-[#e86f0f] text-black font-semibold transition disabled:opacity-50"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#fd7e14] hover:bg-[#e86f0f] text-black font-semibold transition disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create account"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
