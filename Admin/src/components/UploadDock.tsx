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
};

interface UploadDockProps {
  tasks: UploadTask[];
  onRemove: (id: string) => void;
}

export function UploadDock({ tasks, onRemove }: UploadDockProps) {
  const [collapsed, setCollapsed] = useState(false);
  if (!tasks.length) return null;

  const active = tasks.filter((t) => t.status !== "completed");
  const overallProgress = useMemo(
    () => (active.length > 0 ? active.reduce((sum, t) => sum + (t.progress || 0), 0) / active.length : 0),
    [active]
  );
  const statusLabel = active.length
    ? `${active.length} active - ${tasks.length} total`
    : `${tasks.length} completed`;

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center pointer-events-none px-3">
      <div className="bg-neutral-900/95 border border-neutral-800 rounded-xl shadow-2xl backdrop-blur w-[95%] max-w-3xl pointer-events-auto">
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
            {active.length > 0 && (
              <div className="w-32">
                <Progress value={overallProgress} className="h-2" />
              </div>
            )}
            <button
              onClick={() => tasks.forEach((t) => onRemove(t.id))}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
        {!collapsed && (
          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-800">
            {tasks.map((t) => (
              <div key={t.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-white text-sm">{t.name}</p>
                  <p className="text-neutral-500 text-xs">
                    {(t.size / (1024 * 1024)).toFixed(1)} MB - {t.status}
                    {t.speedMbps ? ` - ${t.speedMbps.toFixed(1)} Mbps` : ""}
                    {t.error ? ` - ${t.error}` : ""}
                  </p>
                  <Progress value={t.progress} className="h-2 mt-2" />
                </div>
                <button
                  onClick={() => onRemove(t.id)}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-500"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
