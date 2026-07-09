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
      <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root flex items-center justify-center px-4 sm:px-6 py-10 auth-root">
        <div className="w-full max-w-md text-center">
          <div className="cs-border w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-cs-rust" />
          </div>
          <h2 className="font-heading text-4xl sm:text-5xl tracking-wide leading-none mb-4 uppercase text-cs-ink">Check your email</h2>
          <p className="text-cs-muted">We&apos;ve sent password reset instructions to</p>
          <p className="text-cs-ink font-semibold mb-6">{email}</p>
          <p className="text-cs-muted mb-8">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              onClick={() => setStatus("form")}
              className="text-cs-rust hover:text-cs-ink transition-colors font-semibold"
            >
              try another address
            </button>
            .
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] py-3 cs-shadow-sm transition-transform hover:-translate-y-0.5"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root flex items-center justify-center px-4 sm:px-6 py-10 auth-root">
      <TopLoader active={loading} />
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.08em] text-cs-muted hover:text-cs-ink transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to login
        </button>

        <div className="bg-cs-panel cs-border cs-shadow p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="cs-border-thin text-cs-rust p-2 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl tracking-wide uppercase text-cs-ink">Forgot password?</h1>
              <p className="text-cs-muted text-sm">No worries, we&apos;ll send you reset instructions.</p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full cs-border-thin bg-cs-paper px-4 py-3 text-cs-ink placeholder:text-cs-muted focus:border-cs-rust focus:ring-1 focus:ring-cs-rust focus:outline-none transition-colors"
                placeholder="Enter your email"
              />
              {error && <p className="text-cs-rust text-sm mt-2 font-mono">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] py-3 cs-shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Reset password"}
            </button>
          </form>

          {message && !error && <p className="text-sm text-cs-muted mt-4">{message}</p>}
        </div>
      </div>
    </div>
  );
}
