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

export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/wanzami-logo.png" alt="Wanzami" className={className} />;
}

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

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: MUTED }}>
        {label}
        {required && <span style={{ color: RUST }}> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && (
        <p className="mt-1 font-mono text-[10px]" style={{ color: MUTED }}>
          {hint}
        </p>
      )}
    </label>
  );
}

export function StepIndicator({
  steps,
  current,
  onStepClick,
}: {
  steps: string[];
  current: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            <button
              type="button"
              onClick={() => onStepClick?.(i)}
              disabled={!onStepClick}
              className="flex items-center gap-2"
              style={{ cursor: onStepClick ? "pointer" : "default" }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 font-mono text-[11px] font-bold"
                style={{
                  borderColor: active || done ? RUST : LINE,
                  backgroundColor: done ? RUST : "transparent",
                  color: done ? PAPER : active ? RUST : MUTED,
                }}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className="hidden font-mono text-[11px] font-bold uppercase tracking-wide sm:inline"
                style={{ color: active ? INK : MUTED }}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className="mx-2 h-[1.5px] w-6 sm:w-10" style={{ backgroundColor: i < current ? RUST : LINE }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
