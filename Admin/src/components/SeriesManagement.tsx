import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Plus, Edit, Search, Upload, Layers, Trash2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AddEditSeriesForm } from "./AddEditSeriesForm";
import { useUploadQueue } from "@/context/UploadQueueProvider";
import { authFetch } from "@/lib/authClient";
import { MovieTitle } from "./MoviesManagement"; // reuse shape for series titles
import { Eye } from "lucide-react";
import { toast } from "sonner";

type SeriesTitle = MovieTitle & {
  episodeCount?: number;
};

type Episode = {
  id?: string | number;
  titleId: string | number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  synopsis?: string;
  introStartSec?: number | null;
  introEndSec?: number | null;
  previewVttUrl?: string | null;
  pendingReview?: boolean;
  seasonId?: string | number | null;
};

export function SeriesManagement() {
  const [series, setSeries] = useState<SeriesTitle[]>([]);
  const [search, setSearch] = useState("");
  const [editingSeries, setEditingSeries] = useState<SeriesTitle | null>(null);
  const [view, setView] = useState<"list" | "addEdit">("list");
  const [episodesTarget, setEpisodesTarget] = useState<SeriesTitle | null>(null);
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null), []);
  const { startUpload } = useUploadQueue();

  const filtered = series.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));

  const loadSeries = async () => {
    const res = await authFetch("/admin/titles", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const onlySeries = ((res.data as any)?.titles ?? []).filter((t: any) => t.type === "SERIES");
      setSeries(onlySeries);
    }
  };

  useEffect(() => {
    void loadSeries();
  }, [token]);

  const openAddSeries = () => {
    setEditingSeries(null);
    setView("addEdit");
  };

  const handleSeriesSaved = async () => {
    setView("list");
    setEditingSeries(null);
    await loadSeries();
  };

  const currentSeries: SeriesTitle = editingSeries ?? {
    id: "",
    name: "",
    type: "SERIES",
    description: "",
    thumbnailUrl: "",
    posterUrl: "",
    archived: false,
    createdAt: "",
    genres: [],
    countryAvailability: [],
    language: "en",
  };

  const publishSeries = async (id: string | number | undefined) => {
    if (!id) return;
    const res = await authFetch(`/admin/titles/${id}/publish`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error((res.data as any)?.message || "Failed to publish series");
  };

  const updateArchive = async (id: string | number | undefined, archived: boolean) => {
    if (!id) return;
    const res = await authFetch(`/admin/titles/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ archived }),
    });
    if (!res.ok) throw new Error((res.data as any)?.message || "Failed to update archive state");
  };

  const deleteSeries = async (id: string | number | undefined) => {
    if (!id) return;
    const res = await authFetch(`/admin/titles/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error((res.data as any)?.message || "Failed to delete series");
  };

  if (view === "addEdit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400 uppercase tracking-wide">Series</p>
            <h1 className="text-3xl text-white font-semibold">
              {currentSeries.id ? "Edit series" : "Add new series"}
            </h1>
            <p className="text-neutral-400 mt-1">
              Fill out the details and upload art/renditions. This replaces the modal flow.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setView("list");
              setEditingSeries(null);
            }}
            className="border-neutral-700 text-neutral-200 hover:bg-neutral-800"
          >
            Back to list
          </Button>
        </div>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">
              {currentSeries.id ? `Edit ${currentSeries.name || "series"}` : "Create a series"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <AddEditSeriesForm
              token={token ?? undefined}
              series={currentSeries}
              onClose={() => {
                setView("list");
                setEditingSeries(null);
              }}
              onSaved={handleSeriesSaved}
              onQueueUpload={(id, file, rendition) => startUpload("SERIES", id, file, rendition)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">Series Management</h1>
          <p className="text-neutral-400 mt-1">Manage episodic content with bulk or weekly uploads.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search series"
              className="pl-9 bg-neutral-900 border-neutral-800 text-white"
            />
          </div>
          <Button onClick={openAddSeries} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Series
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <Card key={item.id} className="bg-neutral-900 border-neutral-800 overflow-hidden">
            <div className="relative">
              <ImageWithFallback
                src={item.thumbnailUrl || item.posterUrl || ""}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              {item.pendingReview && (
                <Badge className="absolute top-2 left-2 bg-amber-500 text-white">Pending</Badge>
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center justify-between">
                <span className="truncate">{item.name}</span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-neutral-300 hover:text-white"
                    onClick={() => {
                      setEditingSeries(item);
                      setView("addEdit");
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-neutral-300 hover:text-white"
                    onClick={() => setEpisodesTarget(item)}
                    title="Manage episodes"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-300 hover:text-red-500"
                    title="Delete series"
                    onClick={async () => {
                      if (!confirm(`Delete series "${item.name}" and all its episodes?`)) return;
                      try {
                        await deleteSeries(item.id);
                        await loadSeries();
                        toast.success("Series deleted");
                      } catch (err: any) {
                        toast.error(err?.message || "Delete failed");
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
              <p className="text-sm text-neutral-500 line-clamp-2">{item.description}</p>
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Layers className="w-4 h-4" />
                <span>{item.episodeCount ?? 0} episodes</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 justify-end">
                {item.pendingReview && (
                  <Badge className="bg-amber-600 text-white border-amber-700">Pending</Badge>
                )}
                {item.archived && <Badge className="bg-neutral-700 text-white border-neutral-600">Archived</Badge>}
                <Button
                  size="sm"
                  className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
                  onClick={() => setEpisodesTarget(item)}
                >
                  Add Episodes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-700 text-neutral-200 hover:text-white"
                  onClick={async () => {
                    try {
                      await publishSeries(item.id);
                      await loadSeries();
                      toast.success("Series published");
                    } catch (err: any) {
                      toast.error(err?.message || "Publish failed");
                    }
                  }}
                >
                  Publish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-700 text-neutral-200 hover:text-white"
                  onClick={async () => {
                    try {
                      await updateArchive(item.id, !item.archived);
                      await loadSeries();
                      toast.success(item.archived ? "Series unarchived" : "Series archived");
                    } catch (err: any) {
                      toast.error(err?.message || "Update failed");
                    }
                  }}
                >
                  {item.archived ? "Unarchive" : "Archive"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="bg-red-900/70 hover:bg-red-800 text-red-100"
                  onClick={async () => {
                    if (!confirm("Delete this series?")) return;
                    try {
                      await deleteSeries(item.id);
                      await loadSeries();
                      toast.success("Series deleted");
                    } catch (err: any) {
                      toast.error(err?.message || "Delete failed");
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddEpisodesDialog
        open={!!episodesTarget}
        onOpenChange={(open) => !open && setEpisodesTarget(null)}
        series={episodesTarget}
        token={token ?? undefined}
      />
    </div>
  );
}

function AddEpisodesDialog({
  open,
  onOpenChange,
  series,
  token,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  series: SeriesTitle | null;
  token?: string;
}) {
  const { startUpload } = useUploadQueue();
  const [savingBulk, setSavingBulk] = useState(false);
  const [weeklyEp, setWeeklyEp] = useState<Episode>({
    titleId: series?.id ?? "",
    seasonNumber: 1,
    episodeNumber: 1,
    name: "",
    synopsis: "",
  });
  const [weeklyVideo4k, setWeeklyVideo4k] = useState<File | null>(null);
  const [weeklyVideo1080, setWeeklyVideo1080] = useState<File | null>(null);
  const [weeklyVideo720, setWeeklyVideo720] = useState<File | null>(null);
  const [weeklyVideo360, setWeeklyVideo360] = useState<File | null>(null);
  const [weeklyVtt, setWeeklyVtt] = useState<File | null>(null);
  const [weeklySaving, setWeeklySaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [archivingId, setArchivingId] = useState<string | number | null>(null);
  const [publishingId, setPublishingId] = useState<string | number | null>(null);
  const [seasonUpdatingId, setSeasonUpdatingId] = useState<string | number | null>(null);
  const [bulkRows, setBulkRows] = useState<
    {
      id: string;
      seasonNumber: number;
      episodeNumber: number;
      name: string;
      synopsis: string;
      file?: File | null;
    }[]
  >([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (series) {
      setWeeklyEp((prev) => ({ ...prev, titleId: series.id }));
    }
  }, [series?.id]);

  const loadEpisodes = async () => {
    if (!series) return;
    setLoadingEpisodes(true);
    try {
      const res = await authFetch(`/admin/titles/${series.id}/episodes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setEpisodes(((res.data as any)?.episodes ?? []) as Episode[]);
      }
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const loadSeasons = async () => {
    if (!series) return;
    setLoadingSeasons(true);
    try {
      const res = await authFetch(`/admin/titles/${series.id}/seasons`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setSeasons(((res.data as any)?.seasons ?? []) as any[]);
      }
    } finally {
      setLoadingSeasons(false);
    }
  };

  useEffect(() => {
    if (open && series) {
      void loadEpisodes();
      void loadSeasons();
    } else {
      setEpisodes([]);
      setSeasons([]);
      setBulkRows([]);
      setDragIndex(null);
    }
  }, [open, series?.id]);

  const handleDeleteEpisode = async (epId: string | number | undefined) => {
    if (!epId) return;
    setDeletingId(epId);
    try {
      const res = await authFetch(`/admin/episodes/${epId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to delete episode");
      await loadEpisodes();
    } catch (err: any) {
      setError(err?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublishEpisode = async (epId: string | number | undefined) => {
    if (!epId) return;
    setPublishingId(epId);
    try {
      const res = await authFetch(`/admin/episodes/${epId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pendingReview: false }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to publish episode");
      await loadEpisodes();
    } catch (err: any) {
      setError(err?.message || "Publish failed");
    } finally {
      setPublishingId(null);
    }
  };

  const handleArchiveEpisode = async (epId: string | number | undefined) => {
    await handleArchiveEpisodeToggle(epId, true);
  };

  const handleArchiveEpisodeToggle = async (epId: string | number | undefined, pending: boolean) => {
    if (!epId) return;
    setArchivingId(epId);
    try {
      const res = await authFetch(`/admin/episodes/${epId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ pendingReview: pending }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to update episode");
      await loadEpisodes();
    } catch (err: any) {
      setError(err?.message || "Update failed");
    } finally {
      setArchivingId(null);
    }
  };

  const handleSeasonStatus = async (seasonId: string | number | undefined, status: string) => {
    if (!seasonId) return;
    setSeasonUpdatingId(seasonId);
    try {
      const res = await authFetch(`/admin/seasons/${seasonId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to update season");
      await loadSeasons();
      await loadEpisodes();
    } catch (err: any) {
      setError(err?.message || "Season update failed");
    } finally {
      setSeasonUpdatingId(null);
    }
  };

  const handleDeleteSeason = async (seasonId: string | number | undefined) => {
    if (!seasonId) return;
    setSeasonUpdatingId(seasonId);
    try {
      const res = await authFetch(`/admin/seasons/${seasonId}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to delete season");
      await loadSeasons();
      await loadEpisodes();
    } catch (err: any) {
      setError(err?.message || "Delete season failed");
    } finally {
      setSeasonUpdatingId(null);
    }
  };

  const detectRendition = (fileName: string) => {
    const lower = fileName.toLowerCase();
    if (lower.includes("2160") || lower.includes("4k")) return "4k";
    if (lower.includes("1080")) return "1080p";
    if (lower.includes("720")) return "720p";
    if (lower.includes("480")) return "480p";
    return "360p";
  };

  const handleBulkSave = async () => {
    if (!series) return;
    const rows = bulkRows;
    const records = rows.map((row, idx) => ({
      line: idx + 1,
      seasonNumber: row.seasonNumber,
      episodeNumber: row.episodeNumber,
      name: row.name,
      synopsis: row.synopsis,
      file: row.file ?? null,
    }));
    if (!records.length) {
      setError("Attach at least one episode video.");
      return;
    }
    // validation: positive numbers, name required, duplicates
    const seen = new Set<string>();
    for (const rec of records) {
      if (!rec.name.trim()) {
        setError(`Line ${rec.line}: name is required`);
        return;
      }
      if (!Number.isFinite(rec.seasonNumber) || rec.seasonNumber < 1) {
        setError(`Line ${rec.line}: seasonNumber must be >= 1`);
        return;
      }
      if (!Number.isFinite(rec.episodeNumber) || rec.episodeNumber < 1) {
        setError(`Line ${rec.line}: episodeNumber must be >= 1`);
        return;
      }
      const key = `${rec.seasonNumber}-${rec.episodeNumber}`;
      if (seen.has(key)) {
        setError(`Duplicate season/episode on line ${rec.line} (${key})`);
        return;
      }
      seen.add(key);
    }
    setSavingBulk(true);
    setError(null);
    try {
      for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        const res = await authFetch(`/admin/titles/${series.id}/episodes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            seasonNumber: rec.seasonNumber,
            episodeNumber: rec.episodeNumber,
            name: rec.name.trim() || `Episode ${rec.episodeNumber}`,
            synopsis: rec.synopsis,
          }),
        });
        if (!res.ok) throw new Error((res.data as any)?.message || "Failed to create episode");
        const epId = (res.data as any)?.episode?.id;
        const file = rec.file;
        if (file) {
          startUpload("EPISODE", Number(epId), file, detectRendition(file.name));
        }
      }
      onOpenChange(false);
      setBulkRows([]);
      setDragIndex(null);
      await loadEpisodes();
    } catch (err: any) {
      setError(err?.message || "Bulk upload failed");
    } finally {
      setSavingBulk(false);
    }
  };

  const handleWeeklySave = async () => {
    if (!series) return;
    if (!weeklyEp.name.trim()) {
      setError("Episode name is required.");
      return;
    }
    if (weeklyEp.introStartSec && weeklyEp.introEndSec && weeklyEp.introStartSec >= weeklyEp.introEndSec) {
      setError("Intro end must be greater than intro start.");
      return;
    }
    setWeeklySaving(true);
    setError(null);
    try {
      const res = await authFetch(`/admin/titles/${series.id}/episodes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          seasonNumber: weeklyEp.seasonNumber,
          episodeNumber: weeklyEp.episodeNumber,
          name: weeklyEp.name.trim(),
          synopsis: weeklyEp.synopsis,
          introStartSec: weeklyEp.introStartSec ?? undefined,
          introEndSec: weeklyEp.introEndSec ?? undefined,
          previewVttUrl: weeklyVtt ? await uploadAsset(weeklyVtt, token) : undefined,
        }),
      });
      if (!res.ok) throw new Error((res.data as any)?.message || "Failed to create episode");
      const epId = (res.data as any)?.episode?.id;
      if (epId) {
        if (weeklyVideo4k) startUpload("EPISODE", Number(epId), weeklyVideo4k, "4k");
        if (weeklyVideo1080) startUpload("EPISODE", Number(epId), weeklyVideo1080, "1080p");
        if (weeklyVideo720) startUpload("EPISODE", Number(epId), weeklyVideo720, "720p");
        if (weeklyVideo360) startUpload("EPISODE", Number(epId), weeklyVideo360, "360p");
      }
      await loadEpisodes();
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setWeeklySaving(false);
    }
  };

  const uploadAsset = async (file: File, token?: string) => {
    const res = await fetch("/api/admin/assets/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ contentType: file.type || "application/octet-stream", kind: "previewVtt" }),
    });
    const data = await res.json();
    if (!res.ok || !data.url || !data.key) {
      throw new Error(data?.message || "Failed to presign upload");
    }
    const putRes = await fetch(data.url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error("Upload failed");
    }
    return (data.publicUrl as string) || (data.key as string);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Add Episodes {series ? `for ${series.name}` : ""}</DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Attach new episode videos, then fill in season, episode and title details.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-neutral-200 mb-2">Existing episodes</h3>
          {loadingEpisodes ? (
            <p className="text-neutral-400 text-sm">Loading...</p>
          ) : episodes.length === 0 ? (
            <p className="text-neutral-500 text-sm">No episodes yet.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-auto pr-1">
              {Array.from(new Set(episodes.map((e) => e.seasonNumber))).sort((a, b) => a - b).map((season) => {
                const seasonEps = episodes
                  .filter((e) => e.seasonNumber === season)
                  .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
                const seasonMeta = seasons.find((s) => Number(s.seasonNumber) === Number(season));
                return (
                  <div key={season} className="border border-neutral-800 rounded-lg p-3 bg-neutral-950/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-200 font-semibold">Season {season}</span>
                        {seasonMeta?.status && (
                          <span className="text-xs text-neutral-500">Status: {seasonMeta.status}</span>
                        )}
                        {loadingSeasons && <span className="text-xs text-neutral-500">…</span>}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-neutral-700 text-neutral-200 hover:text-white hover:border-neutral-500"
                          onClick={() => handleSeasonStatus(seasonMeta?.id, "PUBLISHED")}
                          disabled={!seasonMeta?.id || seasonUpdatingId === seasonMeta?.id}
                        >
                          {seasonUpdatingId === seasonMeta?.id ? "…" : "Publish"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-neutral-700 text-neutral-200 hover:text-white hover:border-neutral-500"
                          onClick={() => handleSeasonStatus(seasonMeta?.id, "ARCHIVED")}
                          disabled={!seasonMeta?.id || seasonUpdatingId === seasonMeta?.id}
                        >
                          Archive
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="bg-red-900/70 hover:bg-red-800 text-red-100"
                          onClick={() => handleDeleteSeason(seasonMeta?.id)}
                          disabled={!seasonMeta?.id || seasonUpdatingId === seasonMeta?.id}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {seasonEps.map((ep) => (
                        <div
                          key={`${season}-${ep.episodeNumber}`}
                          className="flex items-center justify-between text-sm text-neutral-300 bg-neutral-900 rounded px-2 py-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-500">
                              S{ep.seasonNumber}E{ep.episodeNumber}
                            </span>
                            <span className="font-medium">{ep.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            {ep.introStartSec != null && ep.introEndSec != null && (
                              <span>
                                Intro {ep.introStartSec}s–{ep.introEndSec}s
                              </span>
                            )}
                            {ep.previewVttUrl && <span className="text-[#fd7e14]">VTT</span>}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-neutral-700 text-neutral-200 hover:text-white hover:border-neutral-500 px-2"
                              onClick={() => handlePublishEpisode(ep.id)}
                              disabled={publishingId === ep.id}
                              title="Publish"
                            >
                              {publishingId === ep.id ? "…" : "Publish"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-neutral-700 text-neutral-200 hover:text-white hover:border-neutral-500 px-2"
                              onClick={() => handleArchiveEpisodeToggle(ep.id, true)}
                              disabled={archivingId === ep.id}
                              title="Archive"
                            >
                              {archivingId === ep.id ? "…" : "Archive"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="bg-red-900/70 hover:bg-red-800 text-red-100"
                              onClick={() => handleDeleteEpisode(ep.id)}
                              disabled={deletingId === ep.id}
                              title="Delete episode"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Tabs defaultValue="weekly" className="mt-2">
          <TabsList className="bg-neutral-800 border-neutral-700">
            <TabsTrigger value="weekly" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
              Bulk
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-neutral-300">Season</Label>
                <Input
                  type="number"
                  min={1}
                  value={weeklyEp.seasonNumber}
                  onChange={(e) => setWeeklyEp((prev) => ({ ...prev, seasonNumber: Number(e.target.value) }))}
                  className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                />
              </div>
              <div>
                <Label className="text-neutral-300">Episode Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={weeklyEp.episodeNumber}
                  onChange={(e) => setWeeklyEp((prev) => ({ ...prev, episodeNumber: Number(e.target.value) }))}
                  className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-neutral-300">Episode Name</Label>
              <Input
                value={weeklyEp.name}
                onChange={(e) => setWeeklyEp((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                placeholder="Episode title"
              />
            </div>

            <div>
              <Label className="text-neutral-300">Synopsis</Label>
              <Textarea
                value={weeklyEp.synopsis}
                onChange={(e) => setWeeklyEp((prev) => ({ ...prev, synopsis: e.target.value }))}
                className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                placeholder="Short summary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-neutral-300">Intro start (s)</Label>
                <Input
                  type="number"
                  min={0}
                  value={weeklyEp.introStartSec ?? ""}
                  onChange={(e) =>
                    setWeeklyEp((prev) => ({
                      ...prev,
                      introStartSec: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <Label className="text-neutral-300">Intro end (s)</Label>
                <Input
                  type="number"
                  min={0}
                  value={weeklyEp.introEndSec ?? ""}
                  onChange={(e) =>
                    setWeeklyEp((prev) => ({
                      ...prev,
                      introEndSec: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                  placeholder="e.g. 55"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-neutral-300">Episode videos by quality (optional)</Label>
                <p className="text-xs text-neutral-500 mb-2">Attach renditions; each queues with its quality tag.</p>
                <div className="grid grid-cols-1 gap-2">
                  <QualityInput label="4K / 2160p" id="weekly-ep-4k" file={weeklyVideo4k} onChange={setWeeklyVideo4k} />
                  <QualityInput label="1080p" id="weekly-ep-1080" file={weeklyVideo1080} onChange={setWeeklyVideo1080} />
                  <QualityInput label="720p" id="weekly-ep-720" file={weeklyVideo720} onChange={setWeeklyVideo720} />
                  <QualityInput label="360p" id="weekly-ep-360" file={weeklyVideo360} onChange={setWeeklyVideo360} />
                </div>
              </div>
              <div>
                <Label className="text-neutral-300">Preview VTT (optional)</Label>
                <div className="border border-dashed border-neutral-700 rounded-lg p-4 text-center cursor-pointer bg-neutral-950/50">
                  <input
                    type="file"
                    accept=".vtt,text/vtt"
                    className="hidden"
                    id="weekly-episode-vtt"
                    onChange={(e) => setWeeklyVtt(e.target.files?.[0] ?? null)}
                  />
                  <label htmlFor="weekly-episode-vtt" className="block text-neutral-400">
                    {weeklyVtt ? `Selected: ${weeklyVtt.name}` : "Upload WebVTT with sprite cues"}
                  </label>
                </div>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </Button>
              <Button
                disabled={weeklySaving}
                onClick={handleWeeklySave}
                className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
              >
                {weeklySaving ? "Saving..." : "Save Episode"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-300 text-sm">Attach episode videos to create multiple episodes.</p>
                <p className="text-neutral-500 text-xs mt-1">
                  For each file, fill in Season, Episode, Title and Synopsis. Drag rows to fix ordering.
                </p>
              </div>
              <div className="border border-dashed border-neutral-700 rounded-lg p-3 bg-neutral-950/50">
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  className="hidden"
                  id="bulk-episode-videos"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) {
                      setBulkRows([]);
                      return;
                    }
                    const next: {
                      id: string;
                      seasonNumber: number;
                      episodeNumber: number;
                      name: string;
                      synopsis: string;
                      file?: File | null;
                    }[] = [];
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      const baseName = file.name.replace(/\.[^/.]+$/, "");
                      next.push({
                        id: `${Date.now()}-${i}`,
                        seasonNumber: 1,
                        episodeNumber: i + 1,
                        name: baseName,
                        synopsis: "",
                        file,
                      });
                    }
                    setBulkRows(next);
                  }}
                />
                <label htmlFor="bulk-episode-videos" className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Attach episode videos (ordered)
                </label>
                {bulkRows.length > 0 && (
                  <p className="text-xs text-[#fd7e14] mt-1">{bulkRows.length} file(s) selected</p>
                )}
              </div>
            </div>

            {bulkRows.length > 0 && (
              <div className="space-y-2 border border-neutral-800 rounded-lg p-3 bg-neutral-950/70">
                <p className="text-xs text-neutral-300 mb-1">
                  Attached episodes (order here controls episode creation and video mapping):
                </p>
                <div className="space-y-2 max-h-56 overflow-auto pr-1">
                  {bulkRows.map((row, index) => (
                    <div
                      key={row.id}
                      className="flex items-start gap-3 text-xs bg-neutral-900/70 border border-neutral-800 rounded-md p-2"
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIndex === null || dragIndex === index) return;
                        setBulkRows((prev) => {
                          const next = [...prev];
                          const [moved] = next.splice(dragIndex, 1);
                          next.splice(index, 0, moved);
                          return next;
                        });
                        setDragIndex(null);
                      }}
                      onDragEnd={() => setDragIndex(null)}
                    >
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-500 w-4 text-right">{index + 1}.</span>
                          <Input
                            type="number"
                            min={1}
                            value={row.seasonNumber}
                            onChange={(e) => {
                              const value = Number(e.target.value || 1);
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, seasonNumber: value } : r)),
                              );
                            }}
                            className="w-16 bg-neutral-950 border-neutral-800 text-white"
                            placeholder="Season"
                          />
                          <Input
                            type="number"
                            min={1}
                            value={row.episodeNumber}
                            onChange={(e) => {
                              const value = Number(e.target.value || 1);
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, episodeNumber: value } : r)),
                              );
                            }}
                            className="w-16 bg-neutral-950 border-neutral-800 text-white"
                            placeholder="Ep"
                          />
                          <Input
                            value={row.name}
                            onChange={(e) => {
                              const value = e.target.value;
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, name: value } : r)),
                              );
                            }}
                            className="flex-1 bg-neutral-950 border-neutral-800 text-white"
                            placeholder="Episode name"
                          />
                        </div>
                        <Input
                          value={row.synopsis}
                          onChange={(e) => {
                            const value = e.target.value;
                            setBulkRows((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, synopsis: value } : r)),
                            );
                          }}
                          className="bg-neutral-950 border-neutral-800 text-white"
                          placeholder="Synopsis (optional)"
                        />
                      </div>
                      <div className="flex flex-col items-end gap-2 w-40">
                        <div className="text-[11px] text-neutral-400 truncate max-w-full">
                          {row.file ? row.file.name : "No video attached"}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="border-neutral-700 text-neutral-300 hover:text-white"
                            disabled={index === 0}
                            onClick={() =>
                              setBulkRows((prev) => {
                                if (index === 0) return prev;
                                const next = [...prev];
                                const [current] = next.splice(index, 1);
                                next.splice(index - 1, 0, current);
                                return next;
                              })
                            }
                            title="Move up"
                          >
                            ↑
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="border-neutral-700 text-neutral-300 hover:text-white"
                            disabled={index === bulkRows.length - 1}
                            onClick={() =>
                              setBulkRows((prev) => {
                                if (index === prev.length - 1) return prev;
                                const next = [...prev];
                                const [current] = next.splice(index, 1);
                                next.splice(index + 1, 0, current);
                                return next;
                              })
                            }
                            title="Move down"
                          >
                            ↓
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </Button>
              <Button
                disabled={savingBulk}
                onClick={handleBulkSave}
                className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
              >
                {savingBulk ? "Saving..." : "Create Episodes"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function QualityInput({
  label,
  id,
  file,
  onChange,
}: {
  label: string;
  id: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="border border-dashed border-neutral-700 rounded-lg p-3 text-center cursor-pointer bg-neutral-950/50">
      <input
        type="file"
        accept="video/*"
        className="hidden"
        id={id}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <label htmlFor={id} className="block text-neutral-400">
        {file ? `Selected: ${file.name}` : `Upload ${label}`}
      </label>
    </div>
  );
}
