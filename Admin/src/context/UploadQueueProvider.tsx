import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { UploadTask } from "@/components/UploadDock";
import { initUpload, uploadMultipart } from "@/lib/uploadClient";

type QueueTask = UploadTask & { file?: File; targetId?: number; kind: "MOVIE" | "EPISODE" | "SERIES" };

type UploadQueueContextValue = {
  tasks: QueueTask[];
  startUpload: (kind: QueueTask["kind"], targetId: number, file: File) => void;
  removeTask: (id: string) => void;
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
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      const startTime = performance.now();
      const init = await initUpload(
        {
          kind: task.kind,
          titleId: task.kind === "MOVIE" ? task.targetId : undefined,
          episodeId: task.kind === "EPISODE" ? task.targetId : undefined,
          file: task.file,
        },
        token ?? undefined
      );
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
        prev.map((t) => (t.id === task.id ? { ...t, status: "processing", progress: 100 } : t))
      );
      // We don't yet poll transcoding state; mark as completed so the dock doesn't stick on "uploading".
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "completed", speedMbps: undefined } : t))
      );
    } catch (err: any) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: "failed", error: err?.message ?? "Upload failed" } : t
        )
      );
    }
  };

  const startUpload = (kind: QueueTask["kind"], targetId: number, file: File) => {
    const task: QueueTask = {
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      status: "pending",
      progress: 0,
      file,
      targetId,
      kind,
    };
    setTasks((prev) => [...prev, task]);
    setRunning(true);
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <UploadQueueContext.Provider value={{ tasks, startUpload, removeTask }}>
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
