import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, PlayCircle, GripVertical, Upload } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useUploadQueue } from '@/context/UploadQueueProvider';
import { AddEditSeriesForm } from './AddEditSeriesForm';

type SeriesTitle = {
  id: string;
  name: string;
  type: string;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  description?: string | null;
  archived?: boolean;
  createdAt?: string;
  releaseDate?: string | null;
};

type Episode = {
  id: string;
  titleId: string;
  seasonNumber?: number;
  episodeNumber?: number;
  name?: string;
  synopsis?: string | null;
  createdAt?: string;
};

export function SeriesManagement() {
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [isAddEpisodeOpen, setIsAddEpisodeOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<SeriesTitle | null>(null);
  const [editingEpisode, setEditingEpisode] = useState<Episode | null>(null);
  const [series, setSeries] = useState<SeriesTitle[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkVideos, setBulkVideos] = useState<FileList | null>(null);
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null), []);
  const { startUpload } = useUploadQueue();

  const startUploadForSeries = (seriesId: number, file: File) => {
    startUpload("SERIES", seriesId, file);
  };

  const loadSeries = async () => {
    const res = await fetch('/api/admin/titles', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (res.ok) {
      const onlySeries = (data.titles ?? []).filter((t: any) => t.type === 'SERIES');
      setSeries(onlySeries);
    }
  };

  useEffect(() => {
    void loadSeries();
  }, [token]);

  useEffect(() => {
    const loadEpisodes = async () => {
      if (!selectedSeries) {
        setEpisodes([]);
        return;
      }
      const res = await fetch(`/api/admin/titles/${selectedSeries}/episodes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        setEpisodes(data.episodes ?? []);
      }
    };
    void loadEpisodes();
  }, [selectedSeries, token]);

  const startUploadForEpisode = (episodeId: number, file: File) => {
    startUpload("EPISODE", episodeId, file);
  };

  const persistEpisodeOrder = async (ordered: Episode[]) => {
    for (let i = 0; i < ordered.length; i++) {
      const ep = ordered[i];
      await fetch(`/api/admin/episodes/${ep.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ episodeNumber: i + 1 }),
      });
    }
  };

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDrop = async (idx: number) => {
    if (dragIndex === null || dragIndex === idx) return;
    setDragIndex(null);
    const filtered = episodes.filter((ep) => String(ep.titleId) === String(selectedSeries));
    const reordered = [...filtered];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(idx, 0, moved);
    // Merge back into episodes array
    const others = episodes.filter((ep) => String(ep.titleId) !== String(selectedSeries));
    const newOrdered = reordered.map((ep, i) => ({ ...ep, episodeNumber: i + 1 }));
    setEpisodes([...others, ...newOrdered]);
    await persistEpisodeOrder(newOrdered);
  };

  const handleBulkCreate = async () => {
    if (!selectedSeries) return;
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    setBulkSaving(true);
    try {
      const records: Array<{ seasonNumber: number; episodeNumber: number; name: string; synopsis: string }> = [];
      for (const line of lines) {
        const parts = line.split(",").map((p) => p.trim());
        const seasonNumber = Number(parts[0] || 1);
        const episodeNumber = Number(parts[1] || 1);
        const name = parts[2] || `Episode ${episodeNumber}`;
        const synopsis = parts.slice(3).join(",") || "";
        records.push({ seasonNumber, episodeNumber, name, synopsis });
        await fetch(`/api/admin/titles/${selectedSeries}/episodes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ seasonNumber, episodeNumber, name, synopsis }),
        });
      }
      setBulkText("");
      setIsBulkOpen(false);
      const res = await fetch(`/api/admin/titles/${selectedSeries}/episodes`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        setEpisodes(data.episodes ?? []);
        // If videos were provided, map them by order to the records (season/episode)
        if (bulkVideos && bulkVideos.length) {
          const list = Array.from(bulkVideos);
          for (let i = 0; i < Math.min(list.length, records.length); i++) {
            const rec = records[i];
            const file = list[i];
            const ep = (data.episodes ?? []).find(
              (e: any) =>
                e.seasonNumber === rec.seasonNumber &&
                e.episodeNumber === rec.episodeNumber,
            );
            if (ep?.id) {
              startUploadForEpisode(Number(ep.id), file);
            }
          }
        }
      }
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">Series Management</h1>
          <p className="text-neutral-400 mt-1">Manage episodic content</p>
        </div>
        <Dialog
          open={!!editingSeries}
          onOpenChange={(open) => {
            if (open) {
              setEditingSeries({
                id: "",
                name: "",
                type: "SERIES",
                description: "",
                thumbnailUrl: "",
                posterUrl: "",
                archived: false,
                createdAt: "",
              });
            } else {
              setEditingSeries(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Series
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">{editingSeries?.id ? "Edit Series" : "Add Series"}</DialogTitle>
            </DialogHeader>
            {editingSeries && (
              <AddEditSeriesForm
                token={token ?? undefined}
                series={editingSeries}
                onClose={() => setEditingSeries(null)}
                onSaved={async () => {
                  setEditingSeries(null);
                  await loadSeries();
                }}
                onQueueUpload={(id, file) => startUploadForSeries(id, file)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Series List */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-white">All Series</CardTitle>
          <p className="text-neutral-500 text-sm">
            Select a series to manage episodes. Use bulk add to paste multiple episodes. All media uploads go to the upload queue dock.
          </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {series.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedSeries === item.id
                    ? 'border-[#fd7e14] bg-[#fd7e14]/10'
                    : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950'
                }`}
                onClick={() => setSelectedSeries(item.id)}
              >
                <div className="flex gap-4">
                  <ImageWithFallback
                    src={item.thumbnailUrl || item.posterUrl || ""}
                    alt={item.name}
                    className="w-24 h-36 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-white mb-2">{item.name}</h3>
                    <div className="space-y-1 text-sm text-neutral-400">
                      <p>Type: {item.type}</p>
                      <p>
                        Started:{" "}
                        {item.releaseDate ? new Date(item.releaseDate).getFullYear() : "—"}
                      </p>
                      <p>Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '--'}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="ghost" className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10">
                        <Edit className="w-4 h-4" onClick={() => setEditingSeries(item)} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={async () => {
                          if (!confirm("Delete this series?")) return;
                          await fetch(`/api/admin/titles/${item.id}`, {
                            method: "DELETE",
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          });
                          setSelectedSeries(null);
                          // refresh list
                          const res = await fetch('/api/admin/titles', {
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          });
                          const data = await res.json();
                          if (res.ok) {
                            const onlySeries = (data.titles ?? []).filter((t: any) => t.type === 'SERIES');
                            setSeries(onlySeries);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-neutral-300 hover:text-white hover:bg-neutral-700"
                        onClick={async () => {
                          await fetch(`/api/admin/titles/${item.id}`, {
                            method: "PATCH",
                            headers: {
                              "Content-Type": "application/json",
                              ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                            body: JSON.stringify({ archived: !item.archived }),
                          });
                          const res = await fetch('/api/admin/titles', {
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          });
                          const data = await res.json();
                          if (res.ok) {
                            const onlySeries = (data.titles ?? []).filter((t: any) => t.type === 'SERIES');
                            setSeries(onlySeries);
                          }
                        }}
                      >
                        {item.archived ? "Unarchive" : "Archive"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {series.length === 0 && (
              <div className="text-neutral-500 text-sm">No series yet.</div>
            )}
          </CardContent>
        </Card>

        {/* Episodes for Selected Series */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-white">Episodes</CardTitle>
              <p className="text-sm text-neutral-400 mt-1">
                {selectedSeries ? series.find((s: any) => s.id === selectedSeries)?.name : 'Select a series'}
              </p>
            </div>
            {selectedSeries && (
              <Dialog open={isAddEpisodeOpen} onOpenChange={(open) => { setIsAddEpisodeOpen(open); if (!open) setEditingEpisode(null); }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Episode
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">{editingEpisode ? "Edit Episode" : "Add Episode"}</DialogTitle>
                  </DialogHeader>
                  <AddEpisodeForm
                    token={token ?? undefined}
                    titleId={selectedSeries}
                    episode={editingEpisode ?? undefined}
                    onClose={() => {
                      setIsAddEpisodeOpen(false);
                      setEditingEpisode(null);
                    }}
                    onSaved={async (ep) => {
                      setIsAddEpisodeOpen(false);
                      setEditingEpisode(null);
                      setEpisodes((prev) => {
                        const others = prev.filter((e) => e.id !== ep.id);
                        return [ep, ...others];
                      });
                      const res = await fetch(`/api/admin/titles/${selectedSeries}/episodes`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                      });
                      const data = await res.json();
                      if (res.ok) setEpisodes(data.episodes ?? []);
                    }}
                  />
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {selectedSeries ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                        <Upload className="w-4 h-4 mr-2" />
                        Bulk Add Episodes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Bulk Add Episodes</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-neutral-400 mb-2">
                      One per line: season, episode, title, synopsis. Example: <code>1,1,Pilot,The journey begins</code>
                    </p>
                    <Textarea
                      rows={6}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="bg-neutral-950 border-neutral-800 text-white"
                      placeholder="1,1,Pilot,The journey begins&#10;1,2,Second,Next steps"
                    />
                    <div className="mt-3">
                      <Label className="text-neutral-300">Optional: Upload video files (ordered to match lines above)</Label>
                      <input
                        type="file"
                        accept="video/*"
                        multiple
                        onChange={(e) => setBulkVideos(e.target.files)}
                        className="mt-2 text-sm text-neutral-200"
                      />
                      <p className="text-xs text-neutral-500 mt-1">Files will be matched in order to the episodes you paste.</p>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <Button variant="outline" onClick={() => setIsBulkOpen(false)} className="border-neutral-700 text-neutral-300">
                        Cancel
                      </Button>
                      <Button onClick={handleBulkCreate} disabled={bulkSaving} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                          {bulkSaving ? "Saving..." : "Add Episodes"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <p className="text-xs text-neutral-500">Drag episodes to reorder; numbers update automatically.</p>
                </div>

                {episodes
                  .filter((ep) => String(ep.titleId) === String(selectedSeries))
                  .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
                  .map((episode, idx) => (
                    <div
                      key={episode.id}
                      className="p-4 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors"
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(idx)}
                    >
                      <div className="flex gap-4">
                        <div className="flex items-center">
                          <GripVertical className="w-5 h-5 text-neutral-500 cursor-move" />
                        </div>
                        <div className="relative">
                          <ImageWithFallback
                            src={""}
                            alt={episode.name || "Episode"}
                            className="w-32 h-20 object-cover rounded-lg"
                          />
                          <PlayCircle className="absolute inset-0 m-auto w-8 h-8 text-white opacity-80" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-white">
                                S{episode.seasonNumber ?? "-"}E{episode.episodeNumber ?? "-"}: {episode.name ?? "Untitled"}
                              </h4>
                              {episode.synopsis && <p className="text-sm text-neutral-400 mt-1">{episode.synopsis}</p>}
                            </div>
                            <div className="flex gap-2 items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10"
                          onClick={() => {
                            setEditingEpisode(episode);
                            setIsAddEpisodeOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                              <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <label className="text-xs text-[#fd7e14] hover:text-[#ff9940] cursor-pointer">
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) startUploadForEpisode(Number(episode.id), f);
                                  }}
                                />
                                Upload video
                              </label>
                            </div>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 mt-2">Ready</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                Select a series to view episodes
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddEpisodeForm({
  token,
  titleId,
  episode,
  onClose,
  onSaved,
}: {
  token?: string;
  titleId: string | null;
  episode?: Episode;
  onClose: () => void;
  onSaved: (ep: Episode) => void;
}) {
  const [season, setSeason] = useState(episode?.seasonNumber ?? 1);
  const [episodeNumber, setEpisodeNumber] = useState(episode?.episodeNumber ?? 1);
  const [name, setName] = useState(episode?.name ?? "");
  const [synopsis, setSynopsis] = useState(episode?.synopsis ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSeason(episode?.seasonNumber ?? 1);
    setEpisodeNumber(episode?.episodeNumber ?? 1);
    setName(episode?.name ?? "");
    setSynopsis(episode?.synopsis ?? "");
  }, [episode?.id]);

  const handleSave = async () => {
    if (!titleId) {
      setError("Select a series first.");
      return;
    }
    if (!name.trim() || !season || !episodeNumber) {
      setError("Season, episode number, and name are required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      if (episode?.id) {
        const res = await fetch(`/api/admin/episodes/${episode.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            seasonNumber: season,
            episodeNumber,
            name: name.trim(),
            synopsis,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to update episode");
        onSaved({ ...episode, ...data.episode });
      } else {
        const res = await fetch(`/api/admin/titles/${titleId}/episodes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            seasonNumber: season,
            episodeNumber,
            name: name.trim(),
            synopsis,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to create episode");
        onSaved(data.episode);
      }
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-neutral-300">Season</Label>
          <Input
            type="number"
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            placeholder="1"
          />
        </div>
        <div>
          <Label className="text-neutral-300">Episode Number</Label>
          <Input
            type="number"
            value={episodeNumber}
            onChange={(e) => setEpisodeNumber(Number(e.target.value))}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            placeholder="1"
          />
        </div>
      </div>

      <div>
        <Label className="text-neutral-300">Episode Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 bg-neutral-950 border-neutral-800 text-white"
          placeholder="Enter episode name"
        />
      </div>

      <div>
        <Label className="text-neutral-300">Synopsis</Label>
        <Textarea
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          className="mt-1 bg-neutral-950 border-neutral-800 text-white"
          placeholder="Short summary"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
        <Button variant="outline" onClick={onClose} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
          Cancel
        </Button>
        <Button disabled={saving} onClick={handleSave} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          {saving ? "Saving..." : "Save Episode"}
        </Button>
      </div>
    </div>
  );
}
