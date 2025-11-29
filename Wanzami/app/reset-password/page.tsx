'use client';

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-2xl font-semibold mb-3">Reset Password</h1>
        <p className="text-gray-400 mb-6">Enter a new password for {email}.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm text-gray-300">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-black px-3 py-3 text-white focus:border-[#fd7e14] focus:outline-none"
              placeholder="Use upper, lower, number, symbol"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token || !email}
            className="w-full bg-[#fd7e14] hover:bg-[#ff9f4d] text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
        {message && <p className="text-sm text-gray-300 mt-4">{message}</p>}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
          <div className="text-gray-300">Loading reset form…</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
