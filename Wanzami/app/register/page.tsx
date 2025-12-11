'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { TopLoader } from "@/components/TopLoader";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Check,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Tv,
  Users,
  Search,
  Radio,
} from "lucide-react";

type Step = 1 | 2 | 3;

type FormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthYear: string;
  preferredGenres: Record<string, number>;
  heardFrom: string;
  heardOther: string;
};

type BubblePosition = {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
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

function StepOne({
  formData,
  onUpdate,
  onNext,
}: {
  formData: Pick<FormState, "name" | "email" | "password" | "confirmPassword">;
  onUpdate: (data: Partial<FormState>) => void;
  onNext: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) onNext();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-white mb-2">Create your account</h2>
        <p className="text-white/60">Start your free journey in under two minutes</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-white mb-2">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-red-400 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-white mb-2">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-400 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-white mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => onUpdate({ password: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors pr-12"
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-white mb-2">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => onUpdate({ confirmPassword: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors pr-12"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-400 mt-1">{errors.confirmPassword}</p>}
        </div>

        <button
          onClick={validateAndProceed}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg transition-colors mt-6"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function StepTwo({
  selectedGenres,
  onUpdate,
  onNext,
  onBack,
}: {
  selectedGenres: Record<string, number>;
  onUpdate: (genres: Record<string, number>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [bubblePositions, setBubblePositions] = useState<Record<string, BubblePosition>>({});

  useEffect(() => {
    const positions: Record<string, BubblePosition> = {};
    GENRES.forEach((genre) => {
      positions[genre] = {
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
      };
    });
    setBubblePositions(positions);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBubblePositions((prev) => {
        const updated = { ...prev };
        GENRES.forEach((genre) => {
          if (updated[genre]) {
            let { x, y, speedX, speedY } = updated[genre];
            x += speedX;
            y += speedY;
            if (x <= 5 || x >= 95) {
              speedX = -speedX;
              x = Math.max(5, Math.min(95, x));
            }
            if (y <= 5 || y >= 95) {
              speedY = -speedY;
              y = Math.max(5, Math.min(95, y));
            }
            updated[genre] = { x, y, speedX, speedY };
          }
        });
        return updated;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleGenreClick = (genre: string) => {
    const currentCount = selectedGenres[genre] || 0;
    const newCount = currentCount + 1;
    if (newCount > 3) {
      const { [genre]: _, ...rest } = selectedGenres;
      onUpdate(rest);
    } else {
      onUpdate({ ...selectedGenres, [genre]: newCount });
    }
  };

  const getScale = (count: number) => {
    if (!count) return 1;
    return 1 + count * 0.4;
  };

  const selectedCount = Object.keys(selectedGenres).length;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-white mb-2">Choose your favorite genres</h2>
        <p className="text-white/60">Tap on floating genres you love. The more you tap, the bigger they grow!</p>
        {selectedCount > 0 && (
          <p className="text-orange-600 mt-2">
            {selectedCount} {selectedCount === 1 ? "genre" : "genres"} selected
          </p>
        )}
      </div>

      <div className="relative w-full h-[500px] rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-white/5 to-white/0 border border-white/10">
        {GENRES.map((genre) => {
          const count = selectedGenres[genre] || 0;
          const scale = getScale(count);
          const isSelected = count > 0;
          const position = bubblePositions[genre];
          if (!position) return null;
          return (
            <button
              key={genre}
              onClick={() => handleGenreClick(genre)}
              className="absolute rounded-full text-white transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-sm"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                padding: "16px 32px",
                backgroundColor: isSelected ? `rgba(234, 88, 12, ${0.2 + count * 0.15})` : "rgba(255,255,255,0.1)",
                borderColor: isSelected ? "#ea580c" : "rgba(255, 255, 255, 0.2)",
                borderWidth: isSelected ? "2px" : "1px",
                borderStyle: "solid",
                boxShadow: isSelected ? "0 0 30px rgba(234, 88, 12, 0.3)" : "none",
                zIndex: isSelected ? 10 : 1,
              }}
            >
              <span className="relative z-10 whitespace-nowrap">{genre}</span>
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={onBack}
          className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg border border-white/20 transition-colors"
        >
          Back
        </button>
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

function StepThree({
  source,
  onUpdate,
  onComplete,
  onBack,
  otherText,
  onOtherChange,
}: {
  source: string;
  onUpdate: (val: string) => void;
  onComplete: () => void;
  onBack: () => void;
  otherText: string;
  onOtherChange: (val: string) => void;
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

  useEffect(() => {
    if (source !== "other") onOtherChange("");
  }, [source, onOtherChange]);

  const handleComplete = () => {
    if (!source) return;
    onComplete();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-white mb-2">How did you hear about us?</h2>
        <p className="text-white/60">Help us understand how you discovered Wanzami</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {sources.map((item) => {
          const Icon = item.icon;
          const isSelected = source === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onUpdate(item.id)}
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
          <label className="block text-white mb-2">Please specify</label>
          <input
            type="text"
            value={otherText}
            onChange={(e) => onOtherChange(e.target.value)}
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
          onClick={handleComplete}
          disabled={!source || (source === "other" && !otherText.trim())}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Complete Sign Up
        </button>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    birthYear: "",
    preferredGenres: {},
    heardFrom: "",
    heardOther: "",
  });

  const canNext = useMemo(
    () => step === 1 || Object.keys(form.preferredGenres).length > 0,
    [form.preferredGenres, step]
  );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const preferredGenres = Object.keys(form.preferredGenres);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          preferredGenres,
          birthYear: form.birthYear ? Number(form.birthYear) : undefined,
          heardFrom: form.heardFrom === "other" ? form.heardOther : form.heardFrom,
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

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12 md:py-16">
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
              A quick multi-step setup. We&apos;ll personalize your experience and get you streaming fast.
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
                >
                  <StepOne
                    formData={form}
                    onUpdate={(data) => setForm((prev) => ({ ...prev, ...data }))}
                    onNext={() => setStep(2)}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="mb-6">
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
                  <StepTwo
                    selectedGenres={form.preferredGenres}
                    onUpdate={(genres) => setForm((prev) => ({ ...prev, preferredGenres: genres }))}
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <StepThree
                    source={form.heardFrom}
                    otherText={form.heardOther}
                    onOtherChange={(val) => setForm((prev) => ({ ...prev, heardOther: val }))}
                    onUpdate={(source) => setForm((prev) => ({ ...prev, heardFrom: source }))}
                    onComplete={handleSubmit}
                    onBack={() => setStep(2)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 flex justify-between gap-3 text-sm text-white/60">
              <span>Step {step} of 3</span>
              {step < 3 && (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && canNext) setStep(2);
                    else if (step === 2 && canNext) setStep(3);
                  }}
                  disabled={!canNext}
                  className="text-[#fd7e14] hover:text-[#e86f0f] disabled:opacity-50"
                >
                  Next
                </button>
              )}
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => (step === 1 ? router.push("/login") : setStep((s) => (Math.max(1, s - 1) as Step)))}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 1 ? "Back to login" : "Back"}
              </button>

              {step === 3 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#fd7e14] hover:bg-[#e86f0f] text-black font-semibold transition disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create account"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep((s) => (Math.min(3, s + 1) as Step))}
                  disabled={!canNext}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#fd7e14] hover:bg-[#e86f0f] text-black font-semibold transition disabled:opacity-50"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
