import { useEffect, useMemo, useState } from "react";
import { authFetch } from "@/lib/authClient";
import { CsBox, CsButton, CsEmpty, CsPageHeader, CsSlug, CsTag } from "./cs/kit";

type UploadJob = {
  id: string;
  status: "UPLOADING" | "PROCESSING" | "COMPLETED" | "FAILED";
  bytesUploaded?: number;
  bytesTotal?: number | null;
  processingPercent?: number | null;
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
};

const statusLabel = (status: UploadJob["status"]) => {
  switch (status) {
    case "UPLOADING":
      return "Uploading";
    case "PROCESSING":
      return "Processing";
    case "COMPLETED":
      return "Completed";
    case "FAILED":
      return "Failed";
    default:
      return status;
  }
};

const statusTone = (status: UploadJob["status"]): "good" | "bad" | "pending" | "neutral" => {
  switch (status) {
    case "UPLOADING":
      return "neutral";
    case "PROCESSING":
      return "pending";
    case "COMPLETED":
      return "good";
    case "FAILED":
      return "bad";
    default:
      return "neutral";
  }
};

const isOngoing = (status: UploadJob["status"]) => status === "UPLOADING" || status === "PROCESSING";

type TabKey = "ongoing" | "completed" | "failed" | "all";

const tabStyle = (active: boolean): React.CSSProperties => ({
  border: "2px solid var(--cs-ink)",
  background: active ? "var(--cs-ink)" : "var(--cs-paper)",
  color: active ? "#fff" : "var(--cs-ink)",
  padding: "8px 14px",
  fontSize: 11,
});

export function ProcessManagement() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
   const [backfillRunning, setBackfillRunning] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("ongoing");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await authFetch("/admin/uploads", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(res.data?.message || "Failed to load processes");
      setJobs((res.data as any)?.uploads ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load processes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    void fetchJobs();
    const interval = setInterval(() => {
      if (!mounted) return;
      void fetchJobs();
    }, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const ongoing = useMemo(() => jobs.filter((j) => j.status === "PROCESSING"), [jobs]);
  const completed = useMemo(() => jobs.filter((j) => j.status === "COMPLETED"), [jobs]);
  const failed = useMemo(() => jobs.filter((j) => j.status === "FAILED"), [jobs]);
  const processesOnly = useMemo(() => jobs.filter((j) => j.status !== "UPLOADING"), [jobs]);

  const handleRetry = async (job: UploadJob) => {
    try {
      setActionId(job.id);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await authFetch(`/admin/uploads/${job.id}/retry`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error(res.data?.message || "Failed to requeue transcode");
      }
      await fetchJobs();
    } catch (err: any) {
      setError(err?.message || "Failed to requeue transcode");
    } finally {
      setActionId(null);
    }
  };

  const handleBackfill = async () => {
    try {
      setBackfillRunning(true);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const res = await authFetch("/admin/uploads/backfill-transcodes", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ limit: 10 }),
      });
      if (!res.ok) {
        throw new Error(res.data?.message || "Failed to start backfill");
      }
      await fetchJobs();
    } catch (err: any) {
      setError(err?.message || "Failed to start backfill");
    } finally {
      setBackfillRunning(false);
    }
  };

  const renderList = (items: UploadJob[]) => {
    if (items.length === 0) {
      return <CsEmpty slug="Nothing here" body="No processes found." />;
    }
    return (
      <div className="space-y-3">
        {items.map((job) => {
          const total = job.bytesTotal ?? undefined;
          const uploaded = job.bytesUploaded ?? 0;
          const percent =
            job.status === "PROCESSING"
              ? job.processingPercent ?? undefined
              : job.status === "COMPLETED"
              ? 100
              : total
              ? Math.round((uploaded / total) * 100)
              : undefined;
          const canRetry = job.status === "FAILED" || job.status === "PROCESSING";
          const actionLabel = job.status === "FAILED" ? "Retry" : "Restart";
          return (
            <CsBox key={job.id} shadow={false} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="cs-mono text-sm font-bold" style={{ color: 'var(--cs-ink)' }}>Job #{job.id}</p>
                  <p className="cs-mono mt-1" style={{ fontSize: 10, color: 'var(--cs-muted)' }}>
                    {job.createdAt ? new Date(job.createdAt).toLocaleString() : "Unknown time"}
                  </p>
                </div>
                <CsTag label={statusLabel(job.status)} tone={statusTone(job.status)} />
              </div>
              <div className="cs-mono mt-2" style={{ fontSize: 11, color: 'var(--cs-muted)' }}>
                {job.status === "PROCESSING" ? "Transcoding" : `${formatBytes(uploaded)} / ${formatBytes(total)}`}
                {typeof percent === "number" ? ` - ${percent}%` : ""}
              </div>
              {job.error && (
                <p className="cs-mono mt-1" style={{ fontSize: 11, color: 'var(--cs-rust)' }}>Error: {job.error}</p>
              )}
              {canRetry && (
                <div className="flex justify-end mt-3">
                  <CsButton variant="rust" disabled={actionId === job.id} onClick={() => handleRetry(job)}>
                    {actionId === job.id ? "Requeuing…" : actionLabel}
                  </CsButton>
                </div>
              )}
            </CsBox>
          );
        })}
      </div>
    );
  };

  const tabs: { key: TabKey; label: string; items: UploadJob[] }[] = [
    { key: "ongoing", label: `Ongoing (${ongoing.length})`, items: ongoing },
    { key: "completed", label: `Completed (${completed.length})`, items: completed },
    { key: "failed", label: `Failed (${failed.length})`, items: failed },
    { key: "all", label: `All (${processesOnly.length})`, items: processesOnly },
  ];
  const activeItems = tabs.find((t) => t.key === activeTab)?.items ?? [];

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The cutting room"
        chip={`${processesOnly.length} processes`}
        slug="Transcode processes · encoding pipeline"
        actions={
          <div className="flex items-center gap-3">
            <CsButton variant="outline" onClick={handleBackfill} disabled={backfillRunning}>
              {backfillRunning ? "Starting…" : "Backfill old titles"}
            </CsButton>
            <CsButton variant="ink" onClick={fetchJobs}>
              Refresh
            </CsButton>
          </div>
        }
      />

      <CsBox className="p-5">
        <CsSlug>Status</CsSlug>
        <div className="mt-4">
          {loading && (
            <p className="cs-mono text-xs" style={{ color: 'var(--cs-muted)' }}>Loading…</p>
          )}
          {error && (
            <div className="cs-border p-4 mb-4" style={{ borderColor: 'var(--cs-rust)' }}>
              <p className="cs-mono text-xs font-bold uppercase" style={{ color: 'var(--cs-rust)' }}>
                {error}
              </p>
            </div>
          )}
          {!loading && !error && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className="cs-mono font-bold uppercase"
                    style={tabStyle(activeTab === t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {renderList(activeItems)}
            </>
          )}
        </div>
      </CsBox>
    </div>
  );
}
