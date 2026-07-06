import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit, Search, Upload, Layers, Trash2, Eye } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AddEditSeriesForm } from "./AddEditSeriesForm";
import { useUploadQueue } from "@/context/UploadQueueProvider";
import { authFetch } from "@/lib/authClient";
import { MovieTitle } from "./MoviesManagement"; // reuse shape for series titles
import { titleStatus } from "../lib/status";
import { toast } from "sonner";
import { CsBox, CsButton, CsPageHeader, CsSlug, CsTag, type CsColumn } from "./cs/kit";

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

const fieldStyle: React.CSSProperties = {
  border: "2px solid var(--cs-ink)",
  background: "var(--cs-paper)",
  color: "var(--cs-ink)",
  fontFamily: "var(--font-smono), monospace",
  fontSize: 12,
  padding: "9px 12px",
  width: "100%",
};

const statusTagProps = (m: MovieTitle): { label: string; tone: "good" | "bad" | "pending" | "neutral" } => {
  const s = titleStatus(m);
  if (s.tone === "live") return { label: s.label, tone: "good" };
  if (s.tone === "leaving") return { label: s.label, tone: "bad" };
  if (s.tone === "pending") return { label: s.label, tone: "pending" };
  if (s.tone === "coming") return { label: s.label, tone: "pending" };
  return { label: s.label, tone: "neutral" };
};

