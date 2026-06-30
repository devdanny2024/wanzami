import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { StatusBadge } from "./StatusBadge";
import { titleStatus } from "../lib/status";
import { FileDrop } from "./FileDrop";
import { Plus, Edit, Trash2, Search, Eye, MoreVertical, Rocket, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useUploadQueue } from "@/context/UploadQueueProvider";
import { toast } from "sonner";
import { authFetch } from "@/lib/authClient";

export type MovieTitle = {
  id: string;
  name: string;
  type: string;
  isPpv?: boolean;
  ppvPriceNaira?: number | null;
  ppvCurrency?: string | null;
  pendingReview?: boolean;
  thumbnailUrl?: string | null;
  posterUrl?: string | null;
  previewSpriteUrl?: string | null;
  previewVttUrl?: string | null;
  description?: string | null;
  trailerUrl?: string | null;
  shortTrailerUrl?: string | null;
  archived?: boolean;
  createdAt?: string;
  episodeCount?: number;
  releaseDate?: string | null;
  language?: string | null;
  runtimeMinutes?: number | null;
  maturityRating?: string | null;
  countryAvailability?: string[];
  isOriginal?: boolean;
  availability?: "LIVE" | "COMING_SOON" | "LEAVING_SOON";
  availableFrom?: string | null;
  leavingAt?: string | null;
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
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "coming" | "pending" | "archived">("all");
  const [movies, setMovies] = useState<MovieTitle[]>([]);
  const { startUpload, startAssetUpload, tasks } = useUploadQueue();

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("accessToken") : null), []);

  const reloadMovies = useCallback(async () => {
    try {
      const res = await authFetch("/admin/titles", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        toast.error((res.data as any)?.message || `Failed to load titles (${res.status})`);
        setMovies([]);
        return;
      }
      const onlyMovies = ((res.data as any)?.titles ?? []).filter((t: any) => t.type === "MOVIE");
      setMovies(onlyMovies);
    } catch {
      toast.error("Failed to load titles (network error)");
      setMovies([]);
    }
  }, [token]);

  useEffect(() => {
    void reloadMovies();
  }, [reloadMovies]);

  const startUploadForMovie = (movieId: number, file: File) => {
    startUpload("MOVIE", movieId, file);
  };

  const statusKey = (m: MovieTitle): "live" | "coming" | "pending" | "archived" =>
    m.archived
      ? "archived"
      : m.pendingReview
      ? "pending"
      : m.availability === "COMING_SOON" || m.availability === "LEAVING_SOON"
      ? "coming"
      : "live";

  const searchedMovies = movies.filter((m) => m.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const statusCounts = {
    all: searchedMovies.length,
    live: 0,
    coming: 0,
    pending: 0,
    archived: 0,
  };
  searchedMovies.forEach((m) => {
    statusCounts[statusKey(m)] += 1;
  });
  const filteredMovies =
    statusFilter === "all" ? searchedMovies : searchedMovies.filter((m) => statusKey(m) === statusFilter);

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

  if (isAddDialogOpen) {
    const closeEditor = () => {
      setIsAddDialogOpen(false);
      setEditingMovie(null);
    };
    return (
      <div className="space-y-5 pb-4 max-w-4xl">
        <button
          onClick={closeEditor}
          className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to movies
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {editingMovie ? `Edit ${editingMovie.name}` : "New movie"}
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">Work through the steps, then save.</p>
        </div>
        <AddEditMovieForm
          token={token ?? undefined}
          onClose={closeEditor}
          onSaved={() => {
            void reloadMovies();
            closeEditor();
          }}
          movie={editingMovie ?? undefined}
          onQueueUpload={(id, file) => startUploadForMovie(id, file)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-white">Movies</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage all movie content on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
            onClick={() => {
              setEditingMovie(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add movie
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <Input
          type="search"
          placeholder="Search movies…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-neutral-950 border-neutral-800 text-white"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          ["all", "All"],
          ["live", "Live"],
          ["coming", "Coming soon"],
          ["pending", "Pending"],
          ["archived", "Archived"],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
              statusFilter === key
                ? "bg-[#fd7e14]/15 border-[#fd7e14] text-[#fd7e14]"
                : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-600"
            }`}
          >
            {label} <span className="opacity-60">{statusCounts[key]}</span>
          </button>
        ))}
      </div>

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

      {filteredMovies.length === 0 ? (
        <p className="text-neutral-500 text-sm py-10 text-center">No movies match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMovies.map((movie) => {
            const status = titleStatus(movie);
            const publishing = tasks.some(
              (t) =>
                t.kind === "MOVIE" &&
                String(t.targetId) === String(movie.id) &&
                t.status !== "completed" &&
                t.status !== "failed"
            );
            const toggleArchive = async () => {
              await authFetch(`/admin/titles/${movie.id}`, {
                method: "PATCH",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: JSON.stringify({ archived: !movie.archived }),
              });
              void reloadMovies();
            };
            const publish = async () => {
              await authFetch(`/admin/titles/${movie.id}/publish`, {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              void reloadMovies();
            };
            const remove = async () => {
              if (!confirm(`Delete "${movie.name}"?`)) return;
              await authFetch(`/admin/titles/${movie.id}`, {
                method: "DELETE",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              void reloadMovies();
            };
            const edit = () => {
              setEditingMovie(movie);
              setIsAddDialogOpen(true);
            };
            return (
              <div key={movie.id} className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 group">
                <div className="relative aspect-video bg-neutral-950">
                  <ImageWithFallback
                    src={movie.thumbnailUrl || movie.posterUrl || ""}
                    alt={movie.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <StatusBadge tone={status.tone} label={status.label} />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/30 to-transparent">
                    <p className="text-white text-sm font-medium line-clamp-1">{movie.name}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-t border-white/5">
                  {movie.pendingReview && !publishing ? (
                    <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white" onClick={publish}>
                      <Rocket className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                  ) : (
                    <Button size="sm" className="h-8 bg-[#fd7e14]/15 text-[#fd7e14] hover:bg-[#fd7e14]/25" onClick={edit}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-neutral-300 hover:text-white"
                      title="Preview"
                      onClick={() => openPreview(movie)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-neutral-300 hover:text-white"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-neutral-900 border-neutral-800 text-neutral-200">
                        <DropdownMenuItem onClick={edit}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPreview(movie)}>Preview</DropdownMenuItem>
                        {!publishing && <DropdownMenuItem onClick={publish}>Publish</DropdownMenuItem>}
                        <DropdownMenuItem onClick={toggleArchive}>
                          {movie.archived ? "Unarchive" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 focus:text-red-300" onClick={remove}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
  const { startAssetUpload } = useUploadQueue();
  const [title, setTitle] = useState(movie?.name ?? "");
  const [description, setDescription] = useState(movie?.description ?? "");
  const [genres, setGenres] = useState<string[]>([]);
  const [language, setLanguage] = useState(movie?.language ?? "en");
  const [runtimeMinutes, setRuntimeMinutes] = useState<string>(movie?.runtimeMinutes ? String(movie.runtimeMinutes) : "");
  const [maturityRating, setMaturityRating] = useState<string>(movie?.maturityRating ?? "");
  const [releaseDate, setReleaseDate] = useState<string>(movie?.releaseDate?.slice(0, 10) ?? "");
  const [countryAvailability, setCountryAvailability] = useState<string[]>([]);
  const [isOriginal, setIsOriginal] = useState<boolean>(!!movie?.isOriginal);
  const [availability, setAvailability] = useState<"LIVE" | "COMING_SOON" | "LEAVING_SOON">(
    movie?.availability ?? "LIVE"
  );
  const [availableFrom, setAvailableFrom] = useState<string>((movie as any)?.availableFrom?.slice(0, 16) ?? "");
  const [leavingAt, setLeavingAt] = useState<string>((movie as any)?.leavingAt?.slice(0, 16) ?? "");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [trailerUrlText, setTrailerUrlText] = useState(movie?.trailerUrl ?? "");
  const [shortTrailerFile, setShortTrailerFile] = useState<File | null>(null);
  const [shortTrailerUrlText, setShortTrailerUrlText] = useState((movie as any)?.shortTrailerUrl ?? "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [ppvEnabled, setPpvEnabled] = useState<boolean>(!!(movie as any)?.isPpv);
  const [ppvPrice, setPpvPrice] = useState<string>(
    (movie as any)?.ppvPriceNaira ? String((movie as any).ppvPriceNaira) : ""
  );
  const [ppvCurrency, setPpvCurrency] = useState<string>((movie as any)?.ppvCurrency ?? "NGN");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [rating, setRating] = useState("");
  const [contentWarnings, setContentWarnings] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setTitle(movie?.name ?? "");
    setDescription(movie?.description ?? "");
    setTrailerUrlText(movie?.trailerUrl ?? "");
    setShortTrailerUrlText((movie as any)?.shortTrailerUrl ?? "");
    setLanguage((movie as any)?.language ?? "en");
    setRuntimeMinutes((movie as any)?.runtimeMinutes ? String((movie as any).runtimeMinutes) : "");
    setMaturityRating((movie as any)?.maturityRating ?? "");
    setReleaseDate((movie as any)?.releaseDate?.slice(0, 10) ?? "");
    setCountryAvailability(((movie as any)?.countryAvailability ?? []) as string[]);
    setIsOriginal(!!(movie as any)?.isOriginal);
    setAvailability(((movie as any)?.availability ?? "LIVE") as "LIVE" | "COMING_SOON" | "LEAVING_SOON");
    setAvailableFrom((movie as any)?.availableFrom?.slice(0, 16) ?? "");
    setLeavingAt((movie as any)?.leavingAt?.slice(0, 16) ?? "");
    setGenres(((movie as any)?.genres ?? []) as string[]);
    setPpvEnabled(!!(movie as any)?.isPpv);
    setPpvPrice((movie as any)?.ppvPriceNaira ? String((movie as any).ppvPriceNaira) : "");
    setPpvCurrency((movie as any)?.ppvCurrency ?? "NGN");
  }, [movie]);

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
        availability,
        availableFrom:
          availability === "COMING_SOON" && availableFrom ? new Date(availableFrom).toISOString() : undefined,
        leavingAt:
          availability === "LEAVING_SOON" && leavingAt ? new Date(leavingAt).toISOString() : undefined,
        genres,
      };
      if (trailerFile) {
        // Uploaded after save via queue.
      } else if (trailerUrlText) {
        payload.trailerUrl = trailerUrlText;
      }
      if (!shortTrailerFile && shortTrailerUrlText) payload.shortTrailerUrl = shortTrailerUrlText;

      if (metaTitle) payload.metaTitle = metaTitle;
      if (metaDescription) payload.metaDescription = metaDescription;
      if (metaKeywords) payload.metaKeywords = metaKeywords;
      if (rating) payload.rating = rating;
      if (contentWarnings) payload.contentWarnings = contentWarnings;
      if (ppvEnabled) {
        payload.isPpv = true;
        payload.ppvPriceNaira = ppvPrice ? Number(ppvPrice) : undefined;
        payload.ppvCurrency = ppvCurrency || "NGN";
      } else {
        payload.isPpv = false;
        payload.ppvPriceNaira = null;
        payload.ppvCurrency = null;
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
      if (availability === "COMING_SOON" && !payload.availableFrom) {
        setError("Pick the date this title becomes available (Coming Soon).");
        setSaving(false);
        return;
      }
      if (availability === "LEAVING_SOON" && !payload.leavingAt) {
        setError("Pick the date this title leaves the catalog (Leaving Soon).");
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
      if (ppvEnabled && (!ppvPrice || Number(ppvPrice) <= 0)) {
        setError("PPV price is required and must be greater than 0.");
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

      let queuedAssets = 0;
      if (newId) {
        if (posterFile) {
          startAssetUpload("MOVIE", newId, posterFile, "poster", "posterUrl");
          queuedAssets += 1;
        }
        if (thumbFile) {
          startAssetUpload("MOVIE", newId, thumbFile, "thumbnail", "thumbnailUrl");
          queuedAssets += 1;
        }
        if (shortTrailerFile) {
          startAssetUpload("MOVIE", newId, shortTrailerFile, "trailer", "shortTrailerUrl");
          queuedAssets += 1;
        }
        if (trailerFile) {
          startAssetUpload("MOVIE", newId, trailerFile, "trailer", "trailerUrl");
          queuedAssets += 1;
        }
      }
      if (queuedAssets > 0) {
        toast.info("Artwork and trailer uploads were added to the queue.");
      }

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

  const steps = [
    { value: "basic", label: "Details" },
    { value: "media", label: "Media" },
    { value: "metadata", label: "Metadata & SEO" },
    { value: "restrictions", label: "Restrictions" },
  ];
  const isLast = step === steps.length - 1;

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={s.value} className="flex items-center flex-1 last:flex-none">
            <button type="button" onClick={() => setStep(i)} className="flex items-center gap-2 shrink-0">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border ${
                  i < step
                    ? "bg-emerald-500 border-emerald-500 text-emerald-950"
                    : i === step
                    ? "bg-[#fd7e14] border-[#fd7e14] text-black"
                    : "bg-neutral-900 border-neutral-700 text-neutral-400"
                }`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span className={`text-xs hidden sm:inline ${i === step ? "text-white" : "text-neutral-500"}`}>
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span className={`flex-1 h-px mx-3 ${i < step ? "bg-[#fd7e14]" : "bg-neutral-800"}`} />
            )}
          </div>
        ))}
      </div>

      <Tabs value={steps[step].value} className="w-full">
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

          <div className="mb-3">
            <Label className="text-neutral-300">Release Date</Label>
            <Input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="mt-1 bg-neutral-950 border-neutral-800 text-white w-full sm:max-w-xs"
            />
          </div>
          <div className="mb-3">
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

          <div className="flex items-center gap-2">
            <Switch
              checked={isOriginal}
              onCheckedChange={setIsOriginal}
              className="data-[state=checked]:bg-[#fd7e14]"
            />
            <Label className="text-neutral-300">Wanzami Original</Label>
          </div>

          <div className="mt-4">
            <Label className="text-neutral-300">Availability</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {([
                { key: "LIVE", label: "Live" },
                { key: "COMING_SOON", label: "Coming Soon" },
                { key: "LEAVING_SOON", label: "Leaving Soon" },
              ] as const).map((opt) => {
                const active = availability === opt.key;
                return (
                  <button
                    type="button"
                    key={opt.key}
                    onClick={() => setAvailability(opt.key)}
                    className={`px-3 py-1 rounded-full text-sm border ${
                      active
                        ? "bg-[#fd7e14]/20 border-[#fd7e14] text-[#fd7e14]"
                        : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {availability === "COMING_SOON" && (
              <div className="mt-3">
                <Label className="text-neutral-300">Available from</Label>
                <Input
                  type="datetime-local"
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Shows a “Coming Soon” badge and stays unplayable until this date, then auto-flips to Live.
                </p>
              </div>
            )}
            {availability === "LEAVING_SOON" && (
              <div className="mt-3">
                <Label className="text-neutral-300">Leaving on</Label>
                <Input
                  type="datetime-local"
                  value={leavingAt}
                  onChange={(e) => setLeavingAt(e.target.value)}
                  className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Shows a “Leaving Soon” badge; the title is auto-archived after this date.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-4 mt-4">
          <h3 className="text-white mb-4">PPV Settings</h3>

          <div className="flex items-center justify-between mb-4">
            <Label className="text-neutral-300">Enable PPV</Label>
            <Switch checked={ppvEnabled} onCheckedChange={setPpvEnabled} className="data-[state=checked]:bg-[#fd7e14]" />
          </div>

          {ppvEnabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-neutral-300">PPV Price (NGN)</Label>
                  <Input
                    type="number"
                    value={ppvPrice}
                    onChange={(e) => setPpvPrice(e.target.value)}
                    className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                    placeholder="1500"
                  />
                </div>
                <div>
                  <Label className="text-neutral-300">Currency</Label>
                  <Select value={ppvCurrency} onValueChange={setPpvCurrency}>
                    <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-800">
                      <SelectItem value="NGN">NGN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                Buy-only PPV. Access duration uses the backend default (e.g., 30 days).
              </p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="media" className="space-y-4 mt-4">
        <FileDrop
          id="movie-video-upload"
          label="Video file"
          accept="video/*"
          file={videoFile}
          hint="MP4, MOV, AVI · up to 5GB · queues after save"
          onSelect={setVideoFile}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileDrop
            id="movie-poster-upload"
            label="Poster (2:3)"
            accept="image/*"
            file={posterFile}
            currentUrl={movie?.posterUrl}
            hint="JPG/PNG · 1080×1920"
            onSelect={setPosterFile}
          />
          <FileDrop
            id="movie-thumb-upload"
            label="Thumbnail (16:9)"
            accept="image/*"
            file={thumbFile}
            currentUrl={movie?.thumbnailUrl}
            hint="JPG/PNG · 1920×1080"
            onSelect={setThumbFile}
          />
        </div>
        <div>
          <FileDrop
            id="movie-short-trailer-upload"
            label="Short trailer (hero background)"
            accept="video/*"
            file={shortTrailerFile}
            currentUrl={shortTrailerUrlText || (movie as any)?.shortTrailerUrl}
            hint="MP4 or HLS"
            onSelect={setShortTrailerFile}
          />
          <div className="mt-2">
            <Label className="text-neutral-300">Or link</Label>
            <Input
              value={shortTrailerUrlText}
              onChange={(e) => setShortTrailerUrlText(e.target.value)}
              className="mt-1 bg-neutral-950 border-neutral-800 text-white"
              placeholder="https://cdn.../short-trailer.mp4"
            />
          </div>
        </div>
        <div>
          <FileDrop
            id="movie-trailer-upload"
            label="Trailer"
            accept="video/*"
            file={trailerFile}
            currentUrl={trailerUrlText || movie?.trailerUrl}
            hint="MP4 preferred"
            onSelect={setTrailerFile}
          />
          <div className="mt-2">
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

      </Tabs>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-950/85 backdrop-blur-sm py-3">
        <Button
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="text-neutral-300 hover:text-white disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        {isLast ? (
          <Button disabled={saving} onClick={handleSave} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
            {saving ? "Saving…" : "Save movie"}
          </Button>
        ) : (
          <Button
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            className="bg-[#fd7e14] hover:bg-[#ff9940] text-white"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
