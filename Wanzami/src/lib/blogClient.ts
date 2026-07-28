import { resolveCdnImageUrl } from "./contentClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ??
  process.env.AUTH_SERVICE_URL ??
  "https://api.wanzami.tv/api";

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  postCount?: number;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content?: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  category?: { id: string; name: string; slug: string; color?: string | null } | null;
  tags: string[];
  author: { id: string | null; name?: string | null; avatarUrl?: string | null };
  publishedAt?: string | null;
  isFeatured: boolean;
  readTimeMinutes: number;
  views: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
};

const withCdn = (post: BlogPost): BlogPost => ({
  ...post,
  coverImageUrl: post.coverImageUrl ? resolveCdnImageUrl(post.coverImageUrl) : post.coverImageUrl,
  ogImageUrl: post.ogImageUrl ? resolveCdnImageUrl(post.ogImageUrl) : post.ogImageUrl,
});

const get = async <T,>(path: string, revalidate = 60): Promise<T | null> => {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // The blog is never critical enough to crash a page over.
    return null;
  }
};

export async function fetchPosts(params?: {
  category?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<{ posts: BlogPost[]; featured: BlogPost | null; total: number }> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.tag) qs.set("tag", params.tag);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  const data = await get<{ posts: BlogPost[]; featured: BlogPost | null; total: number }>(
    `/blog/posts${suffix}`
  );
  if (!data) return { posts: [], featured: null, total: 0 };
  return {
    posts: (data.posts ?? []).map(withCdn),
    featured: data.featured ? withCdn(data.featured) : null,
    total: data.total ?? 0,
  };
}

export async function fetchPost(
  slug: string
): Promise<{ post: BlogPost; related: BlogPost[] } | null> {
  const data = await get<{ post: BlogPost; related: BlogPost[] }>(`/blog/posts/${encodeURIComponent(slug)}`);
  if (!data?.post) return null;
  return { post: withCdn(data.post), related: (data.related ?? []).map(withCdn) };
}

export async function searchPosts(query: string): Promise<BlogPost[]> {
  if (!query.trim()) return [];
  const data = await get<{ posts: BlogPost[] }>(
    `/blog/search?q=${encodeURIComponent(query.trim())}`,
    0
  );
  return (data?.posts ?? []).map(withCdn);
}

export async function fetchCategories(): Promise<BlogCategory[]> {
  const data = await get<{ categories: BlogCategory[] }>(`/blog/categories`);
  return data?.categories ?? [];
}

/** Fire-and-forget view ping from the client. */
export function recordPostView(slug: string) {
  if (typeof window === "undefined") return;
  void fetch(`${API_BASE}/blog/posts/${encodeURIComponent(slug)}/view`, {
    method: "POST",
    keepalive: true,
  }).catch(() => undefined);
}

export const formatPostDate = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