export function SeriesManagement() {
  const [series, setSeries] = useState<SeriesTitle[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "coming" | "pending" | "archived">("all");
  const [editingSeries, setEditingSeries] = useState<SeriesTitle | null>(null);
  const [view, setView] = useState<"list" | "addEdit">("list");
  const [episodesTarget, setEpisodesTarget] = useState<SeriesTitle | null>(null);
  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null), []);
  const { startUpload } = useUploadQueue();

  const seriesStatusKey = (m: MovieTitle): "live" | "coming" | "pending" | "archived" =>
    m.archived
      ? "archived"
      : m.pendingReview
      ? "pending"
      : m.availability === "COMING_SOON" || m.availability === "LEAVING_SOON"
      ? "coming"
      : "live";

  const searchedSeries = series.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()));
  const seriesStatusCounts = { all: searchedSeries.length, live: 0, coming: 0, pending: 0, archived: 0 };
  searchedSeries.forEach((s) => {
    seriesStatusCounts[seriesStatusKey(s)] += 1;
  });
  const filtered =
    statusFilter === "all" ? searchedSeries : searchedSeries.filter((s) => seriesStatusKey(s) === statusFilter);

  const loadSeries = useCallback(async () => {
    try {
      const res = await authFetch("/admin/titles", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        toast.error((res.data as any)?.message || `Failed to load titles (${res.status})`);
        setSeries([]);
        return;
      }
      const onlySeries = ((res.data as any)?.titles ?? []).filter((t: any) => t.type === "SERIES");
      setSeries(onlySeries);
    } catch {
      toast.error("Failed to load titles (network error)");
      setSeries([]);
    }
  }, [token]);

  useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

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
            <CsSlug className="mb-1">Series</CsSlug>
            <h1 className="cs-display" style={{ fontSize: 34, color: "var(--cs-ink)" }}>
              {currentSeries.id ? "Edit series" : "Add new series"}
            </h1>
            <p className="cs-mono text-xs mt-1" style={{ color: "var(--cs-muted)" }}>
              Fill out the details and upload art/renditions. This replaces the modal flow.
            </p>
          </div>
          <CsButton
            variant="outline"
            onClick={() => {
              setView("list");
              setEditingSeries(null);
            }}
          >
            Back to list
          </CsButton>
        </div>

        <CsBox className="p-5">
          <h2 className="cs-display mb-4" style={{ fontSize: 24, color: "var(--cs-ink)" }}>
            {currentSeries.id ? `Edit ${currentSeries.name || "series"}` : "Create a series"}
          </h2>
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
        </CsBox>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The serials"
        chip={`${seriesStatusCounts.all} series`}
        slug="Episodic content · seasons and episodes"
        actions={
          <CsButton variant="rust" onClick={openAddSeries}>
            <span className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add series
            </span>
          </CsButton>
        }
      />

      <div className="relative max-w-md">
        <Search
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--cs-muted)" }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SEARCH SERIES…"
          style={{ ...fieldStyle, paddingLeft: 38 }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["all", "All"],
          ["live", "Live"],
          ["coming", "Coming soon"],
          ["pending", "Pending"],
          ["archived", "Archived"],
        ] as const).map(([key, label]) => {
          const active = statusFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className="cs-mono text-xs font-bold uppercase transition-colors"
              style={{
                padding: "7px 14px",
                border: "1.5px solid var(--cs-ink)",
                background: active ? "var(--cs-ink)" : "var(--cs-paper)",
                color: active ? "#fff" : "var(--cs-ink)",
                letterSpacing: "0.06em",
              }}
            >
              {label} <span style={{ opacity: 0.65 }}>{seriesStatusCounts[key]}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <CsBox className="p-5">
          <CsSlug>Nothing filed here yet</CsSlug>
          <p className="mt-2 text-sm" style={{ color: "var(--cs-ink)" }}>
            No series match your filters.
          </p>
        </CsBox>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const status = statusTagProps(item);
            return (
              <CsBox key={item.id} shadow className="overflow-hidden">
                <div className="relative" style={{ aspectRatio: "16 / 9", background: "var(--cs-panel)" }}>
                  <ImageWithFallback
                    src={item.thumbnailUrl || item.posterUrl || ""}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {status.tone !== "good" && (
                    <div className="absolute top-2 left-2">
                      <CsTag label={status.label} tone={status.tone} />
                    </div>
                  )}
                </div>
                <div className="p-3 pb-2" style={{ borderTop: "1.5px solid var(--cs-line)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="cs-mono text-xs font-bold uppercase truncate"
                      style={{ color: "var(--cs-ink)" }}
                    >
                      {item.name}
                    </span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingSeries(item);
                          setView("addEdit");
                        }}
                        title="Edit"
                        className="transition-colors hover:bg-[var(--cs-panel)]"
                        style={{ border: "1.5px solid var(--cs-line)", color: "var(--cs-ink)", padding: 6 }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEpisodesTarget(item)}
                        title="Manage episodes"
                        className="transition-colors hover:bg-[var(--cs-panel)]"
                        style={{ border: "1.5px solid var(--cs-line)", color: "var(--cs-ink)", padding: 6 }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
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
                        title="Delete series"
                        style={{ border: "1.5px solid var(--cs-rust)", color: "var(--cs-rust)", padding: 6 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="cs-mono text-xs mt-1 line-clamp-2" style={{ color: "var(--cs-muted)" }}>
                    {item.description}
                  </p>
                </div>
                <div className="px-3 pb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                    <Layers className="w-3.5 h-3.5" />
                    <span>{item.episodeCount ?? 0} episodes</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    <button
                      onClick={() => setEpisodesTarget(item)}
                      className="cs-mono text-[10px] font-bold uppercase px-2 py-1.5"
                      style={{ background: "var(--cs-ink)", color: "#fff", letterSpacing: "0.05em" }}
                    >
                      Add episodes
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await publishSeries(item.id);
                          await loadSeries();
                          toast.success("Series published");
                        } catch (err: any) {
                          toast.error(err?.message || "Publish failed");
                        }
                      }}
                      className="cs-mono text-[10px] font-bold uppercase px-2 py-1.5 transition-colors hover:bg-[var(--cs-panel)]"
                      style={{ border: "1.5px solid var(--cs-ink)", color: "var(--cs-ink)" }}
                    >
                      Publish
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await updateArchive(item.id, !item.archived);
                          await loadSeries();
                          toast.success(item.archived ? "Series unarchived" : "Series archived");
                        } catch (err: any) {
                          toast.error(err?.message || "Update failed");
                        }
                      }}
                      className="cs-mono text-[10px] font-bold uppercase px-2 py-1.5 transition-colors hover:bg-[var(--cs-panel)]"
                      style={{ border: "1.5px solid var(--cs-ink)", color: "var(--cs-ink)" }}
                    >
                      {item.archived ? "Unarchive" : "Archive"}
                    </button>
                    <button
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
                      className="cs-mono text-[10px] font-bold uppercase px-2 py-1.5"
                      style={{ border: "1.5px solid var(--cs-rust)", color: "var(--cs-rust)" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CsBox>
            );
          })}
        </div>
      )}

      <AddEpisodesPanel
        open={!!episodesTarget}
        onOpenChange={(open) => !open && setEpisodesTarget(null)}
        series={episodesTarget}
        token={token ?? undefined}
      />
    </div>
  );
}

