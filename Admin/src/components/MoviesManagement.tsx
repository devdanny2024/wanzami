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
import { authFetch } from "@/lib/authClient";

export type MovieTitle = {
  id: string;
  name: string;
  type: string;
  pendingReview?: boolean;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  description?: string | null;
  trailerUrl?: string | null;
  archived?: boolean;
  createdAt?: string;
  episodeCount?: number;
  releaseDate?: string | null;
  language?: string | null;
  runtimeMinutes?: number | null;
  maturityRating?: string | null;
  countryAvailability?: string[];
  isOriginal?: boolean;
  genres?: string[];
};

export function MoviesManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<MovieTitle | null>(null);
  const [previewMovie, setPreviewMovie] = useState<MovieTitle | null>(null);
  const [previewAssets, setPreviewAssets] = useState<
    { rendition: string; url?: string | null; status?: string }[] | null
  >(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<MovieTitle[]>([]);
  const { startUpload, tasks } = useUploadQueue();

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null), []);

  useEffect(() => {
    void reloadMovies();
  }, [token]);

  const reloadMovies = async () => {
    try {
      const res = await authFetch("/admin/titles", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const onlyMovies = ((res.data as any)?.titles ?? []).filter((t: any) => t.type === "MOVIE");
        setMovies(onlyMovies);
      }
    } catch {
      // ignore reload errors; UI will show empty
    }
  };

  const startUploadForMovie = (movieId: number, file: File) => {
    startUpload("MOVIE", movieId, file);
  };

  const filteredMovies = movies.filter((m) => m.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const openPreview = async (movie: MovieTitle) => {
    try {
      setPreviewMovie(movie);
      setPreviewLoading(true);
      setPreviewError(null);
      setPreviewAssets(null);
      const res = await authFetch(`/admin/titles/${movie.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error((res.data as any)?.message || "Failed to load title");
      }
      const assets = ((res.data as any)?.title?.assetVersions as any[]) || [];
      setPreviewAssets(assets);
    } catch (err: any) {
      setPreviewError(err?.message || "Failed to load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

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

      {/* Preview Dialog */}
      <Dialog open={!!previewMovie} onOpenChange={(open) => !open && setPreviewMovie(null)}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              Preview {previewMovie?.name ?? ""}
            </DialogTitle>
          </DialogHeader>
          {previewLoading && <p className="text-neutral-400 text-sm">Loading preview...</p>}
          {previewError && <p className="text-red-400 text-sm">{previewError}</p>}
          {!previewLoading && !previewError && (
            <div className="space-y-4">
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                <p className="text-sm text-neutral-300 mb-2">Renditions</p>
                {previewAssets && previewAssets.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {previewAssets.map((a) => (
                      <Badge
                        key={`${a.rendition}-${a.url ?? ""}`}
                        className={
                          a.status === "READY"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-300"
                        }
                      >
                        {a.rendition} {a.status ? `(${a.status})` : ""}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">No ready renditions yet (still processing or not uploaded).</p>
                )}
              </div>
              {previewAssets && previewAssets.some((a) => a.url) ? (
                <video
                  className="w-full rounded-lg border border-neutral-800"
                  controls
                  src={previewAssets.find((a) => a.url)?.url}
                />
              ) : (
                <p className="text-sm text-neutral-400">No playable source available yet.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Movies Grid */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white">All Movies</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMovies.length === 0 ? (
            <p className="text-neutral-500 text-sm">No movies found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMovies.map((movie) => {
                const statusLabel = movie.archived
                  ? "Archived"
                  : movie.pendingReview
                  ? "Pending review"
                  : "Live";
                return (
                  <div
                    key={movie.id}
                    className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 group"
                  >
                    <div className="relative h-56">
                      <ImageWithFallback
                        src={movie.thumbnailUrl || movie.posterUrl || ""}
                        alt={movie.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button
                          size="sm"
                          className="bg-white/10 text-white hover:bg-white/20"
                          onClick={() => openPreview(movie)}
                        >
                          Preview
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/10 text-white hover:bg-white/20"
                          onClick={() => {
                            setEditingMovie(movie);
                            setIsAddDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-white font-semibold line-clamp-1">{movie.name}</p>
                          <p className="text-xs text-neutral-400">{statusLabel}</p>
                        </div>
                        <Badge
                          className={
                            movie.archived
                              ? "bg-neutral-700 text-neutral-200"
                              : movie.pendingReview
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={async () => {
                            if (!confirm("Delete this title?")) return;
                            await authFetch(`/admin/titles/${movie.id}`, {
                              method: "DELETE",
                              headers: token ? { Authorization: `Bearer ${token}` } : {},
                            });
                            void reloadMovies();
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#fd7e14] hover:text-[#ff9940] hover:bg-[#fd7e14]/10"
                          onClick={async () => {
                            await authFetch(`/admin/titles/${movie.id}`, {
                              method: "PATCH",
                              headers: token ? { Authorization: `Bearer ${token}` } : {},
                              body: JSON.stringify({ archived: !movie.archived }),
                            });
                            void reloadMovies();
                          }}
                        >
                          {movie.archived ? "Unarchive" : "Archive"}
                        </Button>
                        {!tasks.some(
                          (t) =>
                            t.kind === "MOVIE" &&
                            String(t.targetId) === String(movie.id) &&
                            t.status !== "completed" &&
                            t.status !== "failed"
                        ) && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={async () => {
                              await authFetch(`/admin/titles/${movie.id}/publish`, {
                                method: "POST",
                                headers: token ? { Authorization: `Bearer ${token}` } : {},
                              });
                              void reloadMovies();
                            }}
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
  const [genres, setGenres] = useState<string[]>([]);
  const [language, setLanguage] = useState(movie?.language ?? "en");
  const [runtimeMinutes, setRuntimeMinutes] = useState<string>(movie?.runtimeMinutes ? String(movie.runtimeMinutes) : "");
  const [maturityRating, setMaturityRating] = useState<string>(movie?.maturityRating ?? "");
  const [releaseDate, setReleaseDate] = useState<string>(movie?.releaseDate?.slice(0, 10) ?? "");
  const [countryAvailability, setCountryAvailability] = useState<string[]>([]);
  const [isOriginal, setIsOriginal] = useState<boolean>(!!movie?.isOriginal);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [trailerUrlText, setTrailerUrlText] = useState(movie?.trailerUrl ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [ppvEnabled, setPpvEnabled] = useState(false);
  const [price, setPrice] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
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
    setLanguage((movie as any)?.language ?? "en");
    setRuntimeMinutes((movie as any)?.runtimeMinutes ? String((movie as any).runtimeMinutes) : "");
    setMaturityRating((movie as any)?.maturityRating ?? "");
    setReleaseDate((movie as any)?.releaseDate?.slice(0, 10) ?? "");
    setCountryAvailability(((movie as any)?.countryAvailability ?? []) as string[]);
    setIsOriginal(!!(movie as any)?.isOriginal);
    setGenres(((movie as any)?.genres ?? []) as string[]);
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
        language,
        runtimeMinutes: runtimeMinutes ? Number(runtimeMinutes) : undefined,
        maturityRating: maturityRating || undefined,
        releaseDate: releaseDate ? new Date(releaseDate).toISOString() : undefined,
        countryAvailability,
        isOriginal,
        genres,
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
        if (buyPrice) payload.buyPrice = Number(buyPrice);
        if (rentalPeriod) payload.rentalPeriod = rentalPeriod;
      } else {
        payload.ppvEnabled = false;
        payload.price = undefined;
        payload.buyPrice = undefined;
        payload.rentalPeriod = undefined;
      }

      if (!movie?.id) {
        // New titles start pending review and archived until published.
        payload.pendingReview = true;
        payload.archived = true;
      }

      // Require all key fields before save
      if (!payload.description) {
        setError("Description is required.");
        setSaving(false);
        return;
      }
      if (!payload.genres || payload.genres.length === 0) {
        setError("At least one genre is required.");
        setSaving(false);
        return;
      }
      if (!payload.maturityRating) {
        setError("Maturity rating is required.");
        setSaving(false);
        return;
      }
      if (!payload.runtimeMinutes) {
        setError("Runtime (minutes) is required.");
        setSaving(false);
        return;
      }
      if (!payload.countryAvailability || payload.countryAvailability.length === 0) {
        setError("At least one country code is required.");
        setSaving(false);
        return;
      }
      if (!payload.releaseDate) {
        setError("Release date is required.");
        setSaving(false);
        return;
      }
      if (!posterFile && !movie?.posterUrl) {
        setError("Poster is required.");
        setSaving(false);
        return;
      }
      if (!thumbFile && !movie?.thumbnailUrl) {
        setError("Thumbnail is required.");
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

        <div className="pt-2">
          <h3 className="text-white font-semibold mb-2">Metadata</h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <Label className="text-neutral-300">Genres (comma separated)</Label>
              <Input
                value={genres.join(",")}
                onChange={(e) => setGenres(e.target.value.split(",").map((g) => g.trim()).filter(Boolean))}
                className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                placeholder="Action, Drama, Comedy"
              />
            </div>
        <div>
          <Label className="text-neutral-300">Language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800">
              {["en", "fr", "es", "pt", "ha", "yo", "ig"].map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <Label className="text-neutral-300">Runtime (minutes)</Label>
              <Input
                type="number"
                value={runtimeMinutes}
                onChange={(e) => setRuntimeMinutes(e.target.value)}
                className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                placeholder="120"
              />
            </div>
        <div>
          <Label className="text-neutral-300">Maturity Rating</Label>
          <Select value={maturityRating} onValueChange={setMaturityRating}>
            <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800">
              {["G", "PG", "PG-13", "TV-Y", "TV-G", "TV-PG", "TV-14", "18+"].map((rate) => (
                <SelectItem key={rate} value={rate}>
                  {rate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <Label className="text-neutral-300">Release Date</Label>
              <Input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="mt-1 bg-neutral-950 border-neutral-800 text-white"
              />
            </div>
        <div>
          <Label className="text-neutral-300">Country Availability</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {["NG", "US", "UK", "CA", "ZA", "GH", "KE", "DE", "FR", "IN"].map((code) => {
              const active = countryAvailability.includes(code);
              return (
                <button
                  type="button"
                  key={code}
                  onClick={() =>
                    setCountryAvailability((prev) =>
                      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
                    )
                  }
                  className={`px-3 py-1 rounded-full text-sm border ${
                    active
                      ? "bg-[#fd7e14]/20 border-[#fd7e14] text-[#fd7e14]"
                      : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </div>
      </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={isOriginal}
              onCheckedChange={setIsOriginal}
              className="data-[state=checked]:bg-[#fd7e14]"
            />
            <Label className="text-neutral-300">Wanzami Original</Label>
          </div>
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
                  <Label className="text-neutral-300">Rent Price (NGN)</Label>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                    placeholder="1500"
                  />
                </div>

                <div>
                  <Label className="text-neutral-300">Rent Duration</Label>
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

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <Label className="text-neutral-300">Buy Price (NGN)</Label>
                  <Input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                    placeholder="3000"
                  />
                  <p className="text-xs text-neutral-500 mt-1">Buy unlocks indefinitely (no duration).</p>
                </div>
              </div>

              <p className="text-xs text-neutral-500">
                Rent includes a duration (countdown to be implemented later). Buy has no expiry.
              </p>
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
