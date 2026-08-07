'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import { signup } from "@/lib/creatorClient";

const INK = "#161310";
const PAPER = "#f2ead9";
const PANEL = "#f7f1e3";
const RUST = "#d1490f";

function Slug({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-[11px] sm:text-xs tracking-[0.08em] text-[#6b5f4d] uppercase">{children}</p>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6b5f4d]">
        {label}
        {required && <span style={{ color: RUST }}> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `2px solid ${INK}`,
  background: PAPER,
  color: INK,
  fontFamily: "inherit",
  fontSize: 15,
  padding: "12px 14px",
};

const isStrongPassword = (pwd: string) =>
  pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);

export default function CreatorSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [reelUrl, setReelUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isStrongPassword(password)) {
      setError("Password needs at least 8 characters, with upper, lower, a number and a symbol.");
      return;
    }
    setSubmitting(true);
    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        bio: bio.trim() || undefined,
        reelUrl: reelUrl.trim() || undefined,
      });
      router.replace("/creators/onboarding");
    } catch (err: any) {
      setError(err?.message ?? "Could not create your account. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
      <header className="sticky top-0 z-50 border-b-[3px]" style={{ backgroundColor: PAPER, borderColor: INK }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/creators"
            className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Wanzami Pictures
          </Link>
          <span className="hidden font-mono text-[11px] uppercase tracking-widest sm:inline-block border-[1.5px] px-2 py-0.5" style={{ borderColor: INK }}>
            Create account
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Slug>Call sheet · Join</Slug>
        <h1 className="mt-2 font-mono text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Create your account
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#3c342a]">
          No waiting on us. Set up your account now, then submit your first film from the dashboard, that's the
          only thing we review.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5 border-[3px] p-6 sm:p-8" style={{ borderColor: INK, backgroundColor: PANEL }}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Full name" required>
              <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
            </Field>
            <Field label="Email" required>
              <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
          </div>
          <Field label="Password" required>
            <input
              type="password"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-[#6b5f4d]">
              8+ characters, upper, lower, number, symbol
            </p>
          </Field>
          <Field label="About you and your work (optional)">
            <textarea
              style={{ ...inputStyle, resize: "vertical" }}
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={2000}
              placeholder="What have you made, and what are you making next?"
            />
          </Field>
          <Field label="Link to a reel, short, or film (optional)">
            <input
              type="url"
              style={inputStyle}
              value={reelUrl}
              onChange={(e) => setReelUrl(e.target.value)}
              placeholder="https://"
            />
          </Field>

          {error && (
            <p className="text-sm font-medium" style={{ color: RUST }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
            style={{ backgroundColor: INK, color: PAPER }}
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="text-sm text-[#6b5f4d]">
            Already have an account? <Link href="/creators/login" className="underline">Log in</Link>.
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}
