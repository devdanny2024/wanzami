import { useEffect, useMemo, useState } from "react";
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
import { useUploadQueue } from "@/context/UploadQueueProvider";
import { toast } from "sonner";

export type MovieTitle = {
  id: string;
  name: string;
  type: string;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  description?: string | null;
  trailerUrl?: string | null;
  archived?: boolean;
  createdAt?: string;
  episodeCount?: number;
  releaseDate?: string | null;
};

export function MoviesManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<MovieTitle | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<MovieTitle[]>([]);
  const { startUpload } = useUploadQueue();

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

  const startUploadForMovie = (movieId: number, file: File) => {
    startUpload("MOVIE", movieId, file);
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
                setEditingMovie(null);
              }}
              movie={editingMovie ?? undefined}
              onQueueUpload={(id, file) => startUploadForMovie(id, file)}
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
                          onClick={() => {
                            setEditingMovie(movie);
                            setIsAddDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={async () => {
                            if (!confirm("Delete this title?")) return;
                            await fetch(`/api/admin/titles/${movie.id}`, {
                              method: "DELETE",
                              headers: token ? { Authorization: `Bearer ${token}` } : {},
                            });
                            void reloadMovies();
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-neutral-300 hover:text-white hover:bg-neutral-700"
                          onClick={async () => {
                            await fetch(`/api/admin/titles/${movie.id}`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                              },
                              body: JSON.stringify({ archived: !movie.archived }),
                            });
                            void reloadMovies();
                          }}
                        >
                          {movie.archived ? "Unarchive" : "Archive"}
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
    </div>
  );
}

function AddEditMovieForm({
  token,
  onClose,
  onSaved,
  movie,
  onQueueUpload,
}: {
  token?: string;
  onClose: () => void;
  onSaved: () => void;
  movie?: MovieTitle;
  onQueueUpload: (id: number, file: File) => void;
}) {
  const [title, setTitle] = useState(movie?.name ?? "");
  const [description, setDescription] = useState(movie?.description ?? "");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [trailerUrlText, setTrailerUrlText] = useState(movie?.trailerUrl ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
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

  useEffect(() => {
    setTitle(movie?.name ?? "");
    setDescription(movie?.description ?? "");
    setTrailerUrlText(movie?.trailerUrl ?? "");
  }, [movie?.id]);

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
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        "x-amz-acl": "public-read",
      },
      body: file,
    });
    if (!putRes.ok) {
      throw new Error("Upload failed");
    }
    return (data.publicUrl as string) || (data.key as string);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      if (!title.trim()) {
        setError("Title is required");
        setSaving(false);
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

      // Require all key fields before save
      if (!payload.description || (!posterFile && !movie?.posterUrl) || (!thumbFile && !movie?.thumbnailUrl)) {
        setError("Title, description, poster, and thumbnail are required.");
        setSaving(false);
        return;
      }
      if (!trailerFile && !trailerUrlText && !movie?.trailerUrl) {
        setError("Trailer file or URL is required.");
        setSaving(false);
        return;
      }

      const isEdit = !!movie?.id;
      const endpoint = isEdit ? `/api/admin/titles/${movie.id}` : "/api/admin/titles";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
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
      const newId = Number(data?.title?.id ?? movie?.id);
      if (videoFile && newId) {
        onQueueUpload(newId, videoFile);
      }
      toast.success(isEdit ? "Movie updated" : "Movie created");
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Save failed");
      toast.error(err?.message || "Save failed");
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
          <label className="mt-1 block border-2 border-dashed border-neutral-800 rounded-lg p-8 text-center bg-neutral-950 cursor-pointer">
            <p className="text-neutral-400">Drop video file here or click to browse</p>
            <p className="text-xs text-neutral-500 mt-1">MP4, MOV, AVI (Max 5GB)</p>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
            {videoFile && <p className="text-xs text-[#fd7e14] mt-2">Selected: {videoFile.name}</p>}
          </label>
          <p className="text-xs text-neutral-500 mt-1">
            Video uploads queue after you save. You can also use the table “Upload video” action per row.
          </p>
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
