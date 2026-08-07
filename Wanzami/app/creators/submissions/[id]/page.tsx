'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Film,
  ImagePlus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import {
  deleteSubmissionDocument,
  fetchSubmission,
  submitDraft,
  updateDraft,
  uploadMasterFile,
  uploadSubmissionDocument,
  uploadSubmissionPoster,
  uploadTrailerFile,
  type CreatorSubmission,
} from "@/lib/creatorClient";
import { Badge, Card, Field, INK, MUTED, PANEL, PAPER, RUST, Skeleton, Slug, StepIndicator, inputStyle } from "../../_components/kit";

const STEPS = ["Details", "Assets", "Rights", "Review"];

const GENRES = [
  "Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi",
  "Thriller", "Documentary", "Animation", "Fantasy", "Mystery", "Adventure",
];

const MATURITY_RATINGS = ["G", "PG", "PG-13", "R", "18+"];

const DOCUMENT_KINDS = [
  { value: "copyright_certificate", label: "NCC copyright certificate" },
  { value: "assignment_agreement", label: "Assignment / distribution agreement" },
  { value: "id", label: "Government-issued ID" },
  { value: "other", label: "Other" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Step 1: Details
// ---------------------------------------------------------------------------

function DetailsStep({
  submission,
  onContinue,
}: {
  submission: CreatorSubmission;
  onContinue: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [title, setTitle] = useState(submission.title);
  const [synopsis, setSynopsis] = useState(submission.synopsis ?? "");
  const [genres, setGenres] = useState<string[]>(submission.genres);
  const [cast, setCast] = useState(submission.cast.join(", "));
  const [crew, setCrew] = useState(submission.crew.join(", "));
  const [language, setLanguage] = useState(submission.language ?? "English");
  const [maturityRating, setMaturityRating] = useState(submission.maturityRating ?? "");
  const [runtimeMinutes, setRuntimeMinutes] = useState(submission.runtimeMinutes?.toString() ?? "");
  const [releaseDate, setReleaseDate] = useState(submission.releaseDate?.slice(0, 10) ?? "");
  const [price, setPrice] = useState(submission.suggestedPpvPriceNaira?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGenre = (g: string) => {
    setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const submit = async () => {
    setError(null);
    if (!title.trim()) return setError("Give the film a title.");
    if (!synopsis.trim()) return setError("A synopsis is required before you can submit later.");
    setSaving(true);
    try {
      await onContinue({
        title: title.trim(),
        synopsis: synopsis.trim(),
        genres,
        cast: cast.split(",").map((s) => s.trim()).filter(Boolean),
        crew: crew.split(",").map((s) => s.trim()).filter(Boolean),
        language: language.trim() || undefined,
        maturityRating: maturityRating || undefined,
        runtimeMinutes: runtimeMinutes ? Number(runtimeMinutes) : undefined,
        releaseDate: releaseDate || undefined,
        suggestedPpvPriceNaira: price ? Number(price) : undefined,
      });
    } catch (err: any) {
      setError(err?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Field label="Title" required>
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </Field>
      <Field label="Synopsis" required>
        <textarea style={{ ...inputStyle, resize: "vertical" }} rows={4} value={synopsis} onChange={(e) => setSynopsis(e.target.value)} maxLength={2000} />
      </Field>

      <div>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: MUTED }}>Genres</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {GENRES.map((g) => {
            const active = genres.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleGenre(g)}
                className="px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide"
                style={{
                  border: `1.5px solid ${active ? RUST : INK}`,
                  backgroundColor: active ? RUST : "transparent",
                  color: active ? PAPER : INK,
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Cast" hint="Comma-separated">
          <input style={inputStyle} value={cast} onChange={(e) => setCast(e.target.value)} placeholder="Actor One, Actor Two" />
        </Field>
        <Field label="Crew" hint="Comma-separated">
          <input style={inputStyle} value={crew} onChange={(e) => setCrew(e.target.value)} placeholder="Director, Producer" />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Language">
          <input style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value)} />
        </Field>
        <Field label="Maturity rating">
          <select style={inputStyle} value={maturityRating} onChange={(e) => setMaturityRating(e.target.value)}>
            <option value="">Select…</option>
            {MATURITY_RATINGS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Runtime (minutes)">
          <input type="number" style={inputStyle} value={runtimeMinutes} onChange={(e) => setRuntimeMinutes(e.target.value)} min={1} max={1000} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Suggested release date">
          <input type="date" style={inputStyle} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
        </Field>
        <Field label="Suggested PPV price (₦)">
          <input type="number" style={inputStyle} value={price} onChange={(e) => setPrice(e.target.value)} min={0} />
        </Field>
      </div>

      {error && <p className="text-sm font-medium" style={{ color: RUST }}>{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          style={{ backgroundColor: INK, color: PAPER }}
        >
          {saving ? "Saving…" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Assets (poster, trailer, master file)
// ---------------------------------------------------------------------------

function AssetUploadRow({
  label,
  required,
  done,
  uploading,
  progress,
  onFile,
  accept,
}: {
  label: string;
  required?: boolean;
  done: boolean;
  uploading: boolean;
  progress: number | null;
  onFile: (file: File) => void;
  accept: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="border-[2px] p-4" style={{ borderColor: INK, backgroundColor: PAPER }}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em]">
          {label}
          {required && <span style={{ color: RUST }}> *</span>}
        </span>
        {done && <Badge tone="good">Uploaded</Badge>}
      </div>
      {uploading ? (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden border-[1.5px]" style={{ borderColor: INK, backgroundColor: PANEL }}>
            <motion.div className="h-full" style={{ backgroundColor: RUST }} animate={{ width: `${progress}%` }} transition={{ ease: "easeOut", duration: 0.2 }} />
          </div>
          <p className="mt-1 font-mono text-[11px]" style={{ color: MUTED }}>{progress}%</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide"
          style={{ border: `1.5px solid ${INK}`, color: INK }}
        >
          <UploadCloud className="h-3.5 w-3.5" />
          {done ? "Replace file" : "Choose file"}
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function AssetsStep({ submission, onRefresh, onContinue }: { submission: CreatorSubmission; onRefresh: () => Promise<void>; onContinue: () => void }) {
  const [posterUploading, setPosterUploading] = useState(false);
  const [masterProgress, setMasterProgress] = useState<number | null>(null);
  const [trailerProgress, setTrailerProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadPoster = async (file: File) => {
    setPosterUploading(true);
    setError(null);
    try {
      await uploadSubmissionPoster(submission.id, file);
      await onRefresh();
      toast.success("Poster uploaded");
    } catch (err: any) {
      setError(err?.message ?? "Poster upload failed");
    } finally {
      setPosterUploading(false);
    }
  };

  const uploadMaster = async (file: File) => {
    setMasterProgress(0);
    setError(null);
    try {
      await uploadMasterFile(submission.id, file, setMasterProgress);
      await onRefresh();
      toast.success("Film file uploaded");
    } catch (err: any) {
      setError(err?.message ?? "Upload failed. If this keeps happening, the media storage may not be configured for uploads yet, contact support.");
    } finally {
      setMasterProgress(null);
    }
  };

  const uploadTrailer = async (file: File) => {
    setTrailerProgress(0);
    setError(null);
    try {
      await uploadTrailerFile(submission.id, file, setTrailerProgress);
      await onRefresh();
      toast.success("Trailer uploaded");
    } catch (err: any) {
      setError(err?.message ?? "Upload failed");
    } finally {
      setTrailerProgress(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="border-[2px] p-4" style={{ borderColor: INK, backgroundColor: PAPER }}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em]">Poster</span>
          {submission.posterUrl && <Badge tone="good">Uploaded</Badge>}
        </div>
        <div className="mt-3 flex items-center gap-4">
          {submission.posterUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={submission.posterUrl} alt="" className="h-24 w-16 object-cover border-2" style={{ borderColor: INK }} />
          ) : (
            <div className="flex h-24 w-16 items-center justify-center border-2 border-dashed" style={{ borderColor: MUTED }}>
              <ImagePlus className="h-5 w-5" style={{ color: MUTED }} />
            </div>
          )}
          <label
            className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide"
            style={{ border: `1.5px solid ${INK}`, color: INK, opacity: posterUploading ? 0.5 : 1 }}
          >
            {posterUploading ? "Uploading…" : submission.posterUrl ? "Replace" : "Choose image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={posterUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPoster(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <AssetUploadRow
        label="Film master file"
        required
        done={submission.hasMasterFile}
        uploading={masterProgress !== null}
        progress={masterProgress}
        accept="video/*"
        onFile={(f) => void uploadMaster(f)}
      />

      <AssetUploadRow
        label="Trailer (optional)"
        done={submission.hasTrailer}
        uploading={trailerProgress !== null}
        progress={trailerProgress}
        accept="video/*"
        onFile={(f) => void uploadTrailer(f)}
      />

      {error && <p className="text-sm font-medium" style={{ color: RUST }}>{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: INK, color: PAPER }}
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Rights
// ---------------------------------------------------------------------------

function RightsStep({
  submission,
  onRefresh,
  onContinue,
}: {
  submission: CreatorSubmission;
  onRefresh: () => Promise<void>;
  onContinue: (patch: Record<string, unknown>) => Promise<void>;
}) {
  const [kind, setKind] = useState(DOCUMENT_KINDS[0].value);
  const [uploading, setUploading] = useState(false);
  const [declared, setDeclared] = useState(submission.rightsDeclared);
  const [name, setName] = useState(submission.rightsDeclaredName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadDoc = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      await uploadSubmissionDocument(submission.id, file, kind);
      await onRefresh();
      toast.success("Document uploaded");
    } catch (err: any) {
      setError(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = async (docId: string) => {
    await deleteSubmissionDocument(submission.id, docId);
    await onRefresh();
  };

  const submit = async () => {
    setError(null);
    if (!declared) return setError("You need to confirm the rights declaration.");
    if (!name.trim()) return setError("Type your full legal name to sign the declaration.");
    setSaving(true);
    try {
      await onContinue({ rightsDeclared: true, rightsDeclaredName: name.trim() });
    } catch (err: any) {
      setError(err?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm leading-relaxed" style={{ color: "#3c342a" }}>
        Attach proof you own or hold distribution rights to this film, an NCC copyright certificate, an
        assignment or distribution agreement, or similar paperwork. This protects you if the rights are ever
        disputed.
      </p>

      <div className="border-[2px] p-4" style={{ borderColor: INK, backgroundColor: PAPER }}>
        <Slug>Documents</Slug>
        <div className="mt-3 space-y-2">
          {(submission.documents ?? []).length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>Nothing uploaded yet.</p>
          ) : (
            submission.documents!.map((d) => (
              <div key={d.id} className="flex items-center justify-between border-[1.5px] px-3 py-2" style={{ borderColor: "#d8cbac" }}>
                <div>
                  <p className="font-mono text-sm font-bold">{d.fileName}</p>
                  <p className="font-mono text-[10px]" style={{ color: MUTED }}>
                    {DOCUMENT_KINDS.find((k) => k.value === d.kind)?.label ?? d.kind}
                  </p>
                </div>
                <button onClick={() => void removeDoc(d.id)} className="p-1.5" aria-label="Remove document">
                  <Trash2 className="h-4 w-4" style={{ color: RUST }} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <select style={{ ...inputStyle, width: "auto" }} value={kind} onChange={(e) => setKind(e.target.value)}>
            {DOCUMENT_KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide disabled:opacity-50"
            style={{ border: `1.5px solid ${INK}`, color: INK }}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload document"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadDoc(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="border-[2px] p-4" style={{ borderColor: INK, backgroundColor: PAPER }}>
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-1 h-4 w-4" />
          <span className="text-sm leading-relaxed">
            I declare that I own this film or hold the rights to distribute it, and that the documents above
            support this claim. I understand a false declaration can result in the submission being removed.
          </span>
        </label>
        <div className="mt-3">
          <Field label="Type your full legal name to sign" required>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </Field>
        </div>
      </div>

      {error && <p className="text-sm font-medium" style={{ color: RUST }}>{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5 disabled:opacity-50"
          style={{ backgroundColor: INK, color: PAPER }}
        >
          {saving ? "Saving…" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Review
// ---------------------------------------------------------------------------

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2" style={{ borderBottom: "1px solid #d8cbac" }}>
      <span className="font-mono text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function ReviewStep({ submission, onSubmitted }: { submission: CreatorSubmission; onSubmitted: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitDraft(submission.id);
      toast.success("Submitted for review");
      onSubmitted();
      router.replace("/creators/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  const readiness = [
    { label: "Synopsis", ok: !!submission.synopsis },
    { label: "Master film file", ok: submission.hasMasterFile },
    { label: "Rights declaration", ok: submission.rightsDeclared },
    { label: "At least one document", ok: (submission.documents?.length ?? 0) > 0 },
  ];
  const ready = readiness.every((r) => r.ok);

  return (
    <div className="space-y-5">
      <Card>
        <Slug>Summary</Slug>
        <div className="mt-3">
          <SummaryRow label="Title" value={submission.title} />
          <SummaryRow label="Genres" value={submission.genres.join(", ") || "—"} />
          <SummaryRow label="Runtime" value={submission.runtimeMinutes ? `${submission.runtimeMinutes} min` : "—"} />
          <SummaryRow label="Language" value={submission.language || "—"} />
          <SummaryRow label="Rating" value={submission.maturityRating || "—"} />
          <SummaryRow label="Suggested price" value={submission.suggestedPpvPriceNaira ? `₦${submission.suggestedPpvPriceNaira.toLocaleString()}` : "—"} />
          <SummaryRow label="Poster" value={submission.posterUrl ? "Uploaded" : "None"} />
          <SummaryRow label="Trailer" value={submission.hasTrailer ? "Uploaded" : "None"} />
          <SummaryRow label="Documents" value={`${submission.documents?.length ?? 0} attached`} />
        </div>
      </Card>

      <Card>
        <Slug>Ready to submit</Slug>
        <div className="mt-3 space-y-2">
          {readiness.map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: r.ok ? RUST : "transparent", border: `1.5px solid ${r.ok ? RUST : MUTED}` }}
              >
                {r.ok && <Check className="h-3 w-3" style={{ color: PAPER }} />}
              </div>
              <span className="text-sm" style={{ color: r.ok ? INK : MUTED }}>{r.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {error && <p className="text-sm font-medium" style={{ color: RUST }}>{error}</p>}

      <div className="flex justify-end">
        <button
          onClick={submit}
          disabled={!ready || submitting}
          className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-bold shadow-[5px_5px_0_#161310] transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          style={{ backgroundColor: RUST, color: PAPER }}
        >
          {submitting ? "Submitting…" : "Submit for review"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SubmissionWizardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [submission, setSubmission] = useState<CreatorSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await fetchSubmission(id);
      setSubmission(s);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveDetails = async (patch: Record<string, unknown>) => {
    const updated = await updateDraft(id, patch);
    setSubmission(updated);
    setStep(1);
  };

  const saveRights = async (patch: Record<string, unknown>) => {
    const updated = await updateDraft(id, patch);
    setSubmission(updated);
    setStep(3);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: PAPER }} className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 space-y-6">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (notFound || !submission) {
    return (
      <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: RUST }}>Submission not found.</p>
          <Link href="/creators/dashboard" className="mt-4 inline-block font-mono text-xs uppercase underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (submission.status !== "DRAFT") {
    return (
      <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 text-center">
          <Film className="mx-auto h-10 w-10" style={{ color: MUTED }} />
          <h1 className="font-heading mt-4 text-3xl uppercase tracking-wide">{submission.title}</h1>
          <div className="mt-3 flex justify-center">
            <Badge tone={submission.status === "APPROVED" ? "good" : submission.status === "REJECTED" ? "bad" : "pending"}>
              {submission.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="mt-4 text-sm" style={{ color: MUTED }}>
            This was already submitted, so it can't be edited anymore.
          </p>
          <Link href="/creators/dashboard" className="mt-6 inline-block font-mono text-xs uppercase underline">
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: PAPER, color: INK }} className="min-h-screen">
      <header className="sticky top-0 z-50 border-b-[3px]" style={{ backgroundColor: PAPER, borderColor: INK }}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/creators/dashboard" className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Save & exit
          </Link>
          <span className="font-mono text-[11px] uppercase tracking-widest" style={{ color: MUTED }}>Draft</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <Slug>New submission</Slug>
        <h1 className="font-heading mt-1 mb-8 text-4xl uppercase tracking-wide">{submission.title}</h1>

        <div className="mb-8">
          <StepIndicator steps={STEPS} current={step} onStepClick={setStep} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && <DetailsStep submission={submission} onContinue={saveDetails} />}
            {step === 1 && <AssetsStep submission={submission} onRefresh={load} onContinue={() => setStep(2)} />}
            {step === 2 && <RightsStep submission={submission} onRefresh={load} onContinue={saveRights} />}
            {step === 3 && <ReviewStep submission={submission} onSubmitted={() => router.replace("/creators/dashboard")} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
