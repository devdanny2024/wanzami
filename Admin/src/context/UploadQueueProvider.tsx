import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { UploadTask } from "@/components/UploadDock";
import { initUpload, uploadMultipart } from "@/lib/uploadClient";
import { authFetch } from "@/lib/authClient";

type QueueTask = UploadTask & {
  file?: File;
  targetId?: number;
  kind: "MOVIE" | "EPISODE" | "SERIES";
  jobId?: string;
  rendition?: string;
  assetKind?: "poster" | "thumbnail" | "trailer";
  assetField?: "posterUrl" | "thumbnailUrl" | "trailerUrl" | "shortTrailerUrl";
};

type UploadQueueContextValue = {
  tasks: QueueTask[];
  startUpload: (kind: QueueTask["kind"], targetId: number, file: File, rendition?: string) => void;
  startAssetUpload: (
    kind: "MOVIE" | "SERIES",
    targetId: number,
    file: File,
    assetKind: QueueTask["assetKind"],
    assetField: QueueTask["assetField"]
  ) => void;
  retryTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearTasks: () => void;
};

const UploadQueueContext = createContext<UploadQueueContextValue | undefined>(undefined);

export function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [running, setRunning] = useState(false);
  const activeCount = useRef(0);
  const MAX_CONCURRENCY = 3;
  const STORAGE_KEY = "wanzami-upload-queue";

  // Restore queue (without file blobs) so the dock stays visible across navigation/reloads.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Omit<QueueTask, "file">[];
      setTasks(saved.map((t) => ({ ...t, file: undefined })));
    } catch (err) {
      console.error("Failed to restore upload queue", err);
    }
  }, []);

  // Persist queue state minus file blobs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const serializable = tasks.map(({ file: _file, ...rest }) => rest);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  }, [tasks]);

  useEffect(() => {
    if (!running) return;
    const next = tasks.find((t) => t.status === "pending");
    if (!next || activeCount.current >= MAX_CONCURRENCY) return;
    activeCount.current += 1;
    setTasks((prev) => prev.map((t) => (t.id === next.id ? { ...t, status: "uploading" } : t)));
    void handleUpload(next).finally(() => {
      activeCount.current -= 1;
      setTimeout(() => setRunning(true), 0);
    });
  }, [running, tasks]);

  const handleUpload = async (task: QueueTask) => {
    try {
      if (!task.file) throw new Error("Missing file");
      if (task.assetKind && task.assetField) {
        await handleAssetUpload(task);
        return;
      }
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const startTime = performance.now();
      const init = await initUpload(
        {
          kind: task.kind,
          titleId: task.kind === "MOVIE" || task.kind === "SERIES" ? task.targetId : undefined,
          episodeId: task.kind === "EPISODE" ? task.targetId : undefined,
          rendition: task.rendition,
          file: task.file,
        },
        token ?? undefined
      );
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, jobId: init.jobId } : t)));
      await uploadMultipart(task.file, init, token, (p) => {
        const elapsed = (performance.now() - startTime) / 1000;
        const speed = elapsed > 0 ? (p.uploadedBytes * 8) / (elapsed * 1_000_000) : undefined;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, progress: Math.round((p.uploadedBytes / p.totalBytes) * 100), speedMbps: speed }
              : t
          )
        );
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "processing", progress: 100, speedMbps: undefined } : t))
      );
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: "failed", error: err?.message ?? "Upload failed" } : t
        )
      );
    }
  };

  const handleAssetUpload = async (task: QueueTask) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!task.targetId) throw new Error("Missing target id");
    if (!task.assetKind || !task.assetField) throw new Error("Missing asset metadata");
    const presign = await authFetch("/admin/assets/presign", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({
        contentType: task.file?.type || "application/octet-stream",
        kind: task.assetKind,
      }),
    });
    if (!presign.ok || !(presign.data as any)?.url || !(presign.data as any)?.key) {
      throw new Error((presign.data as any)?.message || "Failed to presign upload");
    }
    const uploadUrl = (presign.data as any).url as string;
    const publicUrl = (presign.data as any).publicUrl || (presign.data as any).key;
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": task.file?.type || "application/octet-stream" },
      body: task.file,
    });
    if (!putRes.ok) throw new Error("Upload failed");
    const patch = await authFetch(`/admin/titles/${task.targetId}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ [task.assetField]: publicUrl }),
    });
    if (!patch.ok) throw new Error((patch.data as any)?.message || "Failed to attach asset");
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: "completed", progress: 100 } : t))
    );
  };

  const startUpload = (kind: QueueTask["kind"], targetId: number, file: File, rendition?: string) => {
    const task: QueueTask = {
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      status: "pending",
      progress: 0,
      file,
      targetId,
      kind,
      rendition,
    };
    setTasks((prev) => [...prev, task]);
    setRunning(true);
  };

  const startAssetUpload = (
    kind: "MOVIE" | "SERIES",
    targetId: number,
    file: File,
    assetKind: QueueTask["assetKind"],
    assetField: QueueTask["assetField"]
  ) => {
    const label = assetKind ? `${assetKind} - ${file.name}` : file.name;
    const task: QueueTask = {
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      name: label,
      size: file.size,
      status: "pending",
      progress: 0,
      file,
      targetId,
      kind,
      assetKind: assetKind ?? undefined,
      assetField: assetField ?? undefined,
    };
    setTasks((prev) => [...prev, task]);
    setRunning(true);
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearTasks = () => {
    setTasks([]);
    activeCount.current = 0;
    setRunning(false);
  };

  const retryTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (!task.file) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "failed", error: "File missing. Re-select the file to resume." } : t
        )
      );
      return;
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "pending", progress: 0, error: undefined } : t
      )
    );
    setRunning(true);
  };

  // Poll backend for upload/transcode status to update dock (including PROCESSING -> COMPLETED/FAILED).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const hasInFlight = tasks.some((t) => t.jobId && (t.status === "processing" || t.status === "uploading"));
    if (!hasInFlight) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await authFetch("/admin/uploads", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const uploads = (res.data as any)?.uploads ?? [];
        if (!Array.isArray(uploads)) return;
        if (cancelled) return;
        setTasks((prev) =>
          prev.map((t) => {
            if (!t.jobId) return t;
            const job = uploads.find((u: any) => String(u.id) === String(t.jobId));
            if (!job) return t;
            if (job.status === "COMPLETED") {
              return { ...t, status: "completed", progress: 100, error: undefined };
            }
            if (job.status === "FAILED") {
              return { ...t, status: "failed", progress: 100, error: job.error ?? t.error };
            }
            if (job.status === "PROCESSING") {
              return { ...t, status: "processing", progress: 100 };
            }
            return t;
          })
        );
      } catch {
        // ignore polling errors
      }
    };

    const interval = setInterval(poll, 8000);
    void poll();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tasks]);

  // Auto-clear once every task is completed (no pending/uploading/processing).
  useEffect(() => {
    if (tasks.length === 0) return;
    const hasInFlight = tasks.some((t) => t.status === "pending" || t.status === "uploading" || t.status === "processing");
    const hasFailed = tasks.some((t) => t.status === "failed");
    if (hasInFlight || hasFailed) return;
    const timer = setTimeout(() => clearTasks(), 2000);
    return () => clearTimeout(timer);
  }, [tasks]);

  return (
    <UploadQueueContext.Provider value={{ tasks, startUpload, startAssetUpload, retryTask, removeTask, clearTasks }}>
      {children}
    </UploadQueueContext.Provider>
  );
}

export function useUploadQueue() {
  const ctx = useContext(UploadQueueContext);
  if (!ctx) {
    throw new Error("useUploadQueue must be used within UploadQueueProvider");
  }
  return ctx;
}
