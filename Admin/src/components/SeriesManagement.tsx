import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Plus, Edit, Trash2, PlayCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { UploadDock, UploadTask } from './UploadDock';
import { initUpload, uploadMultipart } from '@/lib/uploadClient';

type SeriesTitle = {
  id: string;
  name: string;
  type: string;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
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
  const [series, setSeries] = useState<SeriesTitle[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [uploads, setUploads] = useState<(UploadTask & { file?: File; targetEpisodeId?: number })[]>([]);
  const [running, setRunning] = useState(false);
  const activeCount = useRef(0);
  const MAX_CONCURRENCY = 3;
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null), []);

  useEffect(() => {
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
        <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Series
        </Button>
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
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                        <Trash2 className="w-4 h-4" />
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
              <Dialog open={isAddEpisodeOpen} onOpenChange={setIsAddEpisodeOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Episode
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Episode</DialogTitle>
                  </DialogHeader>
                  <AddEpisodeForm onClose={() => setIsAddEpisodeOpen(false)} />
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
                              <Button size="sm" variant="ghost" className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10">
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

function AddEpisodeForm({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-neutral-300">Season</Label>
          <Input type="number" className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="1" />
        </div>
        <div>
          <Label className="text-neutral-300">Episode Number</Label>
          <Input type="number" className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="1" />
        </div>
      </div>

      <div>
        <Label className="text-neutral-300">Episode Name</Label>
        <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="Enter episode name" />
      </div>

      <div>
        <Label className="text-neutral-300">Duration</Label>
        <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="45:30" />
      </div>

      <div>
        <Label className="text-neutral-300">Upload Video</Label>
        <div className="mt-1 border-2 border-dashed border-neutral-800 rounded-lg p-6 text-center bg-neutral-950">
          <p className="text-neutral-400">Drop video file here or click to browse</p>
        </div>
      </div>

      <div>
        <Label className="text-neutral-300">Upload Thumbnail</Label>
        <div className="mt-1 border-2 border-dashed border-neutral-800 rounded-lg p-6 text-center bg-neutral-950">
          <p className="text-neutral-400">Drop thumbnail here or click to browse</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
        <Button variant="outline" onClick={onClose} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
          Cancel
        </Button>
        <Button onClick={onClose} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          Save Episode
        </Button>
      </div>
    </div>
  );
}
