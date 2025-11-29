import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { UploadDock, UploadTask } from "./UploadDock";
import { initUpload, uploadMultipart } from "@/lib/uploadClient";

type MovieTitle = {
  id: string;
  name: string;
  type: string;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  createdAt?: string;
  episodeCount?: number;
};

export function MoviesManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploads, setUploads] = useState<(UploadTask & { file?: File; targetId?: number })[]>([]);
  const [movies, setMovies] = useState<MovieTitle[]>([]);
  const [running, setRunning] = useState(false);
  const activeCount = useRef(0);
  const MAX_CONCURRENCY = 3;

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null), []);

  useEffect(() => {
    void reloadMovies();
  }, [token]);

  const reloadMovies = async () => {
    const res = await fetch("/api/admin/titles", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (res.ok) {
      const onlyMovies = (data.titles ?? []).filter((t: any) => t.type === "MOVIE");
      setMovies(onlyMovies);
    }
  };

  useEffect(() => {
    if (!running) return;
    const next = uploads.find((t) => t.status === "pending");
    if (!next || activeCount.current >= MAX_CONCURRENCY) return;
    activeCount.current += 1;
    setUploads((prev) => prev.map((t) => (t.id === next.id ? { ...t, status: "uploading" } : t)));
    void handleUpload(next).finally(() => {
      activeCount.current -= 1;
      setTimeout(() => setRunning(true), 0);
    });
  }, [running, uploads]);

  const handleUpload = async (task: UploadTask & { file?: File; targetId?: number }) => {
    try {
      if (!task.file) throw new Error("Missing file");
      const startTime = performance.now();
      const init = await initUpload(
        {
          kind: "MOVIE",
          titleId: task.targetId,
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
        prev.map((t) => (t.id === task.id ? { ...t, status: "processing", progress: 100 } : t))
      );
    } catch (err: any) {
      setUploads((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: "failed", error: err?.message ?? "Upload failed" } : t
        )
      );
    }
  };

  const startUploadForMovie = (movieId: number, file: File) => {
    const task: UploadTask & { file?: File; targetId?: number } = {
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      size: file.size,
      status: "pending",
      progress: 0,
      file,
      targetId: movieId,
    };
    setUploads((prev) => [...prev, task]);
    setRunning(true);
  };

  const filteredMovies = movies.filter((m) => m.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white">Movies Management</h1>
          <p className="text-neutral-400 mt-1">Manage all content on the platform</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Movie
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Add/Edit Movie</DialogTitle>
            </DialogHeader>
            <AddEditMovieForm
              token={token ?? undefined}
              onClose={() => setIsAddDialogOpen(false)}
              onSaved={() => {
                void reloadMovies();
                setIsAddDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              type="search"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-950 border-neutral-800 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movies Table */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">All Movies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-3 px-4 text-neutral-400">Thumbnail</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Title</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Type</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Episodes</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Created</th>
                  <th className="text-left py-3 px-4 text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovies.map((movie) => (
                  <tr key={movie.id} className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <ImageWithFallback
                        src={movie.thumbnailUrl || movie.posterUrl || ""}
                        alt={movie.name}
                        className="w-16 h-24 object-cover rounded-lg"
                      />
                    </td>
                    <td className="py-3 px-4 text-white">{movie.name}</td>
                    <td className="py-3 px-4 text-neutral-300">{movie.type}</td>
                    <td className="py-3 px-4 text-neutral-300">{movie.episodeCount ?? 0}</td>
                    <td className="py-3 px-4 text-neutral-300">
                      {movie.createdAt ? new Date(movie.createdAt).toLocaleDateString() : "--"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 items-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <label className="text-xs text-[#fd7e14] hover:text-[#ff9940] cursor-pointer">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) startUploadForMovie(Number(movie.id), f);
                            }}
                          />
                          Upload video
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <UploadDock tasks={uploads} onRemove={(id) => setUploads((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}

function AddEditMovieForm({
  token,
  onClose,
  onSaved,
}: {
  token?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [trailerUrlText, setTrailerUrlText] = useState("");
  const [ppvEnabled, setPpvEnabled] = useState(false);
  const [price, setPrice] = useState("");
  const [rentalPeriod, setRentalPeriod] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [rating, setRating] = useState("");
  const [contentWarnings, setContentWarnings] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAsset = async (file: File, kind: "poster" | "thumbnail" | "trailer") => {
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
    return data.key as string;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      if (!title.trim()) {
        setError("Title is required");
        return;
      }
      const payload: any = {
        name: title.trim(),
        type: "MOVIE",
        description,
      };

      if (posterFile) payload.posterUrl = await uploadAsset(posterFile, "poster");
      if (thumbFile) payload.thumbnailUrl = await uploadAsset(thumbFile, "thumbnail");
      if (trailerFile) payload.trailerUrl = await uploadAsset(trailerFile, "trailer");
      else if (trailerUrlText) payload.trailerUrl = trailerUrlText;

      if (metaTitle) payload.metaTitle = metaTitle;
      if (metaDescription) payload.metaDescription = metaDescription;
      if (metaKeywords) payload.metaKeywords = metaKeywords;
      if (rating) payload.rating = rating;
      if (contentWarnings) payload.contentWarnings = contentWarnings;
      if (ppvEnabled) {
        payload.ppvEnabled = true;
        if (price) payload.price = Number(price);
        if (rentalPeriod) payload.rentalPeriod = rentalPeriod;
      }

      const res = await fetch("/api/admin/titles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to save movie");
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
        <TabsTrigger value="media" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
          Media Uploads
        </TabsTrigger>
        <TabsTrigger value="metadata" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
          Metadata & SEO
        </TabsTrigger>
        <TabsTrigger value="restrictions" className="data-[state=active]:bg-[#fd7e14] data-[state=active]:text-white">
          Restrictions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            placeholder="Enter movie title"
          />
        </div>

        <div>
          <Label className="text-neutral-300">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            rows={4}
            placeholder="Enter movie description"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-neutral-300">Genre</Label>
            <Select>
              <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800">
                <SelectItem value="action">Action</SelectItem>
                <SelectItem value="drama">Drama</SelectItem>
                <SelectItem value="comedy">Comedy</SelectItem>
                <SelectItem value="romance">Romance</SelectItem>
                <SelectItem value="thriller">Thriller</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-neutral-300">Release Year</Label>
            <Input
              type="number"
              className="mt-1 bg-neutral-950 border-neutral-800 text-white"
              placeholder="2024"
            />
          </div>
        </div>

        <div>
          <Label className="text-neutral-300">Cast List (comma separated)</Label>
          <Input className="mt-1 bg-neutral-950 border-neutral-800 text-white" placeholder="Actor 1, Actor 2, Actor 3" />
        </div>

        <div className="border-t border-neutral-800 pt-4 mt-4">
          <h3 className="text-white mb-4">PPV Settings</h3>

          <div className="flex items-center justify-between mb-4">
            <Label className="text-neutral-300">Enable PPV</Label>
            <Switch checked={ppvEnabled} onCheckedChange={setPpvEnabled} className="data-[state=checked]:bg-[#fd7e14]" />
          </div>

          {ppvEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-neutral-300">Price (NGN)</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                    placeholder="1500"
                  />
                </div>

                <div>
                  <Label className="text-neutral-300">Rental Period</Label>
                  <Select value={rentalPeriod} onValueChange={setRentalPeriod}>
                    <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="48h">48 hours</SelectItem>
                      <SelectItem value="72h">72 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
      </TabsContent>

      <TabsContent value="media" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Upload Video File</Label>
          <div className="mt-1 border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-950">
            <p className="text-neutral-400">Use the table Upload video action to queue video uploads.</p>
            <p className="text-xs text-neutral-500 mt-1">MP4, MOV, AVI (Max 5GB)</p>
          </div>
        </div>

        <div>
          <Label className="text-neutral-300">Upload Poster</Label>
          <label className="mt-1 block border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-950 cursor-pointer">
            <p className="text-neutral-400">Drop poster image here or click to browse</p>
            <p className="text-xs text-neutral-500 mt-1">JPG, PNG (Recommended: 1080x1920)</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)}
            />
            {posterFile && <p className="text-xs text-[#fd7e14] mt-2">Selected: {posterFile.name}</p>}
          </label>
        </div>

        <div>
          <Label className="text-neutral-300">Upload Thumbnail</Label>
          <label className="mt-1 block border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-950 cursor-pointer">
            <p className="text-neutral-400">Drop thumbnail image here or click to browse</p>
            <p className="text-xs text-neutral-500 mt-1">JPG, PNG (Recommended: 1920x1080)</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            />
            {thumbFile && <p className="text-xs text-[#fd7e14] mt-2">Selected: {thumbFile.name}</p>}
          </label>
        </div>

        <div>
          <Label className="text-neutral-300">Upload Trailer</Label>
          <label className="mt-1 block border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-950 cursor-pointer">
            <p className="text-neutral-400">Drop trailer file here or click to browse</p>
            <p className="text-xs text-neutral-500 mt-1">MP4 preferred</p>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setTrailerFile(e.target.files?.[0] ?? null)}
            />
            {trailerFile && <p className="text-xs text-[#fd7e14] mt-2">Selected: {trailerFile.name}</p>}
          </label>
          <div className="mt-3">
            <Label className="text-neutral-300">Or link</Label>
            <Input
              value={trailerUrlText}
              onChange={(e) => setTrailerUrlText(e.target.value)}
              className="mt-1 bg-neutral-950 border-neutral-800 text-white"
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="metadata" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Meta Title</Label>
          <Input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            placeholder="SEO title"
          />
        </div>

        <div>
          <Label className="text-neutral-300">Meta Description</Label>
          <Textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            rows={3}
            placeholder="SEO description"
          />
        </div>

        <div>
          <Label className="text-neutral-300">Keywords (comma separated)</Label>
          <Input
            value={metaKeywords}
            onChange={(e) => setMetaKeywords(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>
      </TabsContent>

      <TabsContent value="restrictions" className="space-y-4 mt-4">
        <div>
          <Label className="text-neutral-300">Age Rating</Label>
          <Select value={rating} onValueChange={setRating}>
            <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800">
              <SelectItem value="g">General (G)</SelectItem>
              <SelectItem value="pg">Parental Guidance (PG)</SelectItem>
              <SelectItem value="pg13">PG-13</SelectItem>
              <SelectItem value="18">18+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-neutral-300">Content Warnings</Label>
          <Textarea
            value={contentWarnings}
            onChange={(e) => setContentWarnings(e.target.value)}
            className="mt-1 bg-neutral-950 border-neutral-800 text-white"
            rows={3}
            placeholder="List any content warnings"
          />
        </div>
      </TabsContent>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-800">
        <Button variant="outline" onClick={onClose} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
          Cancel
        </Button>
        <Button disabled={saving} onClick={handleSave} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          {saving ? "Saving..." : "Save Movie"}
        </Button>
      </div>
    </Tabs>
  );
}
