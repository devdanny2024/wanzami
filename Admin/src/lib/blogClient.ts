import { authFetch } from "./authClient";

export type BlogStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  sortOrder: number;
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
  status: BlogStatus;
  publishedAt?: string | null;
  scheduledFor?: string | null;
  isFeatured: boolean;
  readTimeMinutes: number;
  views: number;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogStats = {
  draft: number;
  scheduled: number;
  published: number;
  archived: number;
  totalViews: number;
};

export type BlogPostInput = {
  title: string;
  slug?: string;
  subtitle?: string | null;
  excerpt?: string | null;
  content?: string;
  coverImageUrl?: string | null;
  coverImageAlt?: string | null;
  categoryId?: string | null;
  tags?: string[];
  status?: BlogStatus;
  publishedAt?: string | null;
  scheduledFor?: string | null;
  isFeatured?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImageUrl?: string | null;
};

const authHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const unwrap = (result: { ok: boolean; status: number; data: any }, fallback: string) => {
  if (!result.ok) {
    throw new Error(result.data?.message || fallback);
  }
  return result.data;
};

export async function listPosts(params?: {
  q?: string;
  status?: BlogStatus | "ALL";
  categoryId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ posts: BlogPost[]; total: number; stats: BlogStats }> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.status && params.status !== "ALL") qs.set("status", params.status);
  if (params?.categoryId) qs.set("categoryId", params.categoryId);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  const res = await authFetch(`/admin/blog/posts${suffix}`, { headers: authHeader() });
  return unwrap(res, "Failed to load posts");
}

export async function getPost(id: string): Promise<BlogPost> {
  const res = await authFetch(`/admin/blog/posts/${id}`, { headers: authHeader() });
  return unwrap(res, "Failed to load post").post;
}

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
  const res = await authFetch(`/admin/blog/posts`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(input),
  });
  return unwrap(res, "Failed to create post").post;
}

export async function updatePost(id: string, input: Partial<BlogPostInput>): Promise<BlogPost> {
  const res = await authFetch(`/admin/blog/posts/${id}`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify(input),
  });
  return unwrap(res, "Failed to save post").post;
}

export async function deletePost(id: string): Promise<void> {
  const res = await authFetch(`/admin/blog/posts/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(res.data?.message || "Failed to delete post");
  }
}

export async function listCategories(): Promise<BlogCategory[]> {
  const res = await authFetch(`/admin/blog/categories`, { headers: authHeader() });
  return unwrap(res, "Failed to load categories").categories;
}

export async function createCategory(input: {
  name: string;
  description?: string | null;
  color?: string | null;
}): Promise<BlogCategory> {
  const res = await authFetch(`/admin/blog/categories`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(input),
  });
  return unwrap(res, "Failed to create category").category;
}

export async function updateCategory(
  id: string,
  input: { name?: string; description?: string | null; color?: string | null }
): Promise<BlogCategory> {
  const res = await authFetch(`/admin/blog/categories/${id}`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify(input),
  });
  return unwrap(res, "Failed to save category").category;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await authFetch(`/admin/blog/categories/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(res.data?.message || "Failed to delete category");
  }
}

/**
 * Uploads a cover image through the API, which writes it to the bucket
 * server-side. Going straight to the bucket from the browser is not an option:
 * it has no CORS policy for the dashboard origin, so the PUT never lands.
 */
export async function uploadCoverImage(file: File): Promise<string> {
  const res = await fetch("/api/admin/assets/upload", {
    method: "POST",
    headers: {
      "Content-Type": file.type || "image/jpeg",
      "x-asset-kind": "blog",
      ...authHeader(),
    },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Image upload failed (${res.status})`);

  if (!data.publicUrl) throw new Error("Upload succeeded but no public URL was returned");
  return data.publicUrl as string;
}
