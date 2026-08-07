// Shared primitives for the creator portal (dashboard, settings, onboarding).
// Keeps the established call-sheet palette (paper/ink/rust) consistent
// across pages instead of every page redefining its own inline styles.
import type { ReactNode } from "react";

export const INK = "#161310";
export const PAPER = "#f2ead9";
export const PANEL = "#f7f1e3";
export const RUST = "#d1490f";
export const MUTED = "#6b5f4d";
export const LINE = "#e2d6bd";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `2px solid ${INK}`,
  background: PAPER,
  color: INK,
  fontFamily: "inherit",
  fontSize: 15,
  padding: "12px 14px",
};

export function Slug({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "rust" }) {
  return (
    <p
      className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]"
      style={{ color: tone === "rust" ? RUST : MUTED }}
    >
      {children}
    </p>
  );
}

export function Card({
  children,
  className = "",
  padding = "p-6",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div
      className={`border-[2.5px] ${padding} ${className}`}
      style={{ borderColor: INK, backgroundColor: PANEL }}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="border-[2.5px] p-5"
      style={{
        borderColor: INK,
        backgroundColor: accent ? INK : PANEL,
      }}
    >
      <Slug tone={accent ? "rust" : "muted"}>{label}</Slug>
      <p
        className="font-heading mt-1.5 text-4xl tracking-wide sm:text-5xl"
        style={{ color: accent ? PAPER : INK }}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 font-mono text-[11px]" style={{ color: accent ? "#c9bda3" : MUTED }}>
          {hint}
        </p>
      )}
    </div>
  );
}

const badgeTones: Record<string, { border: string; color: string; bg: string }> = {
  good: { border: INK, color: PAPER, bg: INK },
  bad: { border: RUST, color: RUST, bg: "transparent" },
  pending: { border: MUTED, color: MUTED, bg: "transparent" },
  neutral: { border: LINE, color: MUTED, bg: "transparent" },
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "good" | "bad" | "pending" | "neutral";
}) {
  const t = badgeTones[tone];
  return (
    <span
      className="inline-flex items-center font-mono text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1"
      style={{ border: `1.5px solid ${t.border}`, color: t.color, backgroundColor: t.bg }}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ backgroundColor: LINE, opacity: 0.6 }}
    />
  );
}