function AddEpisodesPanel({
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
  const [activeTab, setActiveTab] = useState<"weekly" | "bulk">("weekly");

  useEffect(() => {
    if (series) {
      setWeeklyEp((prev) => ({ ...prev, titleId: series.id }));
    }
  }, [series]);

  const loadEpisodes = useCallback(async () => {
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
  }, [series, token]);

  const loadSeasons = useCallback(async () => {
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
  }, [series, token]);

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
  }, [loadEpisodes, loadSeasons, open, series]);

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(22, 19, 16, 0.55)" }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="cs-border cs-shadow w-full max-w-4xl p-6"
        style={{ background: "var(--cs-paper)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4" style={{ borderBottom: "2.5px solid var(--cs-ink)" }}>
          <div>
            <CsSlug>Episodes</CsSlug>
            <h3 className="cs-display mt-1" style={{ fontSize: 28, color: "var(--cs-ink)" }}>
              Add Episodes {series ? `for ${series.name}` : ""}
            </h3>
            <p className="cs-mono text-xs mt-1" style={{ color: "var(--cs-muted)" }}>
              Attach new episode videos, then fill in season, episode and title details.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="cs-mono text-xs font-bold px-2 py-1"
            style={{ border: "2px solid var(--cs-ink)" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 mt-4">
          <CsSlug className="mb-2">Existing episodes</CsSlug>
          {loadingEpisodes ? (
            <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
              Loading...
            </p>
          ) : episodes.length === 0 ? (
            <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
              No episodes yet.
            </p>
          ) : (
            <div className="space-y-3" style={{ maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
              {Array.from(new Set(episodes.map((e) => e.seasonNumber))).sort((a, b) => a - b).map((season) => {
                const seasonEps = episodes
                  .filter((e) => e.seasonNumber === season)
                  .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));
                const seasonMeta = seasons.find((s) => Number(s.seasonNumber) === Number(season));
                return (
                  <div key={season} className="p-3" style={{ border: "1.5px solid var(--cs-line)", background: "var(--cs-panel)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="cs-mono text-xs font-bold uppercase" style={{ color: "var(--cs-ink)" }}>
                          Season {season}
                        </span>
                        {seasonMeta?.status && (
                          <span className="cs-mono text-[10px]" style={{ color: "var(--cs-muted)" }}>
                            Status: {seasonMeta.status}
                          </span>
                        )}
                        {loadingSeasons && (
                          <span className="cs-mono text-[10px]" style={{ color: "var(--cs-muted)" }}>
                            …
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSeasonStatus(seasonMeta?.id, "PUBLISHED")}
                          disabled={!seasonMeta?.id || seasonUpdatingId === seasonMeta?.id}
                          className="cs-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors hover:bg-[var(--cs-panel)] disabled:opacity-50"
                          style={{ border: "1.5px solid var(--cs-ink)", color: "var(--cs-ink)", background: "var(--cs-paper)" }}
                        >
                          {seasonUpdatingId === seasonMeta?.id ? "…" : "Publish"}
                        </button>
                        <button
                          onClick={() => handleSeasonStatus(seasonMeta?.id, "ARCHIVED")}
                          disabled={!seasonMeta?.id || seasonUpdatingId === seasonMeta?.id}
                          className="cs-mono text-[10px] font-bold uppercase px-2 py-1 transition-colors hover:bg-[var(--cs-panel)] disabled:opacity-50"
                          style={{ border: "1.5px solid var(--cs-ink)", color: "var(--cs-ink)", background: "var(--cs-paper)" }}
                        >
                          Archive
                        </button>
                        <button
                          onClick={() => handleDeleteSeason(seasonMeta?.id)}
                          disabled={!seasonMeta?.id || seasonUpdatingId === seasonMeta?.id}
                          className="cs-mono text-[10px] font-bold uppercase px-2 py-1 disabled:opacity-50"
                          style={{ border: "1.5px solid var(--cs-rust)", color: "var(--cs-rust)", background: "var(--cs-paper)" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {seasonEps.map((ep) => (
                        <div
                          key={`${season}-${ep.episodeNumber}`}
                          className="flex items-center justify-between text-xs px-2 py-1"
                          style={{ background: "var(--cs-paper)", border: "1px solid var(--cs-line)" }}
                        >
                          <div className="flex items-center gap-2 cs-mono">
                            <span style={{ color: "var(--cs-muted)" }}>
                              S{ep.seasonNumber}E{ep.episodeNumber}
                            </span>
                            <span className="font-bold" style={{ color: "var(--cs-ink)" }}>{ep.name}</span>
                          </div>
                          <div className="flex items-center gap-2 cs-mono text-[10px]" style={{ color: "var(--cs-muted)" }}>
                            {ep.introStartSec != null && ep.introEndSec != null && (
                              <span>
                                Intro {ep.introStartSec}s–{ep.introEndSec}s
                              </span>
                            )}
                            {ep.previewVttUrl && <span style={{ color: "var(--cs-brand)" }}>VTT</span>}
                            <button
                              onClick={() => handlePublishEpisode(ep.id)}
                              disabled={publishingId === ep.id}
                              title="Publish"
                              className="px-2 py-1 transition-colors hover:bg-[var(--cs-panel)] disabled:opacity-50"
                              style={{ border: "1.5px solid var(--cs-ink)", color: "var(--cs-ink)" }}
                            >
                              {publishingId === ep.id ? "…" : "Publish"}
                            </button>
                            <button
                              onClick={() => handleArchiveEpisodeToggle(ep.id, true)}
                              disabled={archivingId === ep.id}
                              title="Archive"
                              className="px-2 py-1 transition-colors hover:bg-[var(--cs-panel)] disabled:opacity-50"
                              style={{ border: "1.5px solid var(--cs-ink)", color: "var(--cs-ink)" }}
                            >
                              {archivingId === ep.id ? "…" : "Archive"}
                            </button>
                            <button
                              onClick={() => handleDeleteEpisode(ep.id)}
                              disabled={deletingId === ep.id}
                              title="Delete episode"
                              className="p-1.5 disabled:opacity-50"
                              style={{ border: "1.5px solid var(--cs-rust)", color: "var(--cs-rust)" }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

        <div className="flex gap-2 mt-2 mb-4">
          {(["weekly", "bulk"] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="cs-mono text-xs font-bold uppercase px-3 py-1.5"
                style={{
                  border: "1.5px solid var(--cs-ink)",
                  background: active ? "var(--cs-ink)" : "var(--cs-paper)",
                  color: active ? "#fff" : "var(--cs-ink)",
                }}
              >
                {tab === "weekly" ? "Weekly" : "Bulk"}
              </button>
            );
          })}
        </div>

        {activeTab === "weekly" && (
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <CsSlug className="mb-1">Season</CsSlug>
                <input
                  type="number"
                  min={1}
                  value={weeklyEp.seasonNumber}
                  onChange={(e) => setWeeklyEp((prev) => ({ ...prev, seasonNumber: Number(e.target.value) }))}
                  style={fieldStyle}
                />
              </div>
              <div>
                <CsSlug className="mb-1">Episode Number</CsSlug>
                <input
                  type="number"
                  min={1}
                  value={weeklyEp.episodeNumber}
                  onChange={(e) => setWeeklyEp((prev) => ({ ...prev, episodeNumber: Number(e.target.value) }))}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div>
              <CsSlug className="mb-1">Episode Name</CsSlug>
              <input
                value={weeklyEp.name}
                onChange={(e) => setWeeklyEp((prev) => ({ ...prev, name: e.target.value }))}
                style={fieldStyle}
                placeholder="Episode title"
              />
            </div>

            <div>
              <CsSlug className="mb-1">Synopsis</CsSlug>
              <textarea
                value={weeklyEp.synopsis}
                onChange={(e) => setWeeklyEp((prev) => ({ ...prev, synopsis: e.target.value }))}
                style={{ ...fieldStyle, resize: "vertical" }}
                placeholder="Short summary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <CsSlug className="mb-1">Intro start (s)</CsSlug>
                <input
                  type="number"
                  min={0}
                  value={weeklyEp.introStartSec ?? ""}
                  onChange={(e) =>
                    setWeeklyEp((prev) => ({
                      ...prev,
                      introStartSec: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  style={fieldStyle}
                  placeholder="e.g. 10"
                />
              </div>
              <div>
                <CsSlug className="mb-1">Intro end (s)</CsSlug>
                <input
                  type="number"
                  min={0}
                  value={weeklyEp.introEndSec ?? ""}
                  onChange={(e) =>
                    setWeeklyEp((prev) => ({
                      ...prev,
                      introEndSec: e.target.value === "" ? undefined : Number(e.target.value),
                    }))
                  }
                  style={fieldStyle}
                  placeholder="e.g. 55"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <CsSlug className="mb-1">Episode videos by quality (optional)</CsSlug>
                <p className="cs-mono text-[10px] mb-2" style={{ color: "var(--cs-muted)" }}>
                  Attach renditions; each queues with its quality tag.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <QualityInput label="4K / 2160p" id="weekly-ep-4k" file={weeklyVideo4k} onChange={setWeeklyVideo4k} />
                  <QualityInput label="1080p" id="weekly-ep-1080" file={weeklyVideo1080} onChange={setWeeklyVideo1080} />
                  <QualityInput label="720p" id="weekly-ep-720" file={weeklyVideo720} onChange={setWeeklyVideo720} />
                  <QualityInput label="360p" id="weekly-ep-360" file={weeklyVideo360} onChange={setWeeklyVideo360} />
                </div>
              </div>
              <div>
                <CsSlug className="mb-1">Preview VTT (optional)</CsSlug>
                <div
                  className="text-center cursor-pointer p-4"
                  style={{ border: "1.5px dashed var(--cs-line)", background: "var(--cs-panel)" }}
                >
                  <input
                    type="file"
                    accept=".vtt,text/vtt"
                    className="hidden"
                    id="weekly-episode-vtt"
                    onChange={(e) => setWeeklyVtt(e.target.files?.[0] ?? null)}
                  />
                  <label htmlFor="weekly-episode-vtt" className="block cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                    {weeklyVtt ? `Selected: ${weeklyVtt.name}` : "Upload WebVTT with sprite cues"}
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <p className="cs-mono text-xs" style={{ color: "var(--cs-rust)" }}>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1.5px solid var(--cs-line)" }}>
              <CsButton variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </CsButton>
              <CsButton variant="rust" disabled={weeklySaving} onClick={handleWeeklySave}>
                {weeklySaving ? "Saving..." : "Save Episode"}
              </CsButton>
            </div>
          </div>
        )}

        {activeTab === "bulk" && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="cs-mono text-xs" style={{ color: "var(--cs-ink)" }}>
                  Attach episode videos to create multiple episodes.
                </p>
                <p className="cs-mono text-[10px] mt-1" style={{ color: "var(--cs-muted)" }}>
                  For each file, fill in Season, Episode, Title and Synopsis. Drag rows to fix ordering.
                </p>
              </div>
              <div className="p-3" style={{ border: "1.5px dashed var(--cs-line)", background: "var(--cs-panel)" }}>
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
                <label htmlFor="bulk-episode-videos" className="flex items-center gap-2 cs-mono text-xs cursor-pointer" style={{ color: "var(--cs-ink)" }}>
                  <Upload className="w-4 h-4" />
                  Attach episode videos (ordered)
                </label>
                {bulkRows.length > 0 && (
                  <p className="cs-mono text-[10px] mt-1" style={{ color: "var(--cs-brand)" }}>
                    {bulkRows.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            {bulkRows.length > 0 && (
              <div className="space-y-2 p-3" style={{ border: "1.5px solid var(--cs-line)", background: "var(--cs-panel)" }}>
                <p className="cs-mono text-[10px] mb-1" style={{ color: "var(--cs-ink)" }}>
                  Attached episodes (order here controls episode creation and video mapping):
                </p>
                <div className="space-y-2" style={{ maxHeight: 224, overflowY: "auto", paddingRight: 4 }}>
                  {bulkRows.map((row, index) => (
                    <div
                      key={row.id}
                      className="flex items-start gap-3 text-xs p-2"
                      style={{ background: "var(--cs-paper)", border: "1px solid var(--cs-line)" }}
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
                          <span className="cs-mono" style={{ color: "var(--cs-muted)", width: 16, textAlign: "right" }}>
                            {index + 1}.
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={row.seasonNumber}
                            onChange={(e) => {
                              const value = Number(e.target.value || 1);
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, seasonNumber: value } : r)),
                              );
                            }}
                            style={{ ...fieldStyle, width: 64, padding: "6px 8px" }}
                            placeholder="Season"
                          />
                          <input
                            type="number"
                            min={1}
                            value={row.episodeNumber}
                            onChange={(e) => {
                              const value = Number(e.target.value || 1);
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, episodeNumber: value } : r)),
                              );
                            }}
                            style={{ ...fieldStyle, width: 64, padding: "6px 8px" }}
                            placeholder="Ep"
                          />
                          <input
                            value={row.name}
                            onChange={(e) => {
                              const value = e.target.value;
                              setBulkRows((prev) =>
                                prev.map((r, i) => (i === index ? { ...r, name: value } : r)),
                              );
                            }}
                            style={{ ...fieldStyle, flex: 1, padding: "6px 8px" }}
                            placeholder="Episode name"
                          />
                        </div>
                        <input
                          value={row.synopsis}
                          onChange={(e) => {
                            const value = e.target.value;
                            setBulkRows((prev) =>
                              prev.map((r, i) => (i === index ? { ...r, synopsis: value } : r)),
                            );
                          }}
                          style={{ ...fieldStyle, padding: "6px 8px" }}
                          placeholder="Synopsis (optional)"
                        />
                      </div>
                      <div className="flex flex-col items-end gap-2" style={{ width: 160 }}>
                        <div className="cs-mono text-[10px] truncate max-w-full" style={{ color: "var(--cs-muted)" }}>
                          {row.file ? row.file.name : "No video attached"}
                        </div>
                        <div className="flex gap-1">
                          <button
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
                            className="px-2 py-1 disabled:opacity-40"
                            style={{ border: "1.5px solid var(--cs-ink)", color: "var(--cs-ink)" }}
                          >
                            ↑
                          </button>
                          <button
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
                            className="px-2 py-1 disabled:opacity-40"
                            style={{ border: "1.5px solid var(--cs-ink)", color: "var(--cs-ink)" }}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p className="cs-mono text-xs" style={{ color: "var(--cs-rust)" }}>
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4" style={{ borderTop: "1.5px solid var(--cs-line)" }}>
              <CsButton variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </CsButton>
              <CsButton variant="rust" disabled={savingBulk} onClick={handleBulkSave}>
                {savingBulk ? "Saving..." : "Create Episodes"}
              </CsButton>
            </div>
          </div>
        )}
      </div>
    </div>
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
    <div className="text-center cursor-pointer p-3" style={{ border: "1.5px dashed var(--cs-line)", background: "var(--cs-panel)" }}>
      <input
        type="file"
        accept="video/*"
        className="hidden"
        id={id}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <label htmlFor={id} className="block cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
        {file ? `Selected: ${file.name}` : `Upload ${label}`}
      </label>
    </div>
  );
}
