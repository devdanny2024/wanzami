import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { authFetch } from "@/lib/authClient";

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

const statusBadge = (status: UploadJob["status"]) => {
  switch (status) {
    case "UPLOADING":
      return "bg-blue-500/20 text-blue-300";
    case "PROCESSING":
      return "bg-amber-500/20 text-amber-300";
    case "COMPLETED":
      return "bg-emerald-500/20 text-emerald-300";
    case "FAILED":
      return "bg-red-500/20 text-red-300";
    default:
      return "bg-neutral-700 text-neutral-200";
  }
};

const isOngoing = (status: UploadJob["status"]) => status === "UPLOADING" || status === "PROCESSING";

export function ProcessManagement() {
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

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

  const renderList = (items: UploadJob[]) => {
    if (items.length === 0) {
      return <p className="text-sm text-neutral-500">No processes found.</p>;
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
            <Card key={job.id} className="bg-neutral-950 border-neutral-800">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white text-sm">Job #{job.id}</p>
                    <p className="text-xs text-neutral-500">
                      {job.createdAt ? new Date(job.createdAt).toLocaleString() : "Unknown time"}
                    </p>
                  </div>
                  <Badge className={statusBadge(job.status)}>{statusLabel(job.status)}</Badge>
                </div>
                <div className="text-xs text-neutral-400">
                  {job.status === "PROCESSING" ? "Transcoding" : `${formatBytes(uploaded)} / ${formatBytes(total)}`}
                  {typeof percent === "number" ? ` - ${percent}%` : ""}
                </div>
                {job.error && <p className="text-xs text-red-400">Error: {job.error}</p>}
                {canRetry && (
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
                      disabled={actionId === job.id}
                      onClick={() => handleRetry(job)}
                    >
                      {actionId === job.id ? "Requeuing..." : actionLabel}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">Processes</h1>
          <p className="text-neutral-400 mt-1">Transcode processes</p>
        </div>
        <Button onClick={fetchJobs} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          Refresh
        </Button>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">Status</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-neutral-400">Loading...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          {!loading && !error && (
            <Tabs defaultValue="ongoing">
              <TabsList className="bg-neutral-800 border-neutral-700">
                <TabsTrigger value="ongoing" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
                  Ongoing ({ongoing.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
                  Completed ({completed.length})
                </TabsTrigger>
                <TabsTrigger value="failed" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
                  Failed ({failed.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
                  All ({processesOnly.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ongoing" className="mt-4">{renderList(ongoing)}</TabsContent>
              <TabsContent value="completed" className="mt-4">{renderList(completed)}</TabsContent>
              <TabsContent value="failed" className="mt-4">{renderList(failed)}</TabsContent>
              <TabsContent value="all" className="mt-4">{renderList(processesOnly)}</TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
