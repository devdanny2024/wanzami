import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { MovieTitle } from "./MoviesManagement"; // reuse shape
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useUploadQueue } from "@/context/UploadQueueProvider";
import { FormSection } from "./FormSection";
import { FileDrop } from "./FileDrop";
import { FileText, Tag, Image as ImageIcon, Wallet } from "lucide-react";

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
      <FormSection title="Basics" icon={FileText}>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-neutral-300">Intro start (s)</Label>
              <Input
                type="number"
                min={0}
                value={introStart}
                onChange={(e) => setIntroStart(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                placeholder="e.g. 12"
              />
            </div>
            <div>
              <Label className="text-neutral-300">Intro end (s)</Label>
              <Input
                type="number"
                min={0}
                value={introEnd}
                onChange={(e) => setIntroEnd(e.target.value === "" ? "" : Number(e.target.value))}
                className="mt-1 bg-neutral-950 border-neutral-800 text-white"
                placeholder="e.g. 58"
              />
            </div>
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
      </FormSection>

      <FormSection title="Classification" icon={Tag}>
        <div>
          <Label className="text-neutral-300">Genres</Label>
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
                  className={`px-3 py-1 rounded-full text-sm border ${
                    active
                      ? "bg-[#fd7e14]/20 border-[#fd7e14] text-[#fd7e14]"
                      : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-neutral-300">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white w-full min-w-0">
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
          <div>
            <Label className="text-neutral-300">Maturity Rating</Label>
            <Select value={maturityRating} onValueChange={setMaturityRating}>
              <SelectTrigger className="mt-1 bg-neutral-950 border-neutral-800 text-white w-full min-w-0">
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
        <div className="flex items-center gap-2">
          <Label className="text-neutral-300">Wanzami Original</Label>
          <input
            type="checkbox"
            checked={isOriginal}
            onChange={(e) => setIsOriginal(e.target.checked)}
            className="h-4 w-4"
          />
        </div>
      </FormSection>

      <FormSection title="Artwork and media" icon={ImageIcon}>
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
            <Label className="text-neutral-300">Or link</Label>
            <Input
              value={shortTrailerUrlText}
              onChange={(e) => setShortTrailerUrlText(e.target.value)}
              className="mt-1 bg-neutral-950 border-neutral-800 text-white"
              placeholder="https://cdn.../short-trailer.mp4"
            />
          </div>
        </div>
      </FormSection>
      <FormSection title="Monetization (PPV)" icon={Wallet}>
        <div className="flex items-center gap-2">
          <Switch
            checked={ppvEnabled}
            onCheckedChange={setPpvEnabled}
            className="data-[state=checked]:bg-[#fd7e14]"
          />
          <Label className="text-neutral-300">Enable PPV (Buy, 30-day access)</Label>
        </div>
        {ppvEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-neutral-300">PPV Price</Label>
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
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  <SelectItem value="NGN">NGN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </FormSection>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-neutral-800 bg-neutral-950/80 backdrop-blur-sm py-3 -mx-1 px-1">
        <Button variant="outline" onClick={onClose} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">
          Cancel
        </Button>
        <Button disabled={saving} onClick={handleSave} className="bg-[#fd7e14] hover:bg-[#ff9940] text-white">
          {saving ? "Saving..." : "Save Series"}
        </Button>
      </div>
    </div>
  );
}
