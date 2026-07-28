import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Check,
  Eye,
  ImagePlus,
  Loader2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { CsBox, CsButton, CsSlug, CsTag } from "../cs/kit";
import { RichTextEditor } from "./RichTextEditor";
import {
  createPost,
  updatePost,
  uploadCoverImage,
  type BlogCategory,
  type BlogPost,
  type BlogPostInput,
  type BlogStatus,
} from "@/lib/blogClient";

const field: React.CSSProperties = {
  border: "2px solid var(--cs-ink)",
  background: "var(--cs-paper)",
  color: "var(--cs-ink)",
  fontFamily: "var(--font-smono), monospace",
  fontSize: 12,
  padding: "9px 12px",
  width: "100%",
};

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="mb-1.5">
    <CsSlug>{children}</CsSlug>
  </div>
);

/** Sidebar section wrapper so every panel gets the same rhythm. */
const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <CsBox className="p-4">
    <CsSlug>{title}</CsSlug>
    <div className="mt-3">{children}</div>
  </CsBox>
);

const statusTone = (s: BlogStatus) =>
  s === "PUBLISHED" ? "good" : s === "SCHEDULED" ? "pending" : s === "ARCHIVED" ? "bad" : "neutral";

/** datetime-local needs `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type Props = {
  post: BlogPost | null;
  categories: BlogCategory[];
  onClose: () => void;
  onSaved: (post: BlogPost) => void;
  onDelete?: (post: BlogPost) => void;
  onManageCategories: () => void;
};

export function PostEditor({ post, categories, onClose, onSaved, onDelete, onManageCategories }: Props) {
  const [id, setId] = useState<string | null>(post?.id ?? null);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [subtitle, setSubtitle] = useState(post?.subtitle ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(post?.coverImageAlt ?? "");
  const [categoryId, setCategoryId] = useState(post?.category?.id ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [status, setStatus] = useState<BlogStatus>(post?.status ?? "DRAFT");
  const [scheduledFor, setScheduledFor] = useState(toLocalInput(post?.scheduledFor));
  const [isFeatured, setIsFeatured] = useState(post?.isFeatured ?? false);
  const [seoTitle, setSeoTitle] = useState(post?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post?.seoDescription ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const inlineImageResolver = useRef<((url: string | null) => void) | null>(null);
  const inlineInputRef = useRef<HTMLInputElement | null>(null);

  const markDirty = () => setDirty(true);

  // Keep the slug tracking the title until the writer edits it by hand.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const buildPayload = useCallback(
    (overrides?: Partial<BlogPostInput>): BlogPostInput => ({
      title: title.trim() || "Untitled post",
      slug: slug || undefined,
      subtitle: subtitle.trim() || null,
      excerpt: excerpt.trim() || null,
      content,
      coverImageUrl: coverImageUrl || null,
      coverImageAlt: coverImageAlt.trim() || null,
      categoryId: categoryId || null,
      tags,
      status,
      scheduledFor: status === "SCHEDULED" && scheduledFor ? new Date(scheduledFor).toISOString() : null,
      isFeatured,
      seoTitle: seoTitle.trim() || null,
      seoDescription: seoDescription.trim() || null,
      ...overrides,
    }),
    [
      title, slug, subtitle, excerpt, content, coverImageUrl, coverImageAlt,
      categoryId, tags, status, scheduledFor, isFeatured, seoTitle, seoDescription,
    ]
  );

  const save = useCallback(
    async (overrides?: Partial<BlogPostInput>, opts?: { silent?: boolean }) => {
      if (!title.trim() && !content.trim()) return null;
      if (!opts?.silent) setSaving(true);
      setError(null);
      try {
        const payload = buildPayload(overrides);
        const saved = id ? await updatePost(id, payload) : await createPost(payload);
        setId(saved.id);
        setSlug(saved.slug);
        setSlugTouched(true);
        setStatus(saved.status);
        setLastSavedAt(new Date());
        setDirty(false);
        onSaved(saved);
        return saved;
      } catch (e: any) {
        setError(e?.message ?? "Could not save the post");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [buildPayload, content, id, onSaved, title]
  );

  // Autosave drafts so a closed tab never costs the writer their work. Only
  // drafts autosave — a live post should never change under readers by accident.
  useEffect(() => {
    if (!dirty || status !== "DRAFT") return;
    if (!title.trim() && !content.trim()) return;
    const t = setTimeout(() => void save(undefined, { silent: true }), 2500);
    return () => clearTimeout(t);
  }, [dirty, status, title, content, save]);

  // Browser-level guard for the same reason.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleCoverFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCoverImage(file);
      setCoverImageUrl(url);
      markDirty();
    } catch (e: any) {
      setError(e?.message ?? "Cover image upload failed");
    } finally {
      setUploading(false);
    }
  };

  // The editor asks for an image; open the picker and resolve once it uploads.
  const requestInlineImage = useCallback(async () => {
    return new Promise<string | null>((resolve) => {
      inlineImageResolver.current = resolve;
      inlineInputRef.current?.click();
    });
  }, []);

  const handleInlineFile = async (file: File | null) => {
    const resolve = inlineImageResolver.current;
    inlineImageResolver.current = null;
    if (!file || !resolve) {
      resolve?.(null);
      return;
    }
    setUploading(true);
    try {
      const url = await uploadCoverImage(file);
      resolve(url);
    } catch (e: any) {
      setError(e?.message ?? "Image upload failed");
      resolve(null);
    } finally {
      setUploading(false);
    }
  };

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/,$/, "");
    if (!t || tags.includes(t) || tags.length >= 20) return;
    setTags((prev) => [...prev, t]);
    markDirty();
  };

  const wordCount = useMemo(() => {
    const text = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return text ? text.split(" ").length : 0;
  }, [content]);

  const canPublish = title.trim().length > 0 && content.trim().length > 0;

  const publish = async () => {
    if (!canPublish) {
      setError("A post needs a title and some body copy before it can go live.");
      return;
    }
    // save() sets the status from the server's response when it succeeds, and
    // returns null when it fails. Never assume the new status here, or a failed
    // request leaves the CMS showing PUBLISHED while the row is still a draft.
    await save({ status: "PUBLISHED" });
  };

  const schedule = async () => {
    if (!scheduledFor) {
      setError("Pick a date and time to schedule this post.");
      return;
    }
    if (new Date(scheduledFor).getTime() <= Date.now()) {
      setError("Scheduled time must be in the future.");
      return;
    }
    await save({ status: "SCHEDULED", scheduledFor: new Date(scheduledFor).toISOString() });
  };

  return (
    <div>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleCoverFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={inlineInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleInlineFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {/* Sticky action bar */}
      <div
        className="flex flex-wrap items-center gap-3 p-3 mb-5"
        style={{ border: "2.5px solid var(--cs-ink)", background: "var(--cs-panel)" }}
      >
        <button
          type="button"
          onClick={() => {
            if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
            onClose();
          }}
          className="flex items-center gap-2 cs-mono font-bold uppercase"
          style={{ fontSize: 11, color: "var(--cs-ink)" }}
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </button>

        <CsTag label={status} tone={statusTone(status)} />
        {isFeatured ? <CsTag label="Featured" tone="good" /> : null}

        <span className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
          {saving
            ? "Saving…"
            : dirty
            ? "Unsaved changes"
            : lastSavedAt
            ? `Saved ${lastSavedAt.toLocaleTimeString()}`
            : id
            ? "Saved"
            : "Not saved yet"}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          <CsButton variant="outline" onClick={() => setShowPreview(true)}>
            <span className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" /> Preview
            </span>
          </CsButton>
          <CsButton variant="outline" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </CsButton>
          {status === "PUBLISHED" ? (
            <CsButton variant="outline" onClick={() => void save({ status: "DRAFT" })} disabled={saving}>
              Unpublish
            </CsButton>
          ) : (
            <CsButton variant="rust" onClick={() => void publish()} disabled={saving || !canPublish}>
              Publish now
            </CsButton>
          )}
        </div>
      </div>

      {error ? (
        <div
          className="flex items-center gap-2 p-3 mb-5 cs-mono"
          style={{ border: "2px solid var(--cs-rust)", color: "var(--cs-rust)", fontSize: 11 }}
        >
          <X className="h-4 w-4" /> {error}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-5">
        {/* Main column */}
        <div className="col-span-2">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            placeholder="Post title"
            className="cs-display w-full mb-3"
            style={{
              border: "none",
              borderBottom: "2.5px solid var(--cs-ink)",
              background: "transparent",
              color: "var(--cs-ink)",
              fontSize: 40,
              padding: "6px 0",
              outline: "none",
            }}
          />
          <input
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value);
              markDirty();
            }}
            placeholder="Standfirst / subtitle (optional)"
            className="w-full mb-5"
            style={{
              border: "none",
              background: "transparent",
              color: "var(--cs-muted)",
              fontSize: 16,
              padding: "2px 0",
              outline: "none",
            }}
          />

          <RichTextEditor
            value={content}
            onChange={(html) => {
              setContent(html);
              markDirty();
            }}
            onRequestImage={requestInlineImage}
            placeholder="Start writing. Select text to format it, or use the toolbar above."
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Panel title="Publish">
            <div className="space-y-3">
              <div>
                <Label>Status</Label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as BlogStatus);
                    markDirty();
                  }}
                  style={field}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {status === "SCHEDULED" ? (
                <div>
                  <Label>Goes live at</Label>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => {
                      setScheduledFor(e.target.value);
                      markDirty();
                    }}
                    style={field}
                  />
                  <CsButton variant="ink" className="w-full mt-2" onClick={() => void schedule()} disabled={saving}>
                    <span className="flex items-center justify-center gap-2">
                      <Calendar className="h-3.5 w-3.5" /> Schedule
                    </span>
                  </CsButton>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setIsFeatured((v) => !v);
                  markDirty();
                }}
                className="flex items-center gap-2 w-full p-2 cs-mono font-bold uppercase"
                style={{
                  border: "2px solid var(--cs-ink)",
                  background: isFeatured ? "var(--cs-brand)" : "var(--cs-paper)",
                  color: "var(--cs-ink)",
                  fontSize: 11,
                }}
              >
                <Star className="h-3.5 w-3.5" />
                {isFeatured ? "Featured post" : "Make featured"}
              </button>

              <p className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
                {wordCount} words &middot; {Math.max(1, Math.round(wordCount / 225))} min read
              </p>
            </div>
          </Panel>

          <Panel title="Cover image">
            {coverImageUrl ? (
              <div className="mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverImageUrl}
                  alt={coverImageAlt || "Cover"}
                  className="w-full object-cover"
                  style={{ border: "2px solid var(--cs-ink)", height: 130 }}
                />
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <CsButton variant="outline" onClick={() => coverInputRef.current?.click()} disabled={uploading}>
                <span className="flex items-center gap-2">
                  {uploading ? <Loader2 className="h-3.5 w-3.5" /> : <ImagePlus className="h-3.5 w-3.5" />}
                  {coverImageUrl ? "Replace" : "Upload"}
                </span>
              </CsButton>
              {coverImageUrl ? (
                <CsButton
                  variant="outline"
                  onClick={() => {
                    setCoverImageUrl("");
                    markDirty();
                  }}
                >
                  Remove
                </CsButton>
              ) : null}
            </div>
            {coverImageUrl ? (
              <div className="mt-3">
                <Label>Alt text (accessibility)</Label>
                <input
                  value={coverImageAlt}
                  onChange={(e) => {
                    setCoverImageAlt(e.target.value);
                    markDirty();
                  }}
                  placeholder="Describe the image"
                  style={field}
                />
              </div>
            ) : null}
          </Panel>

          <Panel title="Organise">
            <div className="space-y-3">
              <div>
                <Label>Category</Label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    markDirty();
                  }}
                  style={field}
                >
                  <option value="">Uncategorised</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onManageCategories}
                  className="cs-mono mt-1.5"
                  style={{ fontSize: 10, color: "var(--cs-rust)", textDecoration: "underline" }}
                >
                  Manage categories
                </button>
              </div>

              <div>
                <Label>Tags</Label>
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag(tagDraft);
                      setTagDraft("");
                    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                      setTags((prev) => prev.slice(0, -1));
                      markDirty();
                    }
                  }}
                  onBlur={() => {
                    if (tagDraft.trim()) {
                      addTag(tagDraft);
                      setTagDraft("");
                    }
                  }}
                  placeholder="Type a tag, press Enter"
                  style={field}
                />
                {tags.length ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTags((prev) => prev.filter((x) => x !== t));
                          markDirty();
                        }}
                        className="flex items-center gap-1 cs-mono font-bold uppercase"
                        style={{
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          padding: "3px 7px",
                          border: "1.5px solid var(--cs-ink)",
                          color: "var(--cs-ink)",
                        }}
                        title={`Remove ${t}`}
                      >
                        {t} <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <Label>Excerpt</Label>
                <textarea
                  value={excerpt}
                  onChange={(e) => {
                    setExcerpt(e.target.value);
                    markDirty();
                  }}
                  rows={3}
                  placeholder="Leave blank to auto-generate from the body"
                  style={{ ...field, resize: "vertical" }}
                />
              </div>
            </div>
          </Panel>

          <Panel title="Search & sharing">
            <div className="space-y-3">
              <div>
                <Label>SEO title</Label>
                <input
                  value={seoTitle}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    markDirty();
                  }}
                  placeholder={title || "Defaults to the post title"}
                  style={field}
                />
                <p className="cs-mono mt-1" style={{ fontSize: 9, color: "var(--cs-muted)" }}>
                  {(seoTitle || title).length}/60 characters
                </p>
              </div>
              <div>
                <Label>Meta description</Label>
                <textarea
                  value={seoDescription}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    markDirty();
                  }}
                  rows={3}
                  placeholder="Defaults to the excerpt"
                  style={{ ...field, resize: "vertical" }}
                />
                <p className="cs-mono mt-1" style={{ fontSize: 9, color: "var(--cs-muted)" }}>
                  {(seoDescription || excerpt).length}/160 characters
                </p>
              </div>
              <div>
                <Label>URL slug</Label>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                    markDirty();
                  }}
                  style={field}
                />
                <p className="cs-mono mt-1 truncate" style={{ fontSize: 9, color: "var(--cs-muted)" }}>
                  wanzami.tv/blog/post/{slug || "…"}
                </p>
              </div>
            </div>
          </Panel>

          {id && onDelete && post ? (
            <CsBox className="p-4">
              <CsSlug>Danger zone</CsSlug>
              <CsButton
                variant="outline"
                className="w-full mt-3"
                onClick={() => {
                  if (window.confirm(`Delete "${title}"? This cannot be undone.`)) onDelete(post);
                }}
              >
                <span className="flex items-center justify-center gap-2" style={{ color: "var(--cs-rust)" }}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete post
                </span>
              </CsButton>
            </CsBox>
          ) : null}
        </div>
      </div>

      {showPreview ? (
        <PreviewOverlay
          title={title}
          subtitle={subtitle}
          coverImageUrl={coverImageUrl}
          coverImageAlt={coverImageAlt}
          category={categories.find((c) => c.id === categoryId)?.name}
          content={content}
          wordCount={wordCount}
          onClose={() => setShowPreview(false)}
        />
      ) : null}
    </div>
  );
}

