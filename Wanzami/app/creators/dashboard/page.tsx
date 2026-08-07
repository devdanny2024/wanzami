'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "motion/react";
import { toast } from "sonner";
import {
  BarChart3,
  Check,
  ChevronDown,
  Coins,
  FilePenLine,
  Film,
  Plus,
  Search,
  Settings as SettingsIcon,
  Ticket,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  clearCreatorTokens,
  deleteDraft,
  fetchMe,
  fetchSubmissionAnalytics,
  fetchSubmissions,
  getCreatorTokens,
  type CreatorProfile,
  type CreatorSubmission,
  type DailyAnalytics,
} from "@/lib/creatorClient";
import { Badge, Card, INK, MUTED, PANEL, PAPER, RUST, Skeleton, Slug } from "../_components/kit";
import { TrendChart } from "../_components/TrendChart";
import { NotificationBell } from "../_components/NotificationBell";

const submissionTone = (status: CreatorSubmission["status"]) => {
  if (status === "APPROVED") return "good" as const;
  if (status === "REJECTED") return "bad" as const;
  if (status === "DRAFT") return "neutral" as const;
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
  if (status === "DRAFT") return null;
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

const listStagger: Variants = { animate: { transition: { staggerChildren: 0.06 } } };
const cardIn: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

function SubmissionCard({ s, onDeleted }: { s: CreatorSubmission; onDeleted: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [daily, setDaily] = useState<DailyAnalytics[] | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteDraft(s.id);
      toast.success(`Deleted "${s.title}"`);
      onDeleted(s.id);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not delete draft");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

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
          {s.status === "DRAFT" && (
            <div className="mt-2 flex flex-col items-end gap-2">
              <Link
                href={`/creators/submissions/${s.id}`}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wide underline"
                style={{ color: RUST }}
              >
                <FilePenLine className="h-3.5 w-3.5" />
                Resume
              </Link>
              <button
                onClick={() => void confirmDelete()}
                onBlur={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wide underline disabled:opacity-50"
                style={{ color: confirmingDelete ? RUST : MUTED }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deleting ? "Deleting…" : confirmingDelete ? "Confirm delete?" : "Delete"}
              </button>
            </div>
          )}
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
              href="/creators/earnings"
              className="hidden items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest hover:opacity-70 sm:inline-flex"
            >
              <Wallet className="h-3.5 w-3.5" />
              Earnings
            </Link>
            <NotificationBell />
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Slug>Welcome back</Slug>
            <h1 className="font-heading mt-1 text-4xl uppercase tracking-wide sm:text-5xl">{profile?.name}</h1>
          </div>
          <Link
            href="/creators/submissions/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider shadow-[4px_4px_0_#161310] transition-transform hover:-translate-y-0.5"
            style={{ backgroundColor: RUST, color: PAPER }}
          >
            <Plus className="h-4 w-4" />
            New submission
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCardLocal label="Submissions" value={String(submissions.length)} icon={Film} />
          <StatCardLocal label="Live" value={String(approvedCount)} icon={Check} accent />
          <StatCardLocal label="Total revenue" value={`₦${totalRevenue.toLocaleString()}`} icon={Coins} />
        </div>

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
                  Start your first submission and it'll show up here with its review status.
                </p>
                <Link
                  href="/creators/submissions/new"
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider"
                  style={{ backgroundColor: INK, color: PAPER }}
                >
                  <Plus className="h-4 w-4" />
                  New submission
                </Link>
              </Card>
            ) : (
              <motion.div
                variants={reducedMotion ? undefined : listStagger}
                initial={reducedMotion ? undefined : "initial"}
                animate={reducedMotion ? undefined : "animate"}
                className="space-y-3"
              >
                {submissions.map((s) => (
                  <SubmissionCard
                    key={s.id}
                    s={s}
                    onDeleted={(id) => setSubmissions((prev) => prev.filter((x) => x.id !== id))}
                  />
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
