'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { TopLoader } from "@/components/TopLoader";
import orangeLogo from "../../src/assets/logo.png";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.message ?? "Unable to register. Please try again.";
        setError(msg);
        toast.error(msg);
        return;
      }
      toast.success("Account created. Check your email to verify.");
      window.location.href = "/login";
    } catch (err) {
      setError("Unable to register. Please try again.");
      toast.error("Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE ||
        process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
        process.env.AUTH_SERVICE_URL ||
        "https://api.carlylehub.org/api";
      const redirectUri = `${window.location.origin}/oauth/google/callback`;
      const res = await fetch(
        `${apiBase.replace(/\/+$/, "")}/auth/google/url?redirectUri=${encodeURIComponent(
          redirectUri
        )}`
      );
      const data = await res.json();
      if (!res.ok || !data?.url) {
        const msg = data?.message ?? "Google sign-up unavailable right now.";
        setError(msg);
        toast.error(msg);
        setGoogleLoading(false);
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setError("Unable to start Google sign-up. Please try again.");
      toast.error("Unable to start Google sign-up. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-16">
      <TopLoader active={loading || googleLoading} />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image src={orangeLogo} alt="Wanzami" width={110} height={110} priority />
          <div className="text-center">
            <h1 className="text-white text-3xl font-semibold">Create your account</h1>
            <p className="text-white/70 text-sm">Join Wanzami to start streaming.</p>
          </div>
        </div>

        <div className="rounded-3xl bg-[#0d0d0f] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)] p-8">
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="w-full bg-white text-black py-3 rounded-lg transition-colors flex items-center justify-center gap-3 hover:bg-white/90 disabled:opacity-70 disabled:cursor-not-allowed"
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
              <span>{googleLoading ? "Connecting..." : "Sign up with Google"}</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/15" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#0d0d0f] px-3 text-white/60 text-sm">
                Or sign up with email
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#16161a] border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14]"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#16161a] border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14]"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#16161a] border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14] pr-12"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-[#16161a] border border-white/15 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#fd7e14] focus:ring-1 focus:ring-[#fd7e14] pr-12"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e25a00] hover:bg-[#fd7e14] text-white py-3 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-white/60 text-center mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#fd7e14] hover:text-[#e86f0f] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
