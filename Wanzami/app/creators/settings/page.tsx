'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, KeyRound, Mail, ShieldAlert } from "lucide-react";
import { fetchMe, getCreatorTokens, updateCredentials, type CreatorProfile } from "@/lib/creatorClient";
import { Card, inputStyle, INK, MUTED, PAPER, RUST, Skeleton, Slug } from "../_components/kit";

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
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

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
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      const me = await fetchMe();
      setProfile(me);
      setNewEmail(me.email);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Could not save changes.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16 space-y-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
      <header className="sticky top-0 z-50 border-b-[3px]" style={{ backgroundColor: PAPER, borderColor: INK }}>
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/creators/dashboard"
            className="inline-flex items-center gap-2 font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] hover:opacity-70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <Slug>Account</Slug>
        <h1 className="font-heading mt-1 text-4xl uppercase tracking-wide">Settings</h1>
        <p className="mt-3 text-sm" style={{ color: "#3c342a" }}>
          Update the email or password you log in with, {profile?.name.split(" ")[0]}.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <Card>
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4" style={{ color: RUST }} />
              <Slug>Email</Slug>
            </div>
            <input
              type="email"
              style={{ ...inputStyle, marginTop: 12 }}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </Card>

          <Card>
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4" style={{ color: RUST }} />
              <Slug>New password</Slug>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: MUTED }}>Password</span>
                <input
                  type="password"
                  style={{ ...inputStyle, marginTop: 6 }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: MUTED }}>Confirm</span>
                <input
                  type="password"
                  style={{ ...inputStyle, marginTop: 6 }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            </div>
          </Card>

          <div className="border-[2.5px] p-6" style={{ borderColor: INK, backgroundColor: INK }}>
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4" style={{ color: "#f2a97a" }} />
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#f2a97a" }}>
                Confirm with current password
              </p>
            </div>
            <input
              type="password"
              style={{ ...inputStyle, marginTop: 12 }}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
              style={{ backgroundColor: INK, color: PAPER }}
            >
              {submitting ? "Saving…" : "Save changes"}
            </button>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-sm font-medium" style={{ color: RUST }}>
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5 font-mono text-sm font-bold"
                >
                  <Check className="h-4 w-4" style={{ color: RUST }} />
                  Saved
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </form>
      </main>
    </div>
  );
}