function PreviewOverlay({
  title,
  subtitle,
  coverImageUrl,
  coverImageAlt,
  category,
  content,
  wordCount,
  onClose,
}: {
  title: string;
  subtitle: string;
  coverImageUrl: string;
  coverImageAlt: string;
  category?: string;
  content: string;
  wordCount: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: "rgba(22,19,16,0.75)" }}
      onClick={onClose}
    >
      <div className="p-5">
        <div
          className="mx-auto max-w-3xl"
          style={{ background: "#f2ead9", border: "3px solid var(--cs-ink)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between p-3"
            style={{ borderBottom: "2px solid var(--cs-ink)", background: "var(--cs-panel)" }}
          >
            <CsSlug>Reader preview</CsSlug>
            <button type="button" onClick={onClose} aria-label="Close preview">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-5">
            {category ? <CsTag label={category} tone="good" /> : null}
            <h1 className="cs-display mt-3" style={{ fontSize: 44, color: "var(--cs-ink)" }}>
              {title || "Untitled post"}
            </h1>
            {subtitle ? (
              <p className="mt-2" style={{ fontSize: 17, color: "var(--cs-muted)" }}>
                {subtitle}
              </p>
            ) : null}
            <p className="cs-mono mt-2" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
              {Math.max(1, Math.round(wordCount / 225))} min read
            </p>
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt={coverImageAlt || ""}
                className="w-full object-cover mt-4"
                style={{ border: "2px solid var(--cs-ink)", maxHeight: 380 }}
              />
            ) : null}
            <div
              className="cs-editor mt-5"
              style={{ color: "var(--cs-ink)", fontSize: 17, lineHeight: 1.75 }}
              dangerouslySetInnerHTML={{ __html: content || "<p>Nothing written yet.</p>" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
