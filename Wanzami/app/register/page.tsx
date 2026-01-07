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

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-16">
      <TopLoader active={loading} />
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image src={orangeLogo} alt="Wanzami" width={110} height={110} priority />
          <div className="text-center">
            <h1 className="text-white text-3xl font-semibold">Create your account</h1>
            <p className="text-white/70 text-sm">Join Wanzami to start streaming.</p>
          </div>
        </div>

        <div className="rounded-3xl bg-[#0d0d0f] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)] p-8">
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
