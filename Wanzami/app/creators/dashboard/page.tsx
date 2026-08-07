'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearCreatorTokens,
  fetchMe,
  fetchSubmissions,
  getCreatorTokens,
  uploadSubmission,
  type CreatorProfile,
  type CreatorSubmission,
} from "@/lib/creatorClient";

const INK = "#161310";
const PAPER = "#f2ead9";
const PANEL = "#f7f1e3";
const RUST = "#d1490f";

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "good" | "bad" | "pending" | "neutral" }) {
  const colors: Record<string, string> = {
    good: INK,
    bad: RUST,
    pending: "#6b5f4d",
    neutral: "#6b5f4d",
  };
  return (
    <span
      className="inline-block font-mono text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-1"
      style={{ border: `1.5px solid ${colors[tone]}`, color: colors[tone] }}
    >
      {children}
    </span>
  );
}

const submissionTone = (status: CreatorSubmission["status"]) => {
  if (status === "APPROVED") return "good" as const;
  if (status === "REJECTED") return "bad" as const;
  return "pending" as const;
};

function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a video file first.");
      return;
    }
    setError(null);
    setProgress(0);
    try {
      await uploadSubmission(file, { title: title.trim(), synopsis: synopsis.trim() || undefined }, setProgress);
      setTitle("");
      setSynopsis("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onUploaded();
    } catch (err: any) {
      setError(err?.message ?? "Upload failed");
    } finally {
      setProgress(null);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 border-[3px] p-6" style={{ borderColor: INK, backgroundColor: PANEL }}>
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6b5f4d]">Upload a film</p>
      <input
        style={{ width: "100%", border: `2px solid ${INK}`, background: PAPER, color: INK, padding: "10px 12px", fontSize: 14 }}
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={200}
      />
      <textarea
        style={{ width: "100%", border: `2px solid ${INK}`, background: PAPER, color: INK, padding: "10px 12px", fontSize: 14, resize: "vertical" }}
        placeholder="Synopsis (optional)"
        rows={3}
        value={synopsis}
        onChange={(e) => setSynopsis(e.target.value)}
        maxLength={2000}
      />
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="font-mono text-xs"
      />
      {progress !== null && (
        <div>
          <div style={{ height: 6, background: PAPER, border: `1.5px solid ${INK}` }}>
            <div style={{ height: "100%", width: `${progress}%`, background: RUST }} />
          </div>
          <p className="mt-1 font-mono text-[11px]" style={{ color: "#6b5f4d" }}>{progress}%</p>
        </div>
      )}
      {error && <p className="text-sm" style={{ color: RUST }}>{error}</p>}
      <button
        type="submit"
        disabled={progress !== null}
        className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider disabled:opacity-50"
        style={{ backgroundColor: INK, color: PAPER }}
      >
        {progress !== null ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [authFailed, setAuthFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, subs] = await Promise.all([fetchMe(), fetchSubmissions()]);
      setProfile(me);
      setSubmissions(subs);
    } catch {
      setAuthFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { accessToken } = getCreatorTokens();
    if (!accessToken) {
      router.replace("/creators/login");
      return;
    }
    void load();
  }, [load, router]);

  useEffect(() => {
    if (authFailed) router.replace("/creators/login");
  }, [authFailed, router]);

  const logout = () => {
    clearCreatorTokens();
    router.replace("/creators/login");
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
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em]">
            Wanzami Pictures &middot; Creator Dashboard
          </span>
          <button onClick={logout} className="font-mono text-[11px] uppercase tracking-widest underline">
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 space-y-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#6b5f4d]">Welcome back</p>
          <h1 className="mt-1 font-mono text-3xl font-black uppercase tracking-tight">{profile?.name}</h1>
        </div>

        <UploadForm onUploaded={load} />

        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#6b5f4d] mb-3">Your submissions</p>
          {submissions.length === 0 ? (
            <div className="border-[3px] p-6" style={{ borderColor: INK, backgroundColor: PANEL }}>
              <p className="text-sm text-[#3c342a]">Nothing uploaded yet. Your first submission will show up here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <div key={s.id} className="border-[3px] p-4 flex items-start justify-between gap-4" style={{ borderColor: INK, backgroundColor: PANEL }}>
                  <div>
                    <p className="font-mono font-bold">{s.title}</p>
                    {s.synopsis && <p className="mt-1 text-sm text-[#3c342a]">{s.synopsis}</p>}
                    {s.reviewNote && (
                      <p className="mt-1 text-sm" style={{ color: RUST }}>{s.reviewNote}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Tag tone={submissionTone(s.status)}>{s.status}</Tag>
                    <p className="mt-1 font-mono text-[10px] text-[#6b5f4d]">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
