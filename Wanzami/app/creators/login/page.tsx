'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, login } from "@/lib/creatorClient";
import { Logo } from "../_components/kit";

const INK = "#161310";
const PAPER = "#f2ead9";
const PANEL = "#f7f1e3";
const RUST = "#d1490f";

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `2px solid ${INK}`,
  background: PAPER,
  color: INK,
  fontFamily: "inherit",
  fontSize: 15,
  padding: "12px 14px",
};

export default function CreatorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      const me = await fetchMe().catch(() => null);
      router.replace(me && !me.onboarded ? "/creators/onboarding" : "/creators/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border-[3px] p-8" style={{ borderColor: INK, backgroundColor: PANEL }}>
        <Logo className="h-8 w-auto" />
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-[#6b5f4d]">Creator portal</p>
        <h1 className="mt-2 font-mono text-2xl font-black uppercase tracking-tight">Log in</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          {error && <p className="text-sm" style={{ color: RUST }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
            style={{ backgroundColor: INK, color: PAPER }}
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[#6b5f4d]">
          Not a creator yet? <a href="/creators/apply" className="underline">Create an account</a>.
        </p>
      </div>
    </div>
  );
}
