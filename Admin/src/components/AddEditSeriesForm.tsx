import { useEffect, useState } from "react";
import { MovieTitle } from "./MoviesManagement"; // reuse shape
import { useUploadQueue } from "@/context/UploadQueueProvider";
import { FileDrop } from "./FileDrop";
import { CsButton, CsSlug } from "./cs/kit";

const GENRE_OPTIONS = [
  "Action",
  "Comedy",
  "Drama",
  "Thriller",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Documentary",
  "Animation",
  "Fantasy",
  "Crime",
  "Family",
];

const fieldStyle: React.CSSProperties = {
  border: "2px solid var(--cs-ink)",
  background: "var(--cs-paper)",
  color: "var(--cs-ink)",
  fontFamily: "var(--font-smono), monospace",
  fontSize: 12,
  padding: "9px 12px",
  width: "100%",
};

function SeriesFormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="cs-border p-4 sm:p-5" style={{ background: "var(--cs-paper)" }}>
      <h3 className="cs-display mb-4" style={{ fontSize: 20, color: "var(--cs-ink)" }}>
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function AddEditSeriesForm({
  token,
  series,
  onClose,
  onSaved,
  onQueueUpload,
}: {
  token?: string;
  series?: MovieTitle;
  onClose: () => void;
  onSaved: () => void;
  onQueueUpload: (id: number, file: File, rendition?: string) => void;
}) {
  const [title, setTitle] = useState(series?.name ?? "");
  const [description, setDescription] = useState(series?.description ?? "");
  const [releaseYear, setReleaseYear] = useState("");
  const [genres, setGenres] = useState<string[]>(series?.genres ?? []);
  const [language, setLanguage] = useState(series?.language ?? "en");
  const [maturityRating, setMaturityRating] = useState<string>(series?.maturityRating ?? "");
  const [countryAvailability, setCountryAvailability] = useState<string[]>(series?.countryAvailability ?? []);
  const [isOriginal, setIsOriginal] = useState<boolean>(!!series?.isOriginal);
  const [ppvEnabled, setPpvEnabled] = useState<boolean>(!!(series as any)?.isPpv);
  const [ppvPrice, setPpvPrice] = useState<string>((series as any)?.ppvPriceNaira ? String((series as any).ppvPriceNaira) : "");
  const [ppvCurrency, setPpvCurrency] = useState<string>((series as any)?.ppvCurrency ?? "NGN");
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [trailerFile, setTrailerFile] = useState<File | null>(null);
  const [shortTrailerFile, setShortTrailerFile] = useState<File | null>(null);
  const [shortTrailerUrlText, setShortTrailerUrlText] = useState((series as any)?.shortTrailerUrl ?? "");
  const [introStart, setIntroStart] = useState<number | "">("");
  const [introEnd, setIntroEnd] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { startAssetUpload } = useUploadQueue();

  useEffect(() => {
    setTitle(series?.name ?? "");
    setDescription(series?.description ?? "");
    setReleaseYear(series?.releaseDate ? new Date(series.releaseDate).getFullYear().toString() : "");
    setGenres(series?.genres ?? []);
    setLanguage(series?.language ?? "en");
    setMaturityRating(series?.maturityRating ?? "");
    setCountryAvailability(series?.countryAvailability ?? []);
    setIsOriginal(!!series?.isOriginal);
    setIntroStart((series as any)?.introStartSec ?? "");
    setIntroEnd((series as any)?.introEndSec ?? "");
    setPpvEnabled(!!(series as any)?.isPpv);
    setPpvPrice((series as any)?.ppvPriceNaira ? String((series as any).ppvPriceNaira) : "");
    setPpvCurrency((series as any)?.ppvCurrency ?? "NGN");
    setPosterFile(null);
    setThumbFile(null);
    setTrailerFile(null);
    setShortTrailerFile(null);
    setShortTrailerUrlText((series as any)?.shortTrailerUrl ?? "");
  }, [series]);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (!genres.length) {
      setError("At least one genre is required.");
      return;
    }
    if (!maturityRating) {
      setError("Maturity rating is required.");
      return;
    }
    if (!countryAvailability.length) {
      setError("At least one country code is required.");
      return;
    }
    if (ppvEnabled && (!ppvPrice || Number(ppvPrice) <= 0)) {
      setError("PPV price is required and must be greater than 0.");
      return;
    }
    if (introStart !== "" && Number(introStart) < 0) {
      setError("Intro start must be zero or positive seconds.");
      return;
    }
    if (introEnd !== "" && Number(introEnd) < 0) {
      setError("Intro end must be zero or positive seconds.");
      return;
    }
    if (introStart !== "" && introEnd !== "" && Number(introStart) >= Number(introEnd)) {
      setError("Intro end must be greater than intro start.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const isEdit = !!series?.id;
      const endpoint = isEdit ? `/api/admin/titles/${series?.id}` : "/api/admin/titles";
      const method = isEdit ? "PATCH" : "POST";
      const payload: any = {
        name: title.trim(),
        description: description.trim(),
        type: "SERIES",
        genres,
        language,
        maturityRating,
        countryAvailability,
        isOriginal,
      };
      if (!isEdit) {
        payload.pendingReview = true;
        payload.archived = true;
      }
      if (releaseYear) payload.releaseYear = Number(releaseYear);
      if (introStart !== "") payload.introStartSec = Number(introStart);
      if (introEnd !== "") payload.introEndSec = Number(introEnd);
      if (ppvEnabled) {
        payload.isPpv = true;
        payload.ppvPriceNaira = ppvPrice ? Number(ppvPrice) : undefined;
        payload.ppvCurrency = ppvCurrency || "NGN";
      } else {
        payload.isPpv = false;
        payload.ppvPriceNaira = null;
        payload.ppvCurrency = null;
      }
      if (trailerFile) {
        // Uploaded after save via queue.
      }
      if (!shortTrailerFile && shortTrailerUrlText) payload.shortTrailerUrl = shortTrailerUrlText;
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
      const newId = Number((data as any)?.title?.id ?? series?.id);
      if (newId) {
        if (posterFile) startAssetUpload("SERIES", newId, posterFile, "poster", "posterUrl");
        if (thumbFile) startAssetUpload("SERIES", newId, thumbFile, "thumbnail", "thumbnailUrl");
        if (shortTrailerFile) startAssetUpload("SERIES", newId, shortTrailerFile, "trailer", "shortTrailerUrl");
        if (trailerFile) startAssetUpload("SERIES", newId, trailerFile, "trailer", "trailerUrl");
      }
      // No rendition uploads for series here; only artwork + trailer.
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SeriesFormSection title="Basics">
        <div>
          <CsSlug className="mb-1">Title</CsSlug>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={fieldStyle}
            placeholder="Enter series title"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <CsSlug className="mb-1">Year started</CsSlug>
            <input
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              style={fieldStyle}
              placeholder="e.g. 2020"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <CsSlug className="mb-1">Intro start (s)</CsSlug>
              <input
                type="number"
                min={0}
                value={introStart}
                onChange={(e) => setIntroStart(e.target.value === "" ? "" : Number(e.target.value))}
                style={fieldStyle}
                placeholder="e.g. 12"
              />
            </div>
            <div>
              <CsSlug className="mb-1">Intro end (s)</CsSlug>
              <input
                type="number"
                min={0}
                value={introEnd}
                onChange={(e) => setIntroEnd(e.target.value === "" ? "" : Number(e.target.value))}
                style={fieldStyle}
                placeholder="e.g. 58"
              />
            </div>
          </div>
        </div>
        <div>
          <CsSlug className="mb-1">Description</CsSlug>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...fieldStyle, resize: "vertical" }}
            rows={4}
            placeholder="Enter series description"
          />
        </div>
      </SeriesFormSection>

      <SeriesFormSection title="Classification">
        <div>
          <CsSlug className="mb-1">Genres</CsSlug>
          <div className="mt-1 flex flex-wrap gap-2">
            {GENRE_OPTIONS.map((g) => {
              const active = genres.includes(g);
              return (
                <button
                  type="button"
                  key={g}
                  onClick={() =>
                    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
                  }
                  className="cs-mono text-xs font-bold uppercase"
                  style={{
                    padding: "5px 12px",
                    border: "1.5px solid var(--cs-ink)",
                    background: active ? "var(--cs-ink)" : "var(--cs-paper)",
                    color: active ? "#fff" : "var(--cs-ink)",
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div>
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
      </SeriesFormSection>

      <SeriesFormSection title="Artwork and media">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileDrop
            id="series-poster-upload"
            label="Poster (2:3)"
            accept="image/*"
            file={posterFile}
            currentUrl={series?.posterUrl}
            onSelect={setPosterFile}
          />
          <FileDrop
            id="series-thumb-upload"
            label="Thumbnail (16:9)"
            accept="image/*"
            file={thumbFile}
            currentUrl={series?.thumbnailUrl}
            onSelect={setThumbFile}
          />
        </div>
        <FileDrop
          id="series-trailer-upload"
          label="Trailer"
          accept="video/*"
          file={trailerFile}
          currentUrl={series?.trailerUrl}
          onSelect={setTrailerFile}
        />
        <div>
          <FileDrop
            id="series-short-trailer-upload"
            label="Short trailer (hero background)"
            accept="video/*"
            file={shortTrailerFile}
            currentUrl={shortTrailerUrlText || (series as any)?.shortTrailerUrl}
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
      </SeriesFormSection>
      <SeriesFormSection title="Monetization (PPV)">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={ppvEnabled}
            onChange={(e) => setPpvEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <CsSlug>Enable PPV (Buy, 30-day access)</CsSlug>
        </div>
        {ppvEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CsSlug className="mb-1">PPV Price</CsSlug>
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
        )}
      </SeriesFormSection>

      {error && (
        <p className="cs-mono text-xs" style={{ color: "var(--cs-rust)" }}>
          {error}
        </p>
      )}
      <div
        className="sticky bottom-0 flex justify-end gap-3 py-3 -mx-1 px-1"
        style={{ borderTop: "2.5px solid var(--cs-ink)", background: "var(--cs-paper)" }}
      >
        <CsButton variant="outline" onClick={onClose}>
          Cancel
        </CsButton>
        <CsButton variant="rust" disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save Series"}
        </CsButton>
      </div>
    </div>
  );
}
