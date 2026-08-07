'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Footer } from "@/components/Footer";
import { submitApplication } from "@/lib/creatorClient";

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

export default function CreatorApplyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [reelUrl, setReelUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (bio.trim().length < 20) {
      setError("Tell us a bit more, at least 20 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await submitApplication({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim(),
        reelUrl: reelUrl.trim() || undefined,
        instagram: instagram.trim() || undefined,
        youtube: youtube.trim() || undefined,
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.message ?? "Could not submit your application. Try again in a moment.");
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
            Application
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {done ? (
          <div className="border-[3px] p-8 text-center" style={{ borderColor: INK, backgroundColor: PANEL }}>
            <Check className="mx-auto h-10 w-10" style={{ color: RUST }} />
            <h1 className="mt-4 font-mono text-2xl font-bold uppercase tracking-tight">Application sent</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#3c342a]">
              We read every application. If it's a fit, we'll email you at <strong>{email}</strong> with next
              steps and a link to set up your creator account.
            </p>
            <Link
              href="/creators"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider"
              style={{ backgroundColor: INK, color: PAPER }}
            >
              Back to Wanzami Pictures
            </Link>
          </div>
        ) : (
          <>
            <Slug>Call sheet · Application</Slug>
            <h1 className="mt-2 font-mono text-3xl font-black uppercase tracking-tight sm:text-4xl">
              Tell us who you are
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#3c342a]">
              Your reel, your short, or the film that got rejected everywhere else. If we think it's a fit, we'll
              set you up with a creator account to upload the master file.
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
              <Field label="Phone (optional)">
                <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
              </Field>
              <Field label="Tell us about yourself and your work" required>
                <textarea
                  style={{ ...inputStyle, resize: "vertical" }}
                  rows={5}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
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
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="Instagram (optional)">
                  <input style={inputStyle} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle" />
                </Field>
                <Field label="YouTube (optional)">
                  <input style={inputStyle} value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="Channel link" />
                </Field>
              </div>

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
                {submitting ? "Sending…" : "Apply to join"}
              </button>
            </form>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
