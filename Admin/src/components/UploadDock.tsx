import { Progress } from "./ui/progress";
import { X } from "lucide-react";

export type UploadTask = {
  id: string;
  name: string;
  size: number;
  status: "pending" | "uploading" | "processing" | "completed" | "failed";
  progress: number;
  speedMbps?: number;
  error?: string;
};

interface UploadDockProps {
  tasks: UploadTask[];
  onRemove: (id: string) => void;
}

export function UploadDock({ tasks, onRemove }: UploadDockProps) {
  if (!tasks.length) return null;

  const active = tasks.filter((t) => t.status !== "completed");
  const overallProgress =
    active.length > 0 ? active.reduce((sum, t) => sum + (t.progress || 0), 0) / active.length : 0;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40">
      {active.length > 0 && (
        <div className="h-1 mb-2 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      )}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl">
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Upload queue</p>
            <p className="text-neutral-400 text-xs">
              {active.length} active - {tasks.length} total
            </p>
          </div>
          <button
            onClick={() => tasks.forEach((t) => onRemove(t.id))}
            className="text-xs text-neutral-400 hover:text-white"
          >
            Clear
          </button>
        </div>
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
      </div>
    </div>
  );
}
