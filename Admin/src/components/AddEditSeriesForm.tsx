import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MovieTitle } from "./MoviesManagement"; // reuse shape

export function AddEditSeriesForm({
  token,
  series,
  onClose,
  onSaved,
  onQueueUpload,
}: {
  token?: string;
  series: MovieTitle;
  onClose: () => void;
  onSaved: () => void;
  onQueueUpload: (id: number, file: File) => void;
}) {
  const [title, setTitle] = useState(series.name ?? "");
  const [description, setDescription] = useState(series.description ?? "");
  const [releaseYear, setReleaseYear] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(series.name ?? "");
    setDescription(series.description ?? "");
    setReleaseYear(series.releaseDate ? new Date(series.releaseDate).getFullYear().toString() : "");
  }, [series.id]);

  const uploadAsset = async (file: File, kind: "poster" | "thumbnail") => {
    const res = await fetch("/api/admin/assets/presign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ contentType: file.type || "application/octet-stream", kind }),
    });
    const data = await res.json();
    if (!res.ok || !data.url || !data.key) {
      throw new Error(data?.message || "Failed to presign upload");
    }
    const putRes = await fetch(data.url, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error("Upload failed");
    }
    return (data.publicUrl as string) || (data.key as string);
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const isEdit = !!series.id;
      const endpoint = isEdit ? `/api/admin/titles/${series.id}` : "/api/admin/titles";
      const method = isEdit ? "PATCH" : "POST";
      const payload: any = {
        name: title.trim(),
        description: description.trim(),
        type: "SERIES",
      };
      if (releaseYear) payload.releaseYear = Number(releaseYear);
      if (posterFile) payload.posterUrl = await uploadAsset(posterFile, "poster");
      if (thumbFile) payload.thumbnailUrl = await uploadAsset(thumbFile, "thumbnail");
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Save failed");
      const newId = Number(data?.title?.id ?? series.id);
      if (videoFile && newId) {
        onQueueUpload(newId, videoFile);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="bg-neutral-800 border-neutral-700">
        <TabsTrigger value="basic" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
          Basic Info
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            placeholder="Enter series title"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-neutral-300">Year started</Label>
            <Input
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              className="mt-1 bg-neutral-950 border-neutral-800 text-white"
              placeholder="e.g. 2020"
            />
          </div>
        </div>
        <div>
          <Label className="text-neutral-300">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            rows={4}
            placeholder="Enter series description"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-neutral-300">Poster</Label>
            <div className="border border-dashed border-neutral-700 rounded-lg p-4 text-center cursor-pointer bg-neutral-950/50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="series-poster-upload"
                onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
              />
              <label htmlFor="series-poster-upload" className="block text-neutral-400">
                {posterFile ? `Selected: ${posterFile.name}` : "Drop or click to upload poster"}
              </label>
            </div>
          </div>
          <div>
            <Label className="text-neutral-300">Thumbnail</Label>
            <div className="border border-dashed border-neutral-700 rounded-lg p-4 text-center cursor-pointer bg-neutral-950/50">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="series-thumb-upload"
                onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
              />
              <label htmlFor="series-thumb-upload" className="block text-neutral-400">
                {thumbFile ? `Selected: ${thumbFile.name}` : "Drop or click to upload thumbnail"}
              </label>
            </div>
          </div>
        </div>
        <div>
          <Label className="text-neutral-300">Series video (optional)</Label>
          <div className="border border-dashed border-neutral-700 rounded-lg p-4 text-center cursor-pointer bg-neutral-950/50">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              id="series-video-upload"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
            <label htmlFor="series-video-upload" className="block text-neutral-400">
              {videoFile ? `Selected: ${videoFile.name}` : "Drop or click to upload series video"}
            </label>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-neutral-800 pt-4">
          <Button variant="outline" onClick={onClose} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
            Cancel
          </Button>
          <Button disabled={saving} onClick={handleSave} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
            {saving ? "Saving..." : "Save Series"}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
