import { useMemo, useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

export type UploadTask = {
  id: string;
  name: string;
  size: number;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  progress: number;
  speedMbps?: number;
  error?: string;
  jobId?: string;
  rendition?: string;
  assetKind?: string;
};

interface UploadDockProps {
  tasks: UploadTask[];
  serverJobs: {
    id: string;
    status: string;
    bytesUploaded: number;
    bytesTotal: number | null;
    fileName?: string | null;
    kind?: string | null;
    error?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onRetry: (id: string) => void;
  onRetryJob?: (id: string) => void;
}

/** Call Sheet progress bar. Square, ink-bordered, brand fill. */
function Meter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{ height: 8, border: "1.5px solid var(--cs-ink)", background: "var(--cs-panel)" }}
    >
      <div style={{ width: `${pct}%`, height: "100%", background: "var(--cs-brand)" }} />
    </div>
  );
}

const slug: React.CSSProperties = {
  fontFamily: "var(--font-smono), monospace",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.11em",
  textTransform: "uppercase",
  color: "var(--cs-muted)",
};

const rowMeta: React.CSSProperties = {
  fontFamily: "var(--font-smono), monospace",
  fontSize: 10,
  color: "var(--cs-muted)",
};

export function UploadDock({
  tasks,
  serverJobs,
  onRemove,
  onClear,
  onRetry,
  onRetryJob,
}: UploadDockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<"queue" | "jobs">("queue");

  const active = useMemo(() => tasks.filter((t) => t.status !== "completed"), [tasks]);
  const liveJobs = useMemo(
    () => serverJobs.filter((j) => j.status !== "COMPLETED" && j.status !== "FAILED"),
    [serverJobs]
  );
  // Only failures the operator can still do something about. A transfer that
  // died three weeks ago is history, not a task, and shouldn't pin this panel
  // over the admin forever.
  const RECENT_MS = 24 * 60 * 60 * 1000;
  const failedJobs = useMemo(
    () =>
      serverJobs.filter((j) => {
        if (j.status !== "FAILED") return false;
        const touched = j.updatedAt ? Date.parse(j.updatedAt) : NaN;
        return Number.isNaN(touched) ? false : Date.now() - touched < RECENT_MS;
      }),
    [serverJobs, RECENT_MS]
  );

  const overallProgress = useMemo(
    () => (active.length > 0 ? active.reduce((sum, t) => sum + (t.progress || 0), 0) / active.length : 0),
    [active]
  );

  // Only surface the dock when something still needs watching or acting on.
  // Finished work stays out of the way: a completed history is not a reason to
  // keep a floating panel over the whole admin.
  const hasLiveWork = active.length > 0 || liveJobs.length > 0 || failedJobs.length > 0;
  if (!hasLiveWork) return null;

  // Show only the rows that matter for whichever tab is open.
  const queueRows = tasks.filter((t) => t.status !== "completed");
  const jobRows = [...liveJobs, ...failedJobs];

  const statusLabel =
    tab === "queue"
      ? active.length
        ? `${active.length} uploading`
        : "queue clear"
      : liveJobs.length
      ? `${liveJobs.length} processing`
      : failedJobs.length
      ? `${failedJobs.length} failed`
      : "all clear";

  const tabBtn = (isOn: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-smono), monospace",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "5px 9px",
    border: "1.5px solid var(--cs-ink)",
    background: isOn ? "var(--cs-ink)" : "var(--cs-paper)",
    color: isOn ? "#fff" : "var(--cs-ink)",
  });

  return (
    <div className="fixed right-4 z-40 w-full max-w-md" style={{ bottom: "1rem", top: "auto" }}>
      <div
        className="pointer-events-auto"
        style={{
          background: "var(--cs-paper)",
          border: "2.5px solid var(--cs-ink)",
          boxShadow: "5px 5px 0 var(--cs-ink)",
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between gap-3"
          style={{ borderBottom: collapsed ? "none" : "1.5px solid var(--cs-line)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand upload queue" : "Collapse upload queue"}
              style={{
                border: "1.5px solid var(--cs-ink)",
                background: "var(--cs-paper)",
                color: "var(--cs-ink)",
                padding: 3,
              }}
            >
              {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <div className="min-w-0">
              <p style={slug}>Transfer bay</p>
              <p
                className="truncate"
                style={{
                  fontFamily: "var(--font-bebas), Impact, sans-serif",
                  textTransform: "uppercase",
                  fontSize: 18,
                  lineHeight: 1,
                  color: "var(--cs-ink)",
                }}
              >
                {statusLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex">
              <button onClick={() => setTab("queue")} style={tabBtn(tab === "queue")}>
                Session
              </button>
              <button
                onClick={() => setTab("jobs")}
                style={{ ...tabBtn(tab === "jobs"), borderLeft: "none" }}
              >
                Processing
              </button>
            </div>
            <button
              onClick={onClear}
              style={{
                fontFamily: "var(--font-smono), monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--cs-rust)",
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {tab === "queue" && active.length > 0 ? (
          <div className="px-4 pt-3">
            <Meter value={overallProgress} />
          </div>
        ) : null}

        {!collapsed && (
          <div className="max-h-64 overflow-y-auto">
            {tab === "queue"
              ? queueRows.map((t) => (
                  <div
                    key={t.id}
                    className="px-4 py-3 flex items-center gap-3"
                    style={{ borderTop: "1px solid var(--cs-line)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="truncate"
                        style={{
                          fontFamily: "var(--font-smono), monospace",
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--cs-ink)",
                        }}
                      >
                        {t.name}
                      </p>
                      <p style={rowMeta}>
                        {(t.size / (1024 * 1024)).toFixed(1)} MB
                        {t.rendition ? ` · ${t.rendition}` : ""}
                        {t.assetKind ? ` · ${t.assetKind}` : ""} · {t.status}
                        {typeof t.progress === "number" ? ` · ${t.progress}%` : ""}
                        {t.speedMbps ? ` · ${t.speedMbps.toFixed(1)} Mbps` : ""}
                      </p>
                      {t.error ? (
                        <p style={{ ...rowMeta, color: "var(--cs-rust)" }}>{t.error}</p>
                      ) : null}
                      <div className="mt-2">
                        <Meter value={t.progress} />
                      </div>
                    </div>
                    {t.status === "failed" && (
                      <button
                        onClick={() => onRetry(t.id)}
                        style={{
                          fontFamily: "var(--font-smono), monospace",
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "5px 9px",
                          border: "1.5px solid var(--cs-rust)",
                          color: "var(--cs-rust)",
                        }}
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(t.id)}
                      aria-label={`Remove ${t.name}`}
                      style={{ color: "var(--cs-muted)", padding: 2 }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              : jobRows.map((j) => {
                  const pct =
                    j.bytesTotal && j.bytesTotal > 0
                      ? Math.round((j.bytesUploaded / j.bytesTotal) * 100)
                      : j.status === "COMPLETED"
                      ? 100
                      : 0;
                  const isActive = j.status !== "COMPLETED" && j.status !== "FAILED";
                  return (
                    <div
                      key={j.id}
                      className="px-4 py-3 flex items-center gap-3"
                      style={{ borderTop: "1px solid var(--cs-line)" }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="truncate"
                          style={{
                            fontFamily: "var(--font-smono), monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            color: "var(--cs-ink)",
                          }}
                        >
                          {j.fileName || `Job ${j.id}`}
                        </p>
                        <p style={rowMeta}>
                          {j.kind ? `${j.kind}` : "Job"} · {j.status.toLowerCase()}
                        </p>
                        {j.error ? (
                          <p style={{ ...rowMeta, color: "var(--cs-rust)" }}>{j.error}</p>
                        ) : null}
                        <div className="mt-2">
                          <Meter value={pct} />
                        </div>
                      </div>
                      {j.status === "FAILED" && onRetryJob && (
                        <button
                          onClick={() => onRetryJob(j.id)}
                          style={{
                            fontFamily: "var(--font-smono), monospace",
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "5px 9px",
                            border: "1.5px solid var(--cs-rust)",
                            color: "var(--cs-rust)",
                          }}
                        >
                          Retry
                        </button>
                      )}
                      {!isActive && (
                        <button
                          onClick={() => onRemove(j.id)}
                          aria-label="Dismiss job"
                          style={{ color: "var(--cs-muted)", padding: 2 }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
          </div>
        )}
      </div>
    </div>
  );
}
