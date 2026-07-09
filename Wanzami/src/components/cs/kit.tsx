import type { ReactNode, CSSProperties } from "react";

/* Call Sheet kit — shared paper building blocks for the storefront redesign.
   Mirrors the admin's cs/kit.tsx and the mobile callsheet_kit.dart: warm paper
   surfaces, ink borders, hard offset shadows, mono slugs, Bebas display type.
   Colors come from the --color-cs-* tokens in globals.css. */

export function Slug({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`cs-slug ${className}`}>{children}</p>;
}

export function Sticker({
  children,
  rotate = 2,
  className = "",
}: {
  children: ReactNode;
  rotate?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-block bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-cs-ink cs-shadow-sm transition-transform duration-200 hover:rotate-0 ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

export function Stamp({
  children,
  rotate = -6,
}: {
  children: ReactNode;
  rotate?: number;
}) {
  return (
    <span
      className="inline-block border-[2.5px] border-cs-rust px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-cs-rust"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}

/* Perforated film-strip edge used on dark interstitials. */
export function Sprockets({ count = 18 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="flex justify-between gap-2 px-3">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="h-3.5 w-2.5 rounded-[2px] bg-cs-paper" />
      ))}
    </div>
  );
}

/* Bordered paper card with the signature hard shadow. */
export function CsPanel({
  children,
  className = "",
  panel = false,
  shadow = "md",
  style,
}: {
  children: ReactNode;
  className?: string;
  panel?: boolean;
  shadow?: "none" | "sm" | "md" | "lg";
  style?: CSSProperties;
}) {
  const shadowClass =
    shadow === "none" ? "" : shadow === "sm" ? "cs-shadow-sm" : shadow === "lg" ? "cs-shadow-lg" : "cs-shadow";
  return (
    <div
      className={`cs-border ${shadowClass} ${panel ? "bg-cs-panel" : "bg-cs-paper"} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function CsButton({
  children,
  onClick,
  href,
  variant = "ink",
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "ink" | "rust" | "outline";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const variants: Record<string, string> = {
    ink: "bg-cs-ink text-cs-paper",
    rust: "bg-cs-rust text-cs-paper cs-shadow-sm",
    outline: "bg-cs-paper text-cs-ink cs-border",
  };
  const base = `inline-flex items-center justify-center gap-2 font-mono font-bold uppercase tracking-[0.07em] text-sm px-5 py-3 min-h-[44px] transition-transform active:translate-y-px disabled:opacity-50 hover:-translate-y-0.5 ${variants[variant]} ${className}`;
  if (href) {
    return (
      <a href={href} className={base}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>
      {children}
    </button>
  );
}

export function CsTag({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "good" | "bad" | "pending" | "neutral";
  className?: string;
}) {
  const tones: Record<string, string> = {
    good: "border-cs-ink text-cs-ink",
    bad: "border-cs-rust text-cs-rust",
    pending: "border-cs-muted text-cs-muted",
    neutral: "border-cs-line text-cs-muted",
  };
  return (
    <span
      className={`inline-block border-[1.5px] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* Slug + big Bebas headline, the standard section opener. */
export function SectionHeading({
  slug,
  title,
  accent,
  className = "",
}: {
  slug?: string;
  title: ReactNode;
  accent?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {slug ? <Slug className="mb-2">{slug}</Slug> : null}
      <h2 className="font-heading uppercase tracking-wide text-3xl sm:text-5xl leading-[0.9] text-cs-ink">
        {title}
        {accent ? <span className="text-cs-rust"> {accent}</span> : null}
      </h2>
    </div>
  );
}
