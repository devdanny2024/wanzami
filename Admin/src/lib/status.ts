// Single source for status colors across the admin. Every badge/dot pulls from
// here so Movies, PPV, Payments, etc. read the same. The Coming/Leaving tones
// deliberately match the storefront badges customers see.
export type StatusTone =
  | "live"
  | "coming"
  | "leaving"
  | "pending"
  | "neutral"
  | "error";

type ToneStyle = { dot: string; badge: string };

export const TONE_STYLES: Record<StatusTone, ToneStyle> = {
  live: { dot: "bg-emerald-400", badge: "bg-emerald-500/20 text-emerald-300" },
  coming: { dot: "bg-sky-400", badge: "bg-sky-500/20 text-sky-300" },
  leaving: { dot: "bg-rose-400", badge: "bg-rose-500/20 text-rose-300" },
  pending: { dot: "bg-amber-400", badge: "bg-amber-500/20 text-amber-300" },
  neutral: { dot: "bg-neutral-400", badge: "bg-neutral-700 text-neutral-200" },
  error: { dot: "bg-red-400", badge: "bg-red-500/20 text-red-300" },
};

// Maps a Title's flags to a single visible status. Order matters: archived and
// pending-review win over availability so the operator sees the blocking state.
export function titleStatus(t: {
  archived?: boolean;
  pendingReview?: boolean;
  availability?: "LIVE" | "COMING_SOON" | "LEAVING_SOON";
}): { tone: StatusTone; label: string } {
  if (t.archived) return { tone: "neutral", label: "Archived" };
  if (t.pendingReview) return { tone: "pending", label: "Pending review" };
  if (t.availability === "COMING_SOON") return { tone: "coming", label: "Coming Soon" };
  if (t.availability === "LEAVING_SOON") return { tone: "leaving", label: "Leaving Soon" };
  return { tone: "live", label: "Live" };
}
