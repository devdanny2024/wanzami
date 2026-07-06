import type { ReactNode } from "react";

/* Call Sheet kit — shared building blocks for the redesigned admin.
   Mirrors the mobile app's callsheet_kit.dart: paper surfaces, ink borders,
   hard shadows, mono slugs, Bebas display type. */

export function CsSlug({
  children,
  className = "",
  size = 10,
}: {
  children: ReactNode;
  className?: string;
  size?: number;
}) {
  return (
    <p
      className={`cs-mono font-bold uppercase ${className}`}
      style={{ fontSize: size, letterSpacing: "0.09em", color: "var(--cs-muted)" }}
    >
      {children}
    </p>
  );
}

export function CsBox({
  children,
  className = "",
  shadow = true,
  panel = false,
}: {
  children: ReactNode;
  className?: string;
  shadow?: boolean;
  panel?: boolean;
}) {
  return (
    <div
      className={`cs-border ${shadow ? "cs-shadow" : ""} ${className}`}
      style={{ background: panel ? "var(--cs-panel)" : "var(--cs-paper)" }}
    >
      {children}
    </div>
  );
}

export function CsStamp({ children }: { children: ReactNode }) {
  return (
    <span
      className="cs-mono inline-block font-bold uppercase"
      style={{
        border: "2.5px solid var(--cs-rust)",
        color: "var(--cs-rust)",
        padding: "2px 8px",
        fontSize: 10,
        letterSpacing: "0.12em",
        transform: "rotate(-4deg)",
      }}
    >
      {children}
    </span>
  );
}

export function CsSticker({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-block font-bold uppercase"
      style={{
        background: "var(--cs-brand)",
        color: "var(--cs-ink)",
        padding: "3px 10px",
        fontSize: 11,
        letterSpacing: "0.08em",
        transform: "rotate(2deg)",
        boxShadow: "3px 3px 0 var(--cs-ink)",
      }}
    >
      {children}
    </span>
  );
}

export function CsButton({
  children,
  onClick,
  variant = "ink",
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "ink" | "rust" | "outline";
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    ink: { background: "var(--cs-ink)", color: "#fff" },
    rust: { background: "var(--cs-rust)", color: "#fff", boxShadow: "3px 3px 0 var(--cs-ink)" },
    outline: { background: "var(--cs-paper)", color: "var(--cs-ink)", border: "2.5px solid var(--cs-ink)" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cs-mono font-bold uppercase transition-transform active:translate-y-px disabled:opacity-50 ${className}`}
      style={{
        ...styles[variant],
        fontSize: 12,
        letterSpacing: "0.07em",
        padding: "10px 18px",
      }}
    >
      {children}
    </button>
  );
}

export function CsPageHeader({
  title,
  chip,
  slug,
  actions,
}: {
  title: string;
  chip?: string;
  slug?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className="flex flex-wrap items-end justify-between gap-4 pb-4"
      style={{ borderBottom: "3px solid var(--cs-ink)" }}
    >
      <div>
        {slug ? <CsSlug className="mb-1">{slug}</CsSlug> : null}
        <div className="flex items-center gap-3">
          <h1 className="cs-display" style={{ fontSize: 40, color: "var(--cs-ink)" }}>
            {title}
          </h1>
          {chip ? (
            <span
              className="cs-mono cs-border-thin font-bold uppercase"
              style={{ fontSize: 10, padding: "2px 8px", color: "var(--cs-muted)" }}
            >
              {chip}
            </span>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function CsStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="cs-border cs-shadow-sm p-4" style={{ background: "var(--cs-paper)" }}>
      <CsSlug>{label}</CsSlug>
      <p className="cs-display mt-2" style={{ fontSize: 34, color: "var(--cs-ink)" }}>
        {value}
      </p>
      {hint ? (
        <p className="cs-mono mt-1" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function CsEmpty({ slug, body }: { slug: string; body: string }) {
  return (
    <div className="cs-border p-5" style={{ background: "var(--cs-panel)" }}>
      <CsSlug>{slug}</CsSlug>
      <p className="mt-2 text-sm" style={{ color: "var(--cs-ink)" }}>
        {body}
      </p>
    </div>
  );
}

export function CsTag({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "bad" | "pending" | "neutral";
}) {
  const colors: Record<string, { border: string; color: string }> = {
    good: { border: "var(--cs-ink)", color: "var(--cs-ink)" },
    bad: { border: "var(--cs-rust)", color: "var(--cs-rust)" },
    pending: { border: "var(--cs-muted)", color: "var(--cs-muted)" },
    neutral: { border: "var(--cs-line)", color: "var(--cs-muted)" },
  };
  const c = colors[tone];
  return (
    <span
      className="cs-mono inline-block font-bold uppercase"
      style={{
        fontSize: 9,
        letterSpacing: "0.1em",
        padding: "2px 7px",
        border: `1.5px solid ${c.border}`,
        color: c.color,
      }}
    >
      {label}
    </span>
  );
}

export type CsColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
};

export function CsTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  emptySlug = "Nothing filed here yet",
  emptyBody = "No records to show.",
}: {
  columns: CsColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptySlug?: string;
  emptyBody?: string;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-11" style={{ background: "var(--cs-panel)", border: "1.5px solid var(--cs-line)" }} />
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return <CsEmpty slug={emptySlug} body={emptyBody} />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2.5px solid var(--cs-ink)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="cs-mono py-2 px-3 font-bold uppercase"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.09em",
                  color: "var(--cs-ink)",
                  textAlign: col.align ?? "left",
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className="hover:bg-[var(--cs-panel)] transition-colors"
              style={{ borderBottom: "1.5px solid var(--cs-line)" }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="py-3 px-3 text-sm"
                  style={{ color: "var(--cs-ink)", textAlign: col.align ?? "left" }}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
