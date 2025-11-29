import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Progress } from "./ui/progress";
import { toast } from "sonner";
import { Upload, Pause, Play, X } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "completed" | "failed";

type UploadTask = {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  speed?: number;
  error?: string;
};

type InitResponse = {
  jobId: string;
  uploadId: string;
  key: string;
  partSize: number;
  partCount: number;
  presignedParts: { partNumber: number; url: string }[];
};

const renditions = ["R4K", "R2K", "R1080", "R720", "R360"];

export function UploadsManager() {
  const [files, setFiles] = useState<UploadTask[]>([]);
  const [kind, setKind] = useState<"MOVIE" | "SERIES" | "EPISODE">("MOVIE");
  const [titleName, setTitleName] = useState("");
  const [titleId, setTitleId] = useState("");
  const [episodeName, setEpisodeName] = useState("");
  const [seasonNumber, setSeasonNumber] = useState(1);
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [maxConcurrency, setMaxConcurrency] = useState(10);
  const [running, setRunning] = useState(false);
  const activeCount = useRef(0);

  const authHeaders = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const onFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const newTasks: UploadTask[] = Array.from(fileList).map((f) => ({
      id: `${Date.now()}-${f.name}-${Math.random().toString(36).slice(2)}`,
      file: f,
      status: "idle",
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newTasks]);
  };

  const startQueue = () => {
    setRunning(true);
  };

  const stopQueue = () => {
    setRunning(false);
  };

  useEffect(() => {
    if (!running) return;
    const runNext = async () => {
      const idle = files.find((t) => t.status === "idle");
      if (!idle) return;
      if (activeCount.current >= maxConcurrency) return;
      activeCount.current += 1;
      setFiles((prev) => prev.map((t) => (t.id === idle.id ? { ...t, status: "uploading" } : t)));
      try {
        await uploadFile(idle);
        setFiles((prev) => prev.map((t) => (t.id === idle.id ? { ...t, status: "completed", progress: 100 } : t)));
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((t) =>
            t.id === idle.id ? { ...t, status: "failed", error: err?.message ?? "Upload failed" } : t
          )
        );
        toast.error(`Upload failed: ${idle.file.name}`);
      } finally {
        activeCount.current -= 1;
        setTimeout(runNext, 0);
      }
    };
    runNext();
  }, [running, files, maxConcurrency]);

  const uploadFile = async (task: UploadTask) => {
    const body = {
      kind,
      titleId: titleId ? Number(titleId) : undefined,
      titleName: titleName || task.file.name,
      episodeName: episodeName || task.file.name,
      seasonNumber,
      episodeNumber,
      fileName: task.file.name,
      bytesTotal: task.file.size,
      renditions,
      contentType: task.file.type || "application/octet-stream",
    };
    const initRes = await fetch("/api/admin/uploads/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(body),
    });
    const initData: InitResponse = await initRes.json();
    if (!initRes.ok) throw new Error(initData as any);

    const parts = await uploadParts(task, initData);
    const completeRes = await fetch(`/api/admin/uploads/${initData.jobId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        uploadId: initData.uploadId,
        key: initData.key,
        parts,
        renditions,
      }),
    });
    if (!completeRes.ok) {
      throw new Error("Complete failed");
    }
  };

  const uploadParts = async (task: UploadTask, init: InitResponse) => {
    const parts: { ETag: string; PartNumber: number }[] = [];
    const startTime = performance.now();
    for (const p of init.presignedParts) {
      const start = (p.partNumber - 1) * init.partSize;
      const end = Math.min(start + init.partSize, task.file.size);
      const blob = task.file.slice(start, end);
      const res = await fetch(p.url, {
        method: "PUT",
        body: blob,
      });
      if (!res.ok) throw new Error(`Part ${p.partNumber} failed`);
      const etag = res.headers.get("etag") ?? `part-${p.partNumber}`;
      parts.push({ ETag: etag, PartNumber: p.partNumber });
      const elapsed = (performance.now() - startTime) / 1000;
      const uploaded = end;
      const progress = Math.round((uploaded / task.file.size) * 100);
      const speed = uploaded / (elapsed || 1);
      setFiles((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, progress, speed: Math.round(speed / 1024 / 1024) } : t
        )
      );
      await fetch(`/api/admin/uploads/${init.jobId}/progress`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ bytesUploaded: uploaded }),
      }).catch(() => {});
    }
    return parts;
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((t) => t.status !== "completed"));
  };

  const queued = useMemo(() => files.filter((f) => f.status !== "completed"), [files]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-white">Uploads</h1>
        <p className="text-neutral-400 mt-1">
          Upload movies/series with renditions and track progress. Default concurrency: {maxConcurrency}.
        </p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">New upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-neutral-300 mb-2">Type</p>
              <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                <SelectTrigger className="bg-neutral-950 border-neutral-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOVIE">Movie</SelectItem>
                  <SelectItem value="SERIES">Series (whole)</SelectItem>
                  <SelectItem value="EPISODE">Series Episode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm text-neutral-300 mb-2">Title ID (optional)</p>
              <Input
                className="bg-neutral-950 border-neutral-800 text-white"
                value={titleId}
                onChange={(e) => setTitleId(e.target.value)}
                placeholder="Existing title ID"
              />
            </div>
            <div>
              <p className="text-sm text-neutral-300 mb-2">Title name</p>
              <Input
                className="bg-neutral-950 border-neutral-800 text-white"
                value={titleName}
                onChange={(e) => setTitleName(e.target.value)}
                placeholder="Name for new title"
              />
            </div>
          </div>
          {kind === "EPISODE" && (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-neutral-300 mb-2">Season</p>
                <Input
                  type="number"
                  className="bg-neutral-950 border-neutral-800 text-white"
                  value={seasonNumber}
                  onChange={(e) => setSeasonNumber(Number(e.target.value) || 1)}
                />
              </div>
              <div>
                <p className="text-sm text-neutral-300 mb-2">Episode</p>
                <Input
                  type="number"
                  className="bg-neutral-950 border-neutral-800 text-white"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value) || 1)}
                />
              </div>
              <div>
                <p className="text-sm text-neutral-300 mb-2">Episode name</p>
                <Input
                  className="bg-neutral-950 border-neutral-800 text-white"
                  value={episodeName}
                  onChange={(e) => setEpisodeName(e.target.value)}
                  placeholder="Episode name"
                />
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <label className="px-4 py-2 rounded-lg border border-dashed border-neutral-700 text-neutral-300 cursor-pointer hover:border-[#fd7e14]">
              <input type="file" multiple className="hidden" onChange={(e) => onFilesSelected(e.target.files)} />
              <span className="inline-flex items-center gap-2">
                <Upload className="w-4 h-4" /> Add files
              </span>
            </label>
            <Button onClick={startQueue} className="bg-[#fd7e14] hover:bg-[#ff9f4d] text-black">
              Start uploads
            </Button>
            <Button variant="secondary" onClick={stopQueue}>
              Pause
            </Button>
            <Button variant="ghost" onClick={clearCompleted}>
              Clear completed
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-neutral-300">Max concurrent uploads: {maxConcurrency}</p>
            <Slider
              value={[maxConcurrency]}
              min={1}
              max={10}
              step={1}
              onValueChange={(v) => setMaxConcurrency(v[0])}
            />
          </div>
        </CardContent>
      </Card>

      {/* Queue dock */}
      <Card className="bg-neutral-900 border-neutral-800 fixed bottom-4 left-4 right-4 z-40">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base">Upload queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-72 overflow-y-auto">
          {queued.length === 0 && <p className="text-neutral-400 text-sm">No queued uploads.</p>}
          {queued.map((t) => (
            <div key={t.id} className="flex items-center gap-3 bg-neutral-950 border border-neutral-800 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-white text-sm">{t.file.name}</p>
                <p className="text-neutral-500 text-xs">
                  {(t.file.size / (1024 * 1024)).toFixed(1)} MB • {t.status}
                </p>
                <Progress value={t.progress} className="h-2 mt-2" />
              </div>
              <div className="flex items-center gap-2">
                {t.status === "uploading" ? (
                  <Pause className="w-4 h-4 text-neutral-400" />
                ) : (
                  <Play className="w-4 h-4 text-neutral-400" />
                )}
                <X
                  className="w-4 h-4 text-neutral-400 cursor-pointer"
                  onClick={() => setFiles((prev) => prev.filter((p) => p.id !== t.id))}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
