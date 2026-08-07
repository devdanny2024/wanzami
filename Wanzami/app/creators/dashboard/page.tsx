'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "motion/react";
import {
  BarChart3,
  Check,
  ChevronDown,
  Coins,
  Film,
  Search,
  Settings as SettingsIcon,
  Ticket,
  UploadCloud,
  X,
} from "lucide-react";
import {
  clearCreatorTokens,
  fetchMe,
  fetchSubmissionAnalytics,
  fetchSubmissions,
  getCreatorTokens,
  uploadSubmission,
  type CreatorProfile,
  type CreatorSubmission,
  type DailyAnalytics,
} from "@/lib/creatorClient";
import { Badge, Card, INK, MUTED, PANEL, PAPER, RUST, Skeleton, Slug } from "../_components/kit";
import { TrendChart } from "../_components/TrendChart";

const submissionTone = (status: CreatorSubmission["status"]) => {
  if (status === "APPROVED") return "good" as const;
  if (status === "REJECTED") return "bad" as const;
  return "pending" as const;
};

const REVIEW_STEPS = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "APPROVED", label: "Approved" },
] as const;

function ReviewTimeline({ status }: { status: CreatorSubmission["status"] }) {
  if (status === "REJECTED") {
    return (
      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: RUST }}>
        <X className="h-3.5 w-3.5" />
        Not approved
      </div>
    );
  }
  const activeIndex =
    status === "UPLOADING" ? -1 : REVIEW_STEPS.findIndex((s) => s.key === status || status === "APPROVED");
  const resolvedIndex = status === "APPROVED" ? 2 : status === "IN_REVIEW" ? 1 : status === "SUBMITTED" ? 0 : -1;

  return (
    <div className="flex items-center gap-1.5">
      {REVIEW_STEPS.map((step, i) => {
        const done = i <= resolvedIndex;
        return (
          <div key={step.key} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 rounded-full transition-colors duration-300"
              style={{ backgroundColor: done ? RUST : "transparent", border: `1.5px solid ${done ? RUST : MUTED}` }}
            />
            {i < REVIEW_STEPS.length - 1 && (
              <div className="h-[1.5px] w-4" style={{ backgroundColor: i < resolvedIndex ? RUST : "#d8cbac" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadDropzone({ onUploaded }: { onUploaded: () => void }) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    setError(null);
    setFile(f);
  };

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
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2400);
      onUploaded();
    } catch (err: any) {
      setError(err?.message ?? "Upload failed");
    } finally {
      setProgress(null);
    }
  };

  const uploading = progress !== null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <Slug>Submit a film</Slug>
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wide"
              style={{ color: INK }}
            >
              <Check className="h-3.5 w-3.5" style={{ color: RUST }} />
              Uploaded
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: MUTED }}>Title</span>
            <input
              className="mt-1.5 w-full border-2 px-3.5 py-2.5 text-sm"
              style={{ borderColor: INK, backgroundColor: PAPER, color: INK }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              disabled={uploading}
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: MUTED }}>Synopsis (optional)</span>
            <input
              className="mt-1.5 w-full border-2 px-3.5 py-2.5 text-sm"
              style={{ borderColor: INK, backgroundColor: PAPER, color: INK }}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              maxLength={2000}
              disabled={uploading}
            />
          </label>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploading) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (uploading) return;
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) pickFile(dropped);
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-8 text-center transition-colors"
          style={{
            borderColor: dragging ? RUST : INK,
            backgroundColor: dragging ? "#fbeee1" : PAPER,
            opacity: uploading ? 0.6 : 1,
            pointerEvents: uploading ? "none" : "auto",
          }}
        >
          <UploadCloud className="h-7 w-7" style={{ color: dragging ? RUST : MUTED }} />
          {file ? (
            <div>
              <p className="font-mono text-sm font-bold">{file.name}</p>
              <p className="mt-0.5 font-mono text-[11px]" style={{ color: MUTED }}>{formatBytes(file.size)}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium">Drag your film here, or click to browse</p>
              <p className="mt-0.5 font-mono text-[11px]" style={{ color: MUTED }}>Any video file, no size limit</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            className="hidden"
            disabled={uploading}
          />
        </label>

        <AnimatePresence>
          {uploading && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <div className="h-2 w-full overflow-hidden border-[1.5px]" style={{ borderColor: INK, backgroundColor: PAPER }}>
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: RUST }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                />
              </div>
              <p className="mt-1.5 font-mono text-[11px]" style={{ color: MUTED }}>{progress}% uploaded</p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && <p className="text-sm font-medium" style={{ color: RUST }}>{error}</p>}

        <button
          type="submit"
          disabled={uploading || !file}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          style={{ backgroundColor: INK, color: PAPER }}
        >
          {uploading ? "Uploading…" : "Submit for review"}
        </button>
      </form>
    </Card>
  );
}

const listStagger: Variants = { animate: { transition: { staggerChildren: 0.06 } } };
const cardIn: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

