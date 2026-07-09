import { useCallback, useEffect, useMemo, useState } from "react";
import { FileDrop } from "./FileDrop";
import { Plus, Edit, Trash2, Search, Eye, Rocket, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useUploadQueue } from "@/context/UploadQueueProvider";
import { toast } from "sonner";
import { authFetch } from "@/lib/authClient";
import { titleStatus } from "../lib/status";
import { CsBox, CsButton, CsPageHeader, CsSlug, CsTag, type CsColumn } from "./cs/kit";

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
          className="cs-mono flex items-center gap-1.5 text-xs font-bold uppercase"
          style={{ color: "var(--cs-muted)" }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to movies
        </button>
        <div>
          <CsSlug className="mb-1">{editingMovie ? "Editing" : "New entry"}</CsSlug>
          <h1 className="cs-display" style={{ fontSize: 34, color: "var(--cs-ink)" }}>
            {editingMovie ? `Edit ${editingMovie.name}` : "New movie"}
          </h1>
          <p className="cs-mono text-xs mt-1" style={{ color: "var(--cs-muted)" }}>
            Work through the steps, then save.
          </p>
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
    <div className="space-y-8">
      <CsPageHeader
        title="The reels"
        chip={`${statusCounts.all} movies`}
        slug="Movie catalogue · features on the platform"
        actions={
          <CsButton
            variant="rust"
            onClick={() => {
              setEditingMovie(null);
              setIsAddDialogOpen(true);
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add movie
            </span>
          </CsButton>
        }
      />

      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--cs-muted)" }}
        />
        <input
          type="search"
          placeholder="SEARCH MOVIES…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
              {label} <span style={{ opacity: 0.65 }}>{statusCounts[key]}</span>
            </button>
          );
        })}
      </div>

      {/* Preview overlay */}
      {previewMovie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(22, 19, 16, 0.55)" }}
          onClick={() => setPreviewMovie(null)}
        >
          <div
            className="cs-border cs-shadow w-full max-w-3xl p-6"
            style={{ background: "var(--cs-paper)", maxHeight: "85vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-4" style={{ borderBottom: "2.5px solid var(--cs-ink)" }}>
              <div>
                <CsSlug>Preview</CsSlug>
                <h3 className="cs-display mt-1" style={{ fontSize: 28, color: "var(--cs-ink)" }}>
                  {previewMovie?.name ?? ""}
                </h3>
              </div>
              <button
                onClick={() => setPreviewMovie(null)}
                className="cs-mono text-xs font-bold px-2 py-1"
                style={{ border: "2px solid var(--cs-ink)" }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              {previewLoading && (
                <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                  Loading preview...
                </p>
              )}
              {previewError && (
                <p className="cs-mono text-xs" style={{ color: "var(--cs-rust)" }}>
                  {previewError}
                </p>
              )}
              {!previewLoading && !previewError && (
                <div className="space-y-4">
                  <div className="p-3" style={{ border: "1.5px solid var(--cs-line)", background: "var(--cs-panel)" }}>
                    <CsSlug className="mb-2">Renditions</CsSlug>
                    {previewAssets && previewAssets.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {previewAssets.map((a) => (
                          <CsTag
                            key={`${a.rendition}-${a.url ?? ""}`}
                            label={`${a.rendition}${a.status ? ` (${a.status})` : ""}`}
                            tone={a.status === "READY" ? "good" : "pending"}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                        No ready renditions yet (still processing or not uploaded).
                      </p>
                    )}
                  </div>
                  {previewAssets && previewAssets.some((a) => a.url) ? (
                    <video
                      className="w-full"
                      style={{ border: "1.5px solid var(--cs-line)" }}
                      controls
                      src={previewAssets.find((a) => a.url)?.url}
                    />
                  ) : (
                    <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                      No playable source available yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredMovies.length === 0 ? (
        <CsBox className="p-5">
          <CsSlug>Nothing filed here yet</CsSlug>
          <p className="mt-2 text-sm" style={{ color: "var(--cs-ink)" }}>
            No movies match your filters.
          </p>
        </CsBox>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMovies.map((movie) => {
            const status = statusTagProps(movie);
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
              <CsBox key={movie.id} shadow className="overflow-hidden">
                <div className="relative" style={{ aspectRatio: "16 / 9", background: "var(--cs-panel)" }}>
                  <ImageWithFallback
                    src={movie.thumbnailUrl || movie.posterUrl || ""}
                    alt={movie.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <CsTag label={status.label} tone={status.tone} />
                  </div>
                  <div
                    className="absolute inset-x-0 bottom-0 p-2.5"
                    style={{ background: "linear-gradient(to top, rgba(22,19,16,0.85), rgba(22,19,16,0.2), transparent)" }}
                  >
                    <p className="cs-mono text-xs font-bold uppercase truncate" style={{ color: "#fff", letterSpacing: "0.04em" }}>
                      {movie.name}
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between gap-2 px-3 py-2.5"
                  style={{ borderTop: "1.5px solid var(--cs-line)" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={edit}
                      className="cs-mono text-[10px] font-bold uppercase px-2 py-1 inline-flex items-center gap-1 transition-colors hover:bg-[var(--cs-panel)]"
                      style={{ border: "1.5px solid var(--cs-ink)", color: "var(--cs-ink)", letterSpacing: "0.06em" }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {movie.pendingReview && !publishing && (
                      <button
                        onClick={publish}
                        className="cs-mono text-[10px] font-bold uppercase px-2 py-1 inline-flex items-center gap-1"
                        style={{ background: "var(--cs-ink)", color: "#fff", letterSpacing: "0.06em" }}
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        Publish
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openPreview(movie)}
                      title="Preview"
                      className="transition-colors hover:bg-[var(--cs-panel)]"
                      style={{ border: "1.5px solid var(--cs-line)", color: "var(--cs-ink)", padding: 6 }}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={toggleArchive}
                      title={movie.archived ? "Unarchive" : "Archive"}
                      className="cs-mono text-[10px] font-bold uppercase px-2 py-1.5 transition-colors hover:bg-[var(--cs-panel)]"
                      style={{ border: "1.5px solid var(--cs-line)", color: "var(--cs-ink)" }}
                    >
                      {movie.archived ? "Unarchive" : "Archive"}
                    </button>
                    <button
                      onClick={remove}
                      title="Delete"
                      className="transition-colors"
                      style={{ border: "1.5px solid var(--cs-rust)", color: "var(--cs-rust)", padding: 6 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CsBox>
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
                className="cs-mono flex items-center justify-center text-xs font-bold"
                style={{
                  width: 28,
                  height: 28,
                  border: "1.5px solid var(--cs-ink)",
                  background: i < step ? "var(--cs-ink)" : i === step ? "var(--cs-rust)" : "var(--cs-paper)",
                  color: i < step || i === step ? "#fff" : "var(--cs-muted)",
                  borderColor: i === step ? "var(--cs-rust)" : "var(--cs-ink)",
                }}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </span>
              <span
                className="cs-mono text-xs hidden sm:inline font-bold uppercase"
                style={{ color: i === step ? "var(--cs-ink)" : "var(--cs-muted)" }}
              >
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                className="flex-1 mx-3"
                style={{ height: 1.5, background: i < step ? "var(--cs-rust)" : "var(--cs-line)" }}
              />
            )}
          </div>
        ))}
      </div>

      {steps[step].value === "basic" && (
        <div className="space-y-4 mt-4">
          <div>
            <CsSlug className="mb-1">Title</CsSlug>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={fieldStyle}
              placeholder="Enter movie title"
            />
          </div>

          <div>
            <CsSlug className="mb-1">Description</CsSlug>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...fieldStyle, resize: "vertical" }}
              rows={4}
              placeholder="Enter movie description"
            />
          </div>

          <div className="pt-2">
            <h3 className="cs-display" style={{ fontSize: 20, color: "var(--cs-ink)" }}>
              Metadata
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-3 mt-2">
              <div>
                <CsSlug className="mb-1">Genres (comma separated)</CsSlug>
                <input
                  value={genres.join(",")}
                  onChange={(e) => setGenres(e.target.value.split(",").map((g) => g.trim()).filter(Boolean))}
                  style={fieldStyle}
                  placeholder="Action, Drama, Comedy"
                />
              </div>
              <div>
                <CsSlug className="mb-1">Language</CsSlug>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={fieldStyle}>
                  {["en", "fr", "es", "pt", "ha", "yo", "ig"].map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <CsSlug className="mb-1">Runtime (minutes)</CsSlug>
                <input
                  type="number"
                  value={runtimeMinutes}
                  onChange={(e) => setRuntimeMinutes(e.target.value)}
                  style={fieldStyle}
                  placeholder="120"
                />
              </div>
              <div>
                <CsSlug className="mb-1">Maturity Rating</CsSlug>
                <select value={maturityRating} onChange={(e) => setMaturityRating(e.target.value)} style={fieldStyle}>
                  <option value="">Select rating</option>
                  {["G", "PG", "PG-13", "TV-Y", "TV-G", "TV-PG", "TV-14", "18+"].map((rate) => (
                    <option key={rate} value={rate}>
                      {rate}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <CsSlug className="mb-1">Release Date</CsSlug>
              <input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                style={{ ...fieldStyle, maxWidth: 240 }}
              />
            </div>
            <div className="mb-3">
              <CsSlug className="mb-1">Country Availability</CsSlug>
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
                      className="cs-mono text-xs font-bold uppercase"
                      style={{
                        padding: "5px 12px",
                        border: "1.5px solid var(--cs-ink)",
                        background: active ? "var(--cs-ink)" : "var(--cs-paper)",
                        color: active ? "#fff" : "var(--cs-ink)",
                      }}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>

            <label
              className="flex items-center gap-3 cursor-pointer"
              style={{
                padding: "10px 14px",
                border: "2px solid var(--cs-ink)",
                background: isOriginal ? "var(--cs-brand)" : "var(--cs-paper)",
              }}
            >
              <input
                type="checkbox"
                checked={isOriginal}
                onChange={(e) => setIsOriginal(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="cs-mono text-xs font-bold uppercase" style={{ color: "var(--cs-ink)" }}>
                Wanzami Original
              </span>
            </label>

            <div className="mt-4">
              <CsSlug className="mb-1">Availability</CsSlug>
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
                      className="cs-mono text-xs font-bold uppercase"
                      style={{
                        padding: "5px 12px",
                        border: "1.5px solid var(--cs-ink)",
                        background: active ? "var(--cs-ink)" : "var(--cs-paper)",
                        color: active ? "#fff" : "var(--cs-ink)",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {availability === "COMING_SOON" && (
                <div className="mt-3">
                  <CsSlug className="mb-1">Available from</CsSlug>
                  <input
                    type="datetime-local"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    style={fieldStyle}
                  />
                  <p className="cs-mono mt-1 text-xs" style={{ color: "var(--cs-muted)" }}>
                    Shows a "Coming Soon" badge and stays unplayable until this date, then auto-flips to Live.
                  </p>
                </div>
              )}
              {availability === "LEAVING_SOON" && (
                <div className="mt-3">
                  <CsSlug className="mb-1">Leaving on</CsSlug>
                  <input
                    type="datetime-local"
                    value={leavingAt}
                    onChange={(e) => setLeavingAt(e.target.value)}
                    style={fieldStyle}
                  />
                  <p className="cs-mono mt-1 text-xs" style={{ color: "var(--cs-muted)" }}>
                    Shows a "Leaving Soon" badge; the title is auto-archived after this date.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4" style={{ borderTop: "1.5px solid var(--cs-line)" }}>
            <h3 className="cs-display mb-4" style={{ fontSize: 20, color: "var(--cs-ink)" }}>
              PPV Settings
            </h3>

            <div className="flex items-center justify-between mb-4">
              <CsSlug>Enable PPV</CsSlug>
              <input
                type="checkbox"
                checked={ppvEnabled}
                onChange={(e) => setPpvEnabled(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            {ppvEnabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <CsSlug className="mb-1">PPV Price (NGN)</CsSlug>
                    <input
                      type="number"
                      value={ppvPrice}
                      onChange={(e) => setPpvPrice(e.target.value)}
                      style={fieldStyle}
                      placeholder="1500"
                    />
                  </div>
                  <div>
                    <CsSlug className="mb-1">Currency</CsSlug>
                    <select value={ppvCurrency} onChange={(e) => setPpvCurrency(e.target.value)} style={fieldStyle}>
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>
                <p className="cs-mono text-xs" style={{ color: "var(--cs-muted)" }}>
                  Buy-only PPV. Access duration uses the backend default (e.g., 30 days).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {steps[step].value === "media" && (
        <div className="space-y-4 mt-4">
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
              <CsSlug className="mb-1">Or link</CsSlug>
              <input
                value={shortTrailerUrlText}
                onChange={(e) => setShortTrailerUrlText(e.target.value)}
                style={fieldStyle}
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
              <CsSlug className="mb-1">Or link</CsSlug>
              <input
                value={trailerUrlText}
                onChange={(e) => setTrailerUrlText(e.target.value)}
                style={fieldStyle}
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>
      )}

      {steps[step].value === "metadata" && (
        <div className="space-y-4 mt-4">
          <div>
            <CsSlug className="mb-1">Meta Title</CsSlug>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              style={fieldStyle}
              placeholder="SEO title"
            />
          </div>

          <div>
            <CsSlug className="mb-1">Meta Description</CsSlug>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              style={{ ...fieldStyle, resize: "vertical" }}
              rows={3}
              placeholder="SEO description"
            />
          </div>

          <div>
            <CsSlug className="mb-1">Keywords (comma separated)</CsSlug>
            <input
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              style={fieldStyle}
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>
        </div>
      )}

      {steps[step].value === "restrictions" && (
        <div className="space-y-4 mt-4">
          <div>
            <CsSlug className="mb-1">Age Rating</CsSlug>
            <select value={rating} onChange={(e) => setRating(e.target.value)} style={fieldStyle}>
              <option value="">Select rating</option>
              <option value="g">General (G)</option>
              <option value="pg">Parental Guidance (PG)</option>
              <option value="pg13">PG-13</option>
              <option value="18">18+</option>
            </select>
          </div>

          <div>
            <CsSlug className="mb-1">Content Warnings</CsSlug>
            <textarea
              value={contentWarnings}
              onChange={(e) => setContentWarnings(e.target.value)}
              style={{ ...fieldStyle, resize: "vertical" }}
              rows={3}
              placeholder="List any content warnings"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="cs-mono text-xs" style={{ color: "var(--cs-rust)" }}>
          {error}
        </p>
      )}

      <div
        className="sticky bottom-0 flex items-center justify-between gap-3 py-3"
        style={{ borderTop: "2.5px solid var(--cs-ink)", background: "var(--cs-paper)" }}
      >
        <CsButton variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <span className="inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back
          </span>
        </CsButton>
        {isLast ? (
          <CsButton variant="rust" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save movie"}
          </CsButton>
        ) : (
          <CsButton variant="ink" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            <span className="inline-flex items-center gap-1">
              Next
              <ChevronRight className="w-4 h-4" />
            </span>
          </CsButton>
        )}
      </div>
    </div>
  );
}
