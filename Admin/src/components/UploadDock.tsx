import { useMemo, useState } from "react";
import { Progress } from "./ui/progress";
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
}

export function UploadDock({ tasks, serverJobs, onRemove, onClear, onRetry }: UploadDockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<"queue" | "jobs">("queue");

  const active = tasks.filter((t) => t.status !== "completed");
  const overallProgress = useMemo(
    () => (active.length > 0 ? active.reduce((sum, t) => sum + (t.progress || 0), 0) / active.length : 0),
    [active]
  );

  const statusLabel =
    tab === "queue"
      ? active.length
        ? `${active.length} active - ${tasks.length} total`
        : `${tasks.length} completed`
      : (() => {
          const activeJobs = serverJobs.filter((j) => j.status !== "COMPLETED");
          return activeJobs.length
            ? `${activeJobs.length} processing`
            : `${serverJobs.length} jobs`;
        })();

  if (!tasks.length && !serverJobs.length) return null;

  return (
    <div
      className="fixed right-4 z-40 w-full max-w-md"
      style={{ bottom: "1rem", top: "auto" }}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl backdrop-blur pointer-events-auto">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-300"
              aria-label="Toggle upload queue"
            >
              {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <div>
              <p className="text-white font-semibold text-sm">Upload queue</p>
              <p className="text-neutral-400 text-xs">{statusLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-neutral-800 text-xs">
              <button
                onClick={() => setTab("queue")}
                className={`px-2 py-1 ${
                  tab === "queue" ? "bg-neutral-800 text-white" : "bg-neutral-900 text-neutral-400"
                }`}
              >
                This session
              </button>
              <button
                onClick={() => setTab("jobs")}
                className={`px-2 py-1 ${
                  tab === "jobs" ? "bg-neutral-800 text-white" : "bg-neutral-900 text-neutral-400"
                }`}
              >
                Processing
              </button>
            </div>
            {tab === "queue" && active.length > 0 && (
              <div className="w-32">
                <Progress value={overallProgress} className="h-2" />
              </div>
            )}
            <button
              onClick={onClear}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
        {!collapsed && (
          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-800">
            {tab === "queue"
              ? tasks.map((t) => (
                  <div key={t.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-white text-sm">{t.name}</p>
                      <p className="text-neutral-500 text-xs">
                        {(t.size / (1024 * 1024)).toFixed(1)} MB
                        {t.rendition ? ` - ${t.rendition}` : ""}
                        {t.assetKind ? ` - ${t.assetKind}` : ""} - {t.status}
                        {typeof t.progress === "number" ? ` - ${t.progress}%` : ""}
                        {t.speedMbps ? ` - ${t.speedMbps.toFixed(1)} Mbps` : ""}
                        {t.error ? ` - ${t.error}` : ""}
                      </p>
                      <Progress value={t.progress} className="h-2 mt-2" />
                    </div>
                    {t.status === "failed" && (
                      <button
                        onClick={() => onRetry(t.id)}
                        className="text-xs text-[#fd7e14] hover:text-[#ff9940]"
                      >
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(t.id)}
                      className="p-1 rounded hover:bg-neutral-800 text-neutral-500"
                      aria-label="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              : serverJobs.map((j) => {
                  const pct =
                    j.bytesTotal && j.bytesTotal > 0
                      ? Math.round((j.bytesUploaded / j.bytesTotal) * 100)
                      : j.status === "COMPLETED"
                      ? 100
                      : 0;
                  const isActive = j.status !== "COMPLETED" && j.status !== "FAILED";
                  return (
                    <div key={j.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-white text-sm">
                          {j.fileName || `Job ${j.id}`}
                        </p>
                        <p className="text-neutral-500 text-xs">
                          {j.kind ? `${j.kind}` : "Job"} - {j.status.toLowerCase()}
                          {j.error ? ` - ${j.error}` : ""}
                        </p>
                        <Progress value={pct} className="h-2 mt-2" />
                      </div>
                      {!isActive && (
                        <button
                          onClick={() => onRemove(j.id)}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-500"
                          aria-label="Remove"
                        >
                          <X className="w-4 h-4" />
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

