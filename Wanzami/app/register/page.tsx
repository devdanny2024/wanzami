'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
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
import { TopLoader } from "@/components/TopLoader";
import whiteLogo from "../../src/assets/WhiteWanzmiiLogo.png";

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

const geometricShapes = [
  { type: "circle" as const, color: "bg-orange-500", size: "w-64 h-64", x: 12, y: 60, duration: 18 },
  { type: "rounded" as const, color: "bg-purple-500", size: "w-64 h-64", x: 64, y: 24, duration: 20 },
  { type: "circle" as const, color: "bg-teal-400", size: "w-52 h-52", x: 42, y: 54, duration: 16 },
];

function StepOne({
  formData,
  onUpdate,
  onNext,
}: {
  formData: Pick<FormState, "name" | "email" | "password" | "confirmPassword" | "birthYear">;
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
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-semibold text-white">Create your account</h2>
        <p className="text-white/60">Start your free journey in under two minutes</p>
      </div>

      <div className="space-y-3 mb-6">
        <button
          type="button"
          onClick={() => toast.info("Apple sign-up is coming soon.")}
          className="w-full bg-white hover:bg-white/90 text-black py-3 rounded-lg transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continue with Apple
        </button>
        <button
          type="button"
          onClick={() => toast.info("Google sign-up is coming soon.")}
          className="w-full bg-white hover:bg-white/90 text-black py-3 rounded-lg transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-black px-4 text-white/60">Or continue with email</span>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-white mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
            placeholder="Enter your full name"
          />
          {errors.name && <p className="text-red-400 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-white mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onUpdate({ email: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-red-400 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-white mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
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
          <label htmlFor="confirmPassword" className="block text-white mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
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

        <div>
          <label htmlFor="dob" className="block text-white mb-2">
            Date of Birth <span className="text-white/50">(optional)</span>
          </label>
          <input
            id="dob"
            type="date"
            value={formData.birthYear}
            onChange={(e) => onUpdate({ birthYear: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
            placeholder="Enter your date of birth"
          />
        </div>

        <button
          onClick={validateAndProceed}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg transition-colors mt-2"
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
          <label htmlFor="other" className="block text-white mb-2">
            Please specify
          </label>
          <input
            id="other"
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const preferredGenres = Object.keys(form.preferredGenres);
      const birthYearValue = form.birthYear ? new Date(form.birthYear).getFullYear() : undefined;
      const birthYear = Number.isNaN(birthYearValue) ? undefined : birthYearValue;

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          preferredGenres,
          birthYear,
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

      void fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      toast.success("Account created. Please verify your email.");
      router.replace(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      toast.error("Unable to register right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen md:h-screen bg-black text-white relative md:overflow-hidden">
      <TopLoader active={loading} />

      <div className="flex flex-row w-full min-h-screen md:h-full md:overflow-hidden">
        {/* Left hero - matches login */}
        <div
          className="relative overflow-hidden items-center justify-center hidden md:flex md:w-1/2 md:h-full md:overflow-y-auto"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, rgba(255,123,57,0.65), transparent 42%), radial-gradient(circle at 72% 10%, rgba(194,71,255,0.55), transparent 48%), radial-gradient(circle at 58% 72%, rgba(0,194,168,0.55), transparent 50%), linear-gradient(135deg, #ff7b39, #c247ff 45%, #00c2a8)",
            minHeight: "100vh",
          }}
        >
          <div className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-br from-[#ff7b39]/30 via-[#c247ff]/25 to-[#00c2a8]/25" />
          <div className="absolute inset-0" style={{ perspective: "1000px" }}>
            {geometricShapes.map((shape, index) => (
              <motion.div
                key={`${shape.type}-${index}`}
                className={`absolute ${shape.size}`}
                style={{ left: `${shape.x}%`, top: `${shape.y}%` }}
                initial={{ opacity: 0.75, scale: 1 }}
                animate={{
                  x: [0, 30, 0],
                  y: [0, -25, 0],
                  scale: [1, 1.05, 1],
                  opacity: [0.75, 0.9, 0.75],
                }}
                transition={{
                  duration: shape.duration ?? 18,
                  delay: index * 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <div
                  className={`w-full h-full ${shape.color} ${
                    shape.type === "circle"
                      ? "rounded-full"
                      : shape.type === "rounded"
                      ? "rounded-3xl rotate-45"
                      : "rounded-lg"
                  }`}
                  style={{ boxShadow: "0 30px 90px rgba(0, 0, 0, 0.35)", filter: "blur(1px)" }}
                />
                <div
                  className={`absolute inset-0 ${shape.color} ${
                    shape.type === "circle"
                      ? "rounded-full"
                      : shape.type === "rounded"
                      ? "rounded-3xl rotate-45"
                      : "rounded-lg"
                  }`}
                  style={{ filter: "blur(30px)", opacity: 0.65, transform: "scale(1.25)" }}
                />
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <Image src={whiteLogo} alt="Wanzami" width={140} height={140} priority className="mx-auto" />
              <h1 className="text-white text-5xl font-semibold mt-6 mb-4 drop-shadow-[0_5px_30px_rgba(0,0,0,0.4)]">
                Join Wanzami
              </h1>
              <p className="text-white/80 text-xl max-w-md mx-auto">
                Start your streaming journey in just a few steps.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Right side - form */}
        <div className="flex flex-col items-start justify-start px-6 py-16 bg-black w-full md:w-1/2 min-h-screen md:h-full md:overflow-hidden">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-10">
              <Image src={whiteLogo} alt="Wanzami" width={64} height={64} priority className="lg:hidden" />
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-white/70 hover:text-white transition-colors ml-auto"
              >
                Already have an account? <span className="text-orange-500 font-semibold">Login</span>
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col gap-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-semibold">Create your Wanzami account</h1>
                  <p className="text-white/70">
                    A quick multi-step setup. We&apos;ll personalize your experience and get you streaming fast.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-sm text-white/80">
                  {[1, 2, 3].map((s) => {
                    const active = step === s;
                    const done = step > s;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                            done
                              ? "bg-orange-600 border-orange-600"
                              : active
                              ? "border-orange-600 text-orange-500"
                              : "border-white/20 text-white/60"
                          }`}
                        >
                          {done ? <Check className="w-5 h-5 text-white" /> : s}
                        </div>
                        {s < 3 && <div className="w-12 h-0.5 bg-white/15" />}
                      </div>
                    );
                  })}
                </div>
              </div>

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
