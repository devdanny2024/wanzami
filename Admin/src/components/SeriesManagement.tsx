import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, PlayCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { UploadDock, UploadTask } from './UploadDock';
import { initUpload, uploadMultipart } from '@/lib/uploadClient';
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
  const [uploads, setUploads] = useState<(UploadTask & { file?: File; targetEpisodeId?: number })[]>([]);
  const [running, setRunning] = useState(false);
  const activeCount = useRef(0);
  const MAX_CONCURRENCY = 3;
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null), []);

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

  useEffect(() => {
    if (!running) return;
    const next = uploads.find((t) => t.status === 'pending');
    if (!next || activeCount.current >= MAX_CONCURRENCY) return;
    activeCount.current += 1;
    setUploads((prev) => prev.map((t) => (t.id === next.id ? { ...t, status: 'uploading' } : t)));
    void handleUpload(next).finally(() => {
      activeCount.current -= 1;
      setTimeout(() => setRunning(true), 0);
    });
  }, [running, uploads]);

  const handleUpload = async (task: UploadTask & { file?: File; targetEpisodeId?: number }) => {
    try {
      if (!task.file || !task.targetEpisodeId) throw new Error('Missing file or episode');
      const startTime = performance.now();
      const init = await initUpload(
        {
          kind: 'EPISODE',
          episodeId: task.targetEpisodeId,
          file: task.file,
        },
        token ?? undefined
      );
      await uploadMultipart(task.file, init, token, (p) => {
        const elapsed = (performance.now() - startTime) / 1000;
        const speed = elapsed > 0 ? (p.uploadedBytes * 8) / (elapsed * 1_000_000) : undefined;
        setUploads((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? { ...t, progress: Math.round((p.uploadedBytes / p.totalBytes) * 100), speedMbps: speed }
              : t
          )
        );
      });
      setUploads((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'processing', progress: 100 } : t))
      );
    } catch (err: any) {
      setUploads((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: 'failed', error: err?.message ?? 'Upload failed' } : t
        )
      );
    }
  };

  const startUploadForEpisode = (episodeId: number, file: File) => {
    const task: UploadTask & { file?: File; targetEpisodeId?: number } = {
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      file,
      targetEpisodeId: episodeId,
    };
    setUploads((prev) => [...prev, task]);
    setRunning(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">Series Management</h1>
          <p className="text-neutral-400 mt-1">Manage episodic content</p>
        </div>
        <Dialog open={!!editingSeries} onOpenChange={(open) => setEditingSeries(open ? editingSeries : null)}>
          <DialogTrigger asChild>
            <Button
              className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
              onClick={() =>
                setEditingSeries({
                  id: "",
                  name: "",
                  type: "SERIES",
                  description: "",
                  thumbnailUrl: "",
                  posterUrl: "",
                  archived: false,
                  createdAt: "",
                })
              }
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
                {episodes
                  .filter((ep) => ep.titleId === selectedSeries)
                  .map((episode) => (
                    <div key={episode.id} className="p-4 rounded-lg border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors">
                      <div className="flex gap-4">
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
      <UploadDock tasks={uploads} onRemove={(id) => setUploads((prev) => prev.filter((t) => t.id !== id))} />
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
