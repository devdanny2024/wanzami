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
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 sm:px-6 py-10 auth-root">
      <TopLoader active={loading} />
      <div className="w-full max-w-md bg-graphite border border-white/10 rounded-2xl p-6 sm:p-8">
        <h1 className="font-heading text-3xl sm:text-4xl tracking-wide leading-none mb-3">Reset Password</h1>
        <p className="text-ash mb-6 break-words">Enter a new password for {email}.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-ash">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-ink-2 px-3 py-3 text-white placeholder:text-white/40 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-none transition-colors"
              placeholder="Use upper, lower, number, symbol"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token || !email}
            className="w-full bg-brand hover:bg-brand-light text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
        {message && <p className="text-sm text-ash mt-4">{message}</p>}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 auth-root">
          <div className="text-gray-300">Loading reset form…</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
