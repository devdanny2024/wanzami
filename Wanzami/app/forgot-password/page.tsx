'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail } from "lucide-react";
import { TopLoader } from "@/components/TopLoader";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"form" | "sent">("form");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data?.message ?? "Unable to send reset email. Please try again.");
      return;
    }

    setMessage(data?.message ?? "If that account exists, a reset link has been sent.");
    setStatus("sent");
  };

  if (status === "sent") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-orange-600/10 border border-orange-600/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-3xl font-semibold mb-4">Check your email</h2>
          <p className="text-white/60">We&apos;ve sent password reset instructions to</p>
          <p className="text-white font-semibold mb-6">{email}</p>
          <p className="text-white/60 mb-8">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setStatus("form")}
              className="text-orange-500 hover:text-orange-400 transition-colors"
            >
              try another address
            </button>
            .
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg transition-colors"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <TopLoader active={loading} />
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to login
        </button>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-600/20 text-orange-400 p-2 rounded-full">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Forgot password?</h1>
              <p className="text-white/60">No worries, we&apos;ll send you reset instructions.</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block text-sm text-white mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-white/15 bg-black px-4 py-3 text-white focus:border-orange-600 focus:outline-none"
                placeholder="Enter your email"
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Sending..." : "Reset password"}
            </button>
          </form>

          {message && !error && <p className="text-sm text-white/70 mt-4">{message}</p>}
        </div>
      </div>
    </div>
  );
}
