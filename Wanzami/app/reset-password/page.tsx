'use client';

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { TopLoader } from "@/components/TopLoader";

const isStrong = (pwd: string) =>
  pwd.length >= 8 &&
  /[A-Z]/.test(pwd) &&
  /[a-z]/.test(pwd) &&
  /[0-9]/.test(pwd) &&
  /[^A-Za-z0-9]/.test(pwd);

function ResetPasswordForm() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") ?? "";
  const email = search.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setMessage("Invalid reset link.");
    }
  }, [token, email]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrong(password)) {
      setMessage("Password must have upper, lower, number, symbol, 8+ chars.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    setMessage(data.message ?? "Password updated.");
    if (res.ok) {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root flex items-center justify-center px-4 sm:px-6 py-10 auth-root">
      <TopLoader active={loading} />
      <div className="w-full max-w-md bg-cs-panel cs-border cs-shadow p-6 sm:p-8">
        <h1 className="font-heading text-3xl sm:text-4xl tracking-wide leading-none mb-3 uppercase text-cs-ink">Reset Password</h1>
        <p className="text-cs-muted mb-6 break-words">Enter a new password for {email}.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="block font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-cs-ink">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full cs-border-thin bg-cs-paper px-3 py-3 text-cs-ink placeholder:text-cs-muted focus:border-cs-rust focus:ring-1 focus:ring-cs-rust focus:outline-none transition-colors"
              placeholder="Use upper, lower, number, symbol"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token || !email}
            className="w-full bg-cs-rust text-cs-paper font-mono text-sm font-bold uppercase tracking-[0.07em] py-3 cs-shadow-sm transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
        {message && <p className="text-sm text-cs-muted mt-4">{message}</p>}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cs-paper text-cs-ink cs-paper-root flex items-center justify-center px-4 auth-root">
          <div className="font-mono text-xs uppercase tracking-[0.08em] text-cs-muted">Loading reset form…</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
