import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit, ExternalLink, FolderCog, Plus, Search, Star, Trash2 } from "lucide-react";
import {
  CsButton,
  CsPageHeader,
  CsStat,
  CsTable,
  CsTag,
  type CsColumn,
} from "./cs/kit";
import { PostEditor } from "./blog/PostEditor";
import { CategoryManager } from "./blog/CategoryManager";
import {
  deletePost,
  getPost,
  listCategories,
  listPosts,
  type BlogCategory,
  type BlogPost,
  type BlogStats,
  type BlogStatus,
} from "@/lib/blogClient";

const STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL?.replace(/\/+$/, "") || "https://www.wanzami.tv";

const FILTERS: Array<{ key: BlogStatus | "ALL"; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PUBLISHED", label: "Published" },
  { key: "DRAFT", label: "Drafts" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "ARCHIVED", label: "Archived" },
];

const statusTone = (s: BlogStatus) =>
  s === "PUBLISHED" ? "good" : s === "SCHEDULED" ? "pending" : s === "ARCHIVED" ? "bad" : "neutral";

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
};

export function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<BlogStatus | "ALL">("ALL");

  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPosts({ q: debouncedQuery || undefined, status: filter });
      setPosts(data.posts);
      setStats(data.stats);
    } catch (e: any) {
      setError(e?.message ?? "Could not load posts");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filter]);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await listCategories());
    } catch {
      // A failed category load shouldn't block the post list.
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const openNew = () => {
    setEditing(null);
    setIsEditorOpen(true);
  };

  const openExisting = useCallback(async (row: BlogPost) => {
    try {
      // The list omits body content to stay light, so fetch the full record.
      const full = await getPost(row.id);
      setEditing(full);
      setIsEditorOpen(true);
    } catch (e: any) {
      setError(e?.message ?? "Could not open that post");
    }
  }, []);

  const removePost = useCallback(
    async (row: BlogPost) => {
      try {
        await deletePost(row.id);
        setIsEditorOpen(false);
        setEditing(null);
        await loadPosts();
      } catch (e: any) {
        setError(e?.message ?? "Could not delete that post");
      }
    },
    [loadPosts]
  );

  const columns: CsColumn<BlogPost>[] = useMemo(
    () => [
      {
        key: "cover",
        header: "Cover",
        cell: (post) =>
          post.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverImageUrl}
              alt=""
              className="w-24 h-16 object-cover"
              style={{ border: "1.5px solid var(--cs-ink)" }}
            />
          ) : (
            <div
              className="w-24 h-16 flex items-center justify-center cs-mono"
              style={{ border: "1.5px dashed var(--cs-line)", fontSize: 9, color: "var(--cs-muted)" }}
            >
              NO ART
            </div>
          ),
      },
      {
        key: "title",
        header: "Title",
        cell: (post) => (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {post.isFeatured ? <Star className="w-3.5 h-3.5" style={{ color: "var(--cs-brand)" }} /> : null}
              <span className="cs-mono font-bold uppercase" style={{ fontSize: 12, color: "var(--cs-ink)" }}>
                {post.title}
              </span>
            </div>
            <p className="cs-mono mt-1 truncate" style={{ fontSize: 9, color: "var(--cs-muted)" }}>
              /blog/post/{post.slug} &middot; {post.readTimeMinutes} min read
            </p>
          </div>
        ),
      },
      {
        key: "category",
        header: "Category",
        cell: (post) =>
          post.category ? (
            <CsTag label={post.category.name} tone="good" />
          ) : (
            <span className="cs-mono" style={{ fontSize: 10, color: "var(--cs-muted)" }}>
              —
            </span>
          ),
      },
      {
        key: "status",
        header: "Status",
        cell: (post) => (
          <div>
            <CsTag label={post.status} tone={statusTone(post.status)} />
            <p className="cs-mono mt-1" style={{ fontSize: 9, color: "var(--cs-muted)" }}>
              {post.status === "SCHEDULED"
                ? formatDate(post.scheduledFor)
                : post.status === "PUBLISHED"
                ? formatDate(post.publishedAt)
                : `Edited ${formatDate(post.updatedAt)}`}
            </p>
          </div>
        ),
      },
      {
        key: "views",
        header: "Views",
        align: "right",
        cell: (post) => (
          <span className="cs-mono" style={{ fontSize: 12, color: "var(--cs-ink)" }}>
            {post.views.toLocaleString()}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        align: "right",
        cell: (post) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void openExisting(post)}
              className="p-1.5 transition-colors hover:bg-[var(--cs-panel)]"
              style={{ border: "2px solid var(--cs-ink)", color: "var(--cs-ink)" }}
              aria-label={`Edit ${post.title}`}
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            {post.status === "PUBLISHED" ? (
              <a
                href={`${STOREFRONT}/blog/post/${post.slug}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 transition-colors hover:bg-[var(--cs-panel)]"
                style={{ border: "2px solid var(--cs-ink)", color: "var(--cs-ink)" }}
                aria-label={`View ${post.title} on the site`}
                title="View on site"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Delete "${post.title}"? This cannot be undone.`)) void removePost(post);
              }}
              className="p-1.5 transition-colors hover:bg-[var(--cs-panel)]"
              style={{ border: "2px solid var(--cs-rust)", color: "var(--cs-rust)" }}
              aria-label={`Delete ${post.title}`}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    [openExisting, removePost]
  );

  if (isEditorOpen) {
    return (
      <div className="space-y-8">
        <PostEditor
          post={editing}
          categories={categories}
          onClose={() => {
            setIsEditorOpen(false);
            setEditing(null);
            void loadPosts();
          }}
          onSaved={(saved) => {
            setEditing(saved);
            void loadPosts();
          }}
          onDelete={(p) => void removePost(p)}
          onManageCategories={() => setShowCategories(true)}
        />
        {showCategories ? (
          <CategoryManager
            categories={categories}
            onClose={() => setShowCategories(false)}
            onChanged={() => void loadCategories()}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CsPageHeader
        title="The press room"
        chip={`${stats?.published ?? 0} live`}
        slug="Blog management · articles and announcements"
        actions={
          <>
            <CsButton variant="outline" onClick={() => setShowCategories(true)}>
              <span className="inline-flex items-center gap-2">
                <FolderCog className="w-3.5 h-3.5" />
                Categories
              </span>
            </CsButton>
            <CsButton variant="rust" onClick={openNew}>
              <span className="inline-flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                New post
              </span>
            </CsButton>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <CsStat label="Published" value={String(stats?.published ?? 0)} hint="Live on the site" />
        <CsStat label="Drafts" value={String(stats?.draft ?? 0)} hint="Work in progress" />
        <CsStat label="Scheduled" value={String(stats?.scheduled ?? 0)} hint="Queued to go live" />
        <CsStat label="Total views" value={(stats?.totalViews ?? 0).toLocaleString()} hint="All time" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative" style={{ flex: 1, minWidth: 220 }}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--cs-muted)" }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH POSTS BY TITLE, SLUG OR EXCERPT…"
            style={{
              border: "2px solid var(--cs-ink)",
              background: "var(--cs-paper)",
              color: "var(--cs-ink)",
              fontFamily: "var(--font-smono), monospace",
              fontSize: 12,
              padding: "9px 12px 9px 34px",
              width: "100%",
            }}
          />
        </div>
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className="cs-mono font-bold uppercase"
              style={{
                fontSize: 10,
                letterSpacing: "0.08em",
                padding: "8px 12px",
                border: "1.5px solid var(--cs-ink)",
                background: filter === f.key ? "var(--cs-ink)" : "var(--cs-paper)",
                color: filter === f.key ? "#fff" : "var(--cs-ink)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="cs-mono" style={{ fontSize: 11, color: "var(--cs-rust)" }}>
          {error}
        </p>
      ) : null}

      <CsTable
        columns={columns}
        rows={posts}
        rowKey={(p) => p.id}
        loading={loading}
        emptySlug={debouncedQuery || filter !== "ALL" ? "No matches" : "Nothing filed yet"}
        emptyBody={
          debouncedQuery || filter !== "ALL"
            ? "No posts match this search or filter. Try widening it."
            : "The blog is empty. Hit New post to write the first one."
        }
      />

      {showCategories ? (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCategories(false)}
          onChanged={() => {
            void loadCategories();
            void loadPosts();
          }}
        />
      ) : null}
    </div>
  );
}