function SubmissionCard({ s }: { s: CreatorSubmission }) {
  const [expanded, setExpanded] = useState(false);
  const [daily, setDaily] = useState<DailyAnalytics[] | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const hasAnalytics = s.status === "APPROVED" && s.metrics !== null;

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      setDaily(await fetchSubmissionAnalytics(s.id));
    } catch (err: any) {
      setAnalyticsError(err?.message ?? "Could not load analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && daily === null && !analyticsError) void loadAnalytics();
  };

  return (
    <motion.div variants={cardIn} className="border-[2.5px] p-5" style={{ borderColor: INK, backgroundColor: PANEL }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center border-2"
            style={{ borderColor: INK, backgroundColor: PAPER }}
          >
            <Film className="h-5 w-5" style={{ color: MUTED }} />
          </div>
          <div className="min-w-0">
            <p className="font-mono font-bold truncate">{s.title}</p>
            {s.synopsis && <p className="mt-1 text-sm" style={{ color: "#3c342a" }}>{s.synopsis}</p>}
            {s.reviewNote && (
              <p className="mt-1.5 text-sm font-medium" style={{ color: RUST }}>{s.reviewNote}</p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <Badge tone={submissionTone(s.status)}>{s.status.replace("_", " ")}</Badge>
              <ReviewTimeline status={s.status} />
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="font-mono text-[10px]" style={{ color: MUTED }}>
            {new Date(s.createdAt).toLocaleDateString()}
          </p>
          {s.status === "APPROVED" && (
            <div className="mt-3 space-y-1">
              {s.metrics ? (
                <>
                  <p className="inline-flex items-center gap-1.5 font-mono text-sm font-bold justify-end">
                    <Ticket className="h-3.5 w-3.5" style={{ color: RUST }} />
                    {s.metrics.purchases} buys
                  </p>
                  <p className="inline-flex items-center gap-1.5 font-mono text-[11px] justify-end" style={{ color: MUTED }}>
                    <Coins className="h-3 w-3" />
                    &#8358;{s.metrics.revenueNaira.toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="font-mono text-[10px]" style={{ color: MUTED }}>Not live yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {hasAnalytics && (
        <div className="mt-4 border-t pt-4" style={{ borderColor: "#d8cbac" }}>
          <button
            onClick={toggle}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] hover:opacity-70"
            style={{ color: MUTED }}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Revenue, last 30 days
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.span>
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  {loadingAnalytics ? (
                    <Skeleton className="h-[180px]" />
                  ) : analyticsError ? (
                    <div className="flex h-[180px] flex-col items-center justify-center gap-2 border-[1.5px] border-dashed" style={{ borderColor: RUST }}>
                      <p className="text-sm font-medium" style={{ color: RUST }}>{analyticsError}</p>
                      <button
                        onClick={() => void loadAnalytics()}
                        className="font-mono text-[11px] font-bold uppercase tracking-wide underline"
                        style={{ color: RUST }}
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <TrendChart daily={daily ?? []} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div style={{ backgroundColor: PAPER }} className="min-h-screen">
      <div className="border-b-[3px] py-3" style={{ borderColor: INK }}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 space-y-8">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [authFailed, setAuthFailed] = useState(false);
  const reducedMotion = useReducedMotion();

  const load = useCallback(async () => {
    try {
      const me = await fetchMe();
      if (!me.onboarded) {
        router.replace("/creators/onboarding");
        return;
      }
      const subs = await fetchSubmissions();
      setProfile(me);
      setSubmissions(subs);
    } catch {
      setAuthFailed(true);
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  if (loading) return <DashboardSkeleton />;

  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
  const totalRevenue = submissions.reduce((sum, s) => sum + (s.metrics?.revenueNaira ?? 0), 0);

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
      <header className="sticky top-0 z-50 border-b-[3px]" style={{ backgroundColor: PAPER, borderColor: INK }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em]">
            Wanzami Pictures &middot; Creator Dashboard
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/creators/settings"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest hover:opacity-70"
            >
              <SettingsIcon className="h-3.5 w-3.5" />
              Settings
            </Link>
            <button
              onClick={logout}
              className="font-mono text-[11px] uppercase tracking-widest underline hover:opacity-70"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 space-y-8">
        <div>
          <Slug>Welcome back</Slug>
          <h1 className="font-heading mt-1 text-4xl uppercase tracking-wide sm:text-5xl">{profile?.name}</h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCardLocal label="Submissions" value={String(submissions.length)} icon={Film} />
          <StatCardLocal label="Live" value={String(approvedCount)} icon={Check} accent />
          <StatCardLocal label="Total revenue" value={`₦${totalRevenue.toLocaleString()}`} icon={Coins} />
        </div>

        <UploadDropzone onUploaded={load} />

        <div>
          <Slug>Your submissions</Slug>
          <div className="mt-3">
            {submissions.length === 0 ? (
              <Card className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: PAPER, border: `2px solid ${INK}` }}>
                  <Search className="h-6 w-6" style={{ color: MUTED }} />
                </div>
                <p className="font-heading text-2xl uppercase tracking-wide">Nothing here yet</p>
                <p className="max-w-xs text-sm" style={{ color: "#3c342a" }}>
                  Submit your first film above and it'll show up here with its review status.
                </p>
              </Card>
            ) : (
              <motion.div
                variants={reducedMotion ? undefined : listStagger}
                initial={reducedMotion ? undefined : "initial"}
                animate={reducedMotion ? undefined : "animate"}
                className="space-y-3"
              >
                {submissions.map((s) => (
                  <SubmissionCard key={s.id} s={s} />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCardLocal({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon: typeof Film;
  accent?: boolean;
}) {
  return (
    <div
      className="border-[2.5px] p-5"
      style={{ borderColor: INK, backgroundColor: accent ? INK : PANEL }}
    >
      <div className="flex items-center justify-between">
        <Slug tone={accent ? "rust" : "muted"}>{label}</Slug>
        <Icon className="h-4 w-4" style={{ color: accent ? "#c9bda3" : MUTED }} />
      </div>
      <p className="font-heading mt-1.5 text-4xl tracking-wide sm:text-5xl" style={{ color: accent ? PAPER : INK }}>
        {value}
      </p>
    </div>
  );
}
