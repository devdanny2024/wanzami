'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchMe, getCreatorTokens, updateCredentials, type CreatorProfile } from "@/lib/creatorClient";

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

const isStrongPassword = (pwd: string) =>
  pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd);

export default function CreatorSettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const { accessToken } = getCreatorTokens();
    if (!accessToken) {
      router.replace("/creators/login");
      return;
    }
    fetchMe()
      .then((me) => {
        setProfile(me);
        setNewEmail(me.email);
      })
      .catch(() => router.replace("/creators/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const emailChanged = profile && newEmail.trim().toLowerCase() !== profile.email;
    const wantsPasswordChange = newPassword.length > 0;

    if (!emailChanged && !wantsPasswordChange) {
      setError("Change the email or set a new password first.");
      return;
    }
    if (wantsPasswordChange) {
      if (!isStrongPassword(newPassword)) {
        setError("New password needs at least 8 characters, with upper, lower, a number and a symbol.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords don't match.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await updateCredentials({
        currentPassword,
        newEmail: emailChanged ? newEmail.trim() : undefined,
        newPassword: wantsPasswordChange ? newPassword : undefined,
      });
      setSuccess("Saved.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      const me = await fetchMe();
      setProfile(me);
      setNewEmail(me.email);
    } catch (err: any) {
      setError(err?.message ?? "Could not save changes.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm uppercase tracking-widest">Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
      <header className="sticky top-0 z-50 border-b-[3px]" style={{ backgroundColor: PAPER, borderColor: INK }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/creators/dashboard"
            className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6b5f4d]">Account</p>
        <h1 className="mt-2 font-mono text-3xl font-black uppercase tracking-tight">Settings</h1>
        <p className="mt-3 text-sm text-[#3c342a]">
          Update the email or password you log in with. Both changes need your current password.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5 border-[3px] p-6 sm:p-8" style={{ borderColor: INK, backgroundColor: PANEL }}>
          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6b5f4d]">Email</span>
            <input
              type="email"
              style={{ ...inputStyle, marginTop: 6 }}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6b5f4d]">New password (optional)</span>
              <input
                type="password"
                style={{ ...inputStyle, marginTop: 6 }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </label>
            <label className="block">
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6b5f4d]">Confirm new password</span>
              <input
                type="password"
                style={{ ...inputStyle, marginTop: 6 }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
          </div>

          <div style={{ height: 2, background: INK, opacity: 0.15 }} />

          <label className="block">
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6b5f4d]">
              Current password <span style={{ color: RUST }}>*</span>
            </span>
            <input
              type="password"
              style={{ ...inputStyle, marginTop: 6 }}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="text-sm font-medium" style={{ color: RUST }}>{error}</p>}
          {success && <p className="text-sm font-medium" style={{ color: INK }}>{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
            style={{ backgroundColor: INK, color: PAPER }}
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </form>
      </main>
    </div>
  );
}
