import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Square, RotateCw, AlertTriangle } from "lucide-react";
import { CsBox, CsButton, CsSlug } from "./cs/kit";

/* A live campaign is 495 recipients queued in hourly batches, so it runs for
   most of a day. This panel exists so the operator can watch it and stop it
   without going through an engineer. */

type Failure = {
  id: string;
  batch: number;
  recipients: number;
  reason: string;
  attempts: number;
};

type Status = {
  paused: boolean;
  counts: Record<string, number>;
  sent: number;
  failedRecipients: number;
  inFlight: number;
  remaining: number;
  subject: string | null;
  failures: Failure[];
};

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const label: React.CSSProperties = {
  fontFamily: "var(--font-smono), monospace",
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--cs-muted)",
};

function Stat({ k, v, tone }: { k: string; v: number | string; tone?: "brand" | "rust" }) {
  return (
    <div style={{ border: "1.5px solid var(--cs-line)", padding: "9px 11px" }}>
      <div style={label}>{k}</div>
      <div
        className="cs-display"
        style={{
          fontSize: 26,
          lineHeight: 1,
          marginTop: 3,
          color:
            tone === "rust" ? "var(--cs-rust)" : tone === "brand" ? "var(--cs-brand)" : "var(--cs-ink)",
        }}
      >
        {v}
      </div>
    </div>
  );
}

export function CampaignMonitor() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email/campaign/status", { headers: authHeaders() });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setStatus(await res.json());
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "Could not read campaign status");
    }
  }, []);

  useEffect(() => {
    void load();
    timer.current = window.setInterval(() => void load(), 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [load]);

  const act = async (path: string, key: string) => {
    setBusy(key);
    try {
      await fetch(`/api/admin/email/campaign/${path}`, { method: "POST", headers: authHeaders() });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Action failed");
    } finally {
      setBusy(null);
      setConfirmingCancel(false);
    }
  };

  const total = status ? status.sent + status.inFlight + status.remaining : 0;
  const pct = total > 0 && status ? Math.round((status.sent / total) * 100) : 0;
  const idle = status ? status.inFlight === 0 && status.remaining === 0 : false;

  return (
    <CsBox className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <CsSlug>Campaign monitor</CsSlug>
          <p className="cs-display" style={{ fontSize: 24, lineHeight: 1, marginTop: 4 }}>
            {idle ? "No send running" : status?.paused ? "Paused" : "Sending"}
          </p>
          {status?.subject ? (
            <p style={{ ...label, marginTop: 4, textTransform: "none" }}>{status.subject}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {status?.paused ? (
            <CsButton variant="rust" onClick={() => act("resume", "resume")} disabled={busy !== null}>
              <span className="inline-flex items-center gap-2">
                <Play className="w-3.5 h-3.5" /> Resume
              </span>
            </CsButton>
          ) : (
            <CsButton variant="outline" onClick={() => act("pause", "pause")} disabled={busy !== null || idle}>
              <span className="inline-flex items-center gap-2">
                <Pause className="w-3.5 h-3.5" /> Pause
              </span>
            </CsButton>
          )}
          <CsButton
            variant="outline"
            onClick={() => (confirmingCancel ? act("cancel", "cancel") : setConfirmingCancel(true))}
            disabled={busy !== null || idle}
          >
            <span className="inline-flex items-center gap-2">
              <Square className="w-3.5 h-3.5" />
              {confirmingCancel ? "Tap again to stop" : "Stop"}
            </span>
          </CsButton>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between" style={label}>
          <span>Progress</span>
          <span>
            {status?.sent ?? 0} of {total} &middot; {pct}%
          </span>
        </div>
        <div
          className="mt-1"
          style={{ height: 10, border: "1.5px solid var(--cs-ink)", background: "var(--cs-panel)" }}
        >
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--cs-brand)" }} />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        <Stat k="Sent" v={status?.sent ?? 0} tone="brand" />
        <Stat k="In flight" v={status?.inFlight ?? 0} />
        <Stat k="Remaining" v={status?.remaining ?? 0} />
        <Stat k="Failed" v={status?.failedRecipients ?? 0} tone="rust" />
      </div>

      {confirmingCancel ? (
        <p style={{ ...label, color: "var(--cs-rust)", marginTop: 10, textTransform: "none" }}>
          Stopping drops every batch that has not started. Batches already with the worker will finish.
        </p>
      ) : null}

      {status && status.failures.length > 0 ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <CsSlug>Failed batches</CsSlug>
            <CsButton
              variant="outline"
              onClick={() => act("retry-failed", "retry")}
              disabled={busy !== null}
            >
              <span className="inline-flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5" /> Retry all
              </span>
            </CsButton>
          </div>
          <div className="mt-2 space-y-1">
            {status.failures.map((f) => (
              <div
                key={f.id}
                className="flex items-start gap-2"
                style={{ border: "1.5px solid var(--cs-line)", padding: "7px 9px" }}
              >
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: "var(--cs-rust)", flex: "none" }} />
                <div className="min-w-0">
                  <div style={label}>
                    Batch from #{f.batch} &middot; {f.recipients} recipients &middot; {f.attempts} attempts
                  </div>
                  <div style={{ fontSize: 12, color: "var(--cs-ink)" }}>{f.reason}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p style={{ ...label, color: "var(--cs-rust)", marginTop: 10, textTransform: "none" }}>{error}</p>
      ) : null}
    </CsBox>
  );
}
