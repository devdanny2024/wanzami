'use client';

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { lookupInvite, setPassword as submitPassword } from "@/lib/creatorClient";

const INK = "#161310";
const PAPER = "#f2ead9";
const PANEL = "#f7f1e3";
const RUST = "#d1490f";

const isStrong = (pwd: string) =>
  pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `2px solid ${INK}`,
  background: PAPER,
  color: INK,
  fontFamily: "inherit",
  fontSize: 15,
  padding: "12px 14px",
};

function SetPasswordForm() {
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get("token") ?? "";

  const [checking, setChecking] = useState(true);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalidReason("This link is missing its token.");
      setChecking(false);
      return;
    }
    lookupInvite(token).then((res) => {
      if (res.ok) {
        setName(res.data.name ?? "");
      } else {
        setInvalidReason(res.data?.message ?? "This link is not valid.");
      }
      setChecking(false);
    });
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStrong(password)) {
      setError("Use at least 8 characters, with upper, lower, a number and a symbol.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitPassword(token, password);
      router.replace("/creators/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Could not set your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border-[3px] p-8" style={{ borderColor: INK, backgroundColor: PANEL }}>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6b5f4d]">Creator portal</p>
        <h1 className="mt-2 font-mono text-2xl font-black uppercase tracking-tight">Set your password</h1>

        {checking ? (
          <p className="mt-6 text-sm text-[#3c342a]">Checking your invite…</p>
        ) : invalidReason ? (
          <>
            <p className="mt-6 text-sm" style={{ color: RUST }}>{invalidReason}</p>
            <Link href="/creators/login" className="mt-4 inline-block font-mono text-sm underline">
              Go to login
            </Link>
          </>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-[#3c342a]">
              Welcome, {name}. Pick a password to finish setting up your creator account.
            </p>
            <input
              type="password"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              required
            />
            {error && <p className="text-sm" style={{ color: RUST }}>{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
              style={{ backgroundColor: INK, color: PAPER }}
            >
              {submitting ? "Saving…" : "Set password and continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}
