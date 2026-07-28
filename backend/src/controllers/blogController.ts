import type { Response } from "express";
import type { Request } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { auditLog } from "../utils/audit.js";
import { BlogPostStatus, Prisma } from "@prisma/client";

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "post";

/** Appends -2, -3 ... until the slug is free. Ignores the post being edited. */
const uniqueSlug = async (base: string, ignoreId?: bigint) => {
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  // Slug collisions are rare, so a small loop beats a fancier query here.
  for (;;) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || (ignoreId && existing.id === ignoreId)) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
};

const uniqueCategorySlug = async (base: string, ignoreId?: bigint) => {
  const root = slugify(base);
  let candidate = root;
  let n = 1;
  for (;;) {
    const existing = await prisma.blogCategory.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || (ignoreId && existing.id === ignoreId)) return candidate;
    n += 1;
    candidate = `${root}-${n}`;
  }
};

const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

/** ~225 wpm is the usual reading-speed benchmark for web prose. */
const readTimeFor = (html: string) => {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
};

const autoExcerpt = (html: string, limit = 200) => {
  const text = stripHtml(html);
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).replace(/\s+\S*$/, "")}…`;
};

/**
 * The editor posts HTML. Strip the tags that can execute or exfiltrate, and
 * drop inline event handlers / javascript: URLs, before anything is stored.
 */
const sanitizeHtml = (html: string) => {
  if (!html) return "";
  return html
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta|base)\b[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1=$2#$2');
};

type PostWithRelations = Prisma.BlogPostGetPayload<{
  include: { category: true };
}>;

const serializePost = (post: PostWithRelations, opts?: { includeContent?: boolean }) => ({
  id: post.id.toString(),
  title: post.title,
  slug: post.slug,
  subtitle: post.subtitle,
  excerpt: post.excerpt,
  ...(opts?.includeContent === false ? {} : { content: post.content }),
  coverImageUrl: post.coverImageUrl,
  coverImageAlt: post.coverImageAlt,
  category: post.category
    ? {
        id: post.category.id.toString(),
        name: post.category.name,
        slug: post.category.slug,
        color: post.category.color,
      }
    : null,
  tags: post.tags,
  author: {
    id: post.authorId ? post.authorId.toString() : null,
    name: post.authorName,
    avatarUrl: post.authorAvatarUrl,
  },
  status: post.status,
  publishedAt: post.publishedAt,
  scheduledFor: post.scheduledFor,
  isFeatured: post.isFeatured,
  readTimeMinutes: post.readTimeMinutes,
  views: post.views,
  seoTitle: post.seoTitle,
  seoDescription: post.seoDescription,
  ogImageUrl: post.ogImageUrl,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
});

const serializeCategory = (c: { id: bigint; name: string; slug: string; description: string | null; color: string | null; sortOrder: number }, postCount?: number) => ({
  id: c.id.toString(),
  name: c.name,
  slug: c.slug,
  description: c.description,
  color: c.color,
  sortOrder: c.sortOrder,
  ...(postCount === undefined ? {} : { postCount }),
});

/** Only these are visible to the public, and only once their time has come. */
const publicWhere = (): Prisma.BlogPostWhereInput => ({
  status: BlogPostStatus.PUBLISHED,
  publishedAt: { lte: new Date() },
});

/* ------------------------------------------------------------------ *
 * Public endpoints
 * ------------------------------------------------------------------ */

export const listPublicPosts = async (req: Request, res: Response) => {
  const take = Math.min(Number(req.query.limit ?? 12) || 12, 50);
  const skip = Math.max(Number(req.query.offset ?? 0) || 0, 0);
  const categorySlug = (req.query.category as string | undefined)?.trim();
  const tag = (req.query.tag as string | undefined)?.trim();

  const where: Prisma.BlogPostWhereInput = {
    ...publicWhere(),
    ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  };

  const [posts, total, featured] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }],
      take,
      skip,
    }),
    prisma.blogPost.count({ where }),
    // The featured post only belongs on the unfiltered first page.
    categorySlug || tag || skip > 0
      ? Promise.resolve(null)
      : prisma.blogPost.findFirst({
          where: { ...publicWhere(), isFeatured: true },
          include: { category: true },
          orderBy: [{ publishedAt: "desc" }],
        }),
  ]);

  return res.json({
    posts: posts.map((p) => serializePost(p, { includeContent: false })),
    featured: featured ? serializePost(featured, { includeContent: false }) : null,
    total,
    limit: take,
    offset: skip,
  });
};

export const getPublicPost = async (req: Request, res: Response) => {
  const slug = req.params.slug;
  if (!slug) return res.status(400).json({ message: "Missing slug" });

  const post = await prisma.blogPost.findFirst({
    where: { slug, ...publicWhere() },
    include: { category: true },
  });
  if (!post) return res.status(404).json({ message: "Post not found" });

  // Related: same category first, then anything recent, never the post itself.
  const related = await prisma.blogPost.findMany({
    where: {
      ...publicWhere(),
      id: { not: post.id },
      ...(post.categoryId ? { categoryId: post.categoryId } : {}),
    },
    include: { category: true },
    orderBy: [{ publishedAt: "desc" }],
    take: 3,
  });

  return res.json({
    post: serializePost(post),
    related: related.map((p) => serializePost(p, { includeContent: false })),
  });
};

export const incrementPostView = async (req: Request, res: Response) => {
  const slug = req.params.slug;
  if (!slug) return res.status(400).json({ message: "Missing slug" });
  try {
    await prisma.blogPost.updateMany({
      where: { slug, ...publicWhere() },
      data: { views: { increment: 1 } },
    });
  } catch {
    // A dropped view count must never break the page.
  }
  return res.status(204).send();
};

export const searchPublicPosts = async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const take = Math.min(Number(req.query.limit ?? 20) || 20, 50);
  if (!q) return res.json({ posts: [], total: 0, query: "" });

  const where: Prisma.BlogPostWhereInput = {
    ...publicWhere(),
    OR: [
      { title: { contains: q, mode: "insensitive" } },
      { subtitle: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
    ],
  };

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }],
      take,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return res.json({
    posts: posts.map((p) => serializePost(p, { includeContent: false })),
    total,
    query: q,
  });
};

export const listPublicCategories = async (_req: Request, res: Response) => {
  const categories = await prisma.blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { posts: { where: publicWhere() } } },
    },
  });
  return res.json({
    categories: categories.map((c) => serializeCategory(c, c._count.posts)),
  });
};

/* ------------------------------------------------------------------ *
 * Admin endpoints
 * ------------------------------------------------------------------ */

const PostPayload = z.object({
  title: z.string().min(1, "Title is required").max(300),
  slug: z.string().max(120).optional(),
  subtitle: z.string().max(400).optional().nullable(),
  excerpt: z.string().max(600).optional().nullable(),
  content: z.string().optional(),
  coverImageUrl: z.string().optional().nullable(),
  coverImageAlt: z.string().max(300).optional().nullable(),
  categoryId: z.union([z.string(), z.number()]).optional().nullable(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  status: z.nativeEnum(BlogPostStatus).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  scheduledFor: z.string().datetime().optional().nullable(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(400).optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
});

const toBigIntOrNull = (v?: string | number | null) => {
  if (v === undefined || v === null || v === "") return null;
  try {
    return BigInt(v);
  } catch {
    return null;
  }
};

const normalizeTags = (tags?: string[]) =>
  Array.from(
    new Set((tags ?? []).map((t) => t.trim().toLowerCase()).filter(Boolean))
  ).slice(0, 20);

export const adminListPosts = async (req: AuthenticatedRequest, res: Response) => {
  const take = Math.min(Number(req.query.limit ?? 50) || 50, 100);
  const skip = Math.max(Number(req.query.offset ?? 0) || 0, 0);
  const q = (req.query.q as string | undefined)?.trim();
  const status = req.query.status as BlogPostStatus | undefined;
  const categoryId = toBigIntOrNull(req.query.categoryId as string | undefined);

  const where: Prisma.BlogPostWhereInput = {
    ...(status && Object.values(BlogPostStatus).includes(status) ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [posts, total, counts] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: { category: true },
      orderBy: [{ updatedAt: "desc" }],
      take,
      skip,
    }),
    prisma.blogPost.count({ where }),
    prisma.blogPost.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const statusCounts = counts.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = row._count._all;
    return acc;
  }, {});

  const totalViews = await prisma.blogPost.aggregate({ _sum: { views: true } });

  return res.json({
    posts: posts.map((p) => serializePost(p, { includeContent: false })),
    total,
    limit: take,
    offset: skip,
    stats: {
      draft: statusCounts.DRAFT ?? 0,
      scheduled: statusCounts.SCHEDULED ?? 0,
      published: statusCounts.PUBLISHED ?? 0,
      archived: statusCounts.ARCHIVED ?? 0,
      totalViews: totalViews._sum.views ?? 0,
    },
  });
};

export const adminGetPost = async (req: AuthenticatedRequest, res: Response) => {
  const id = toBigIntOrNull(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid post id" });
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!post) return res.status(404).json({ message: "Post not found" });
  return res.json({ post: serializePost(post) });
};

export const adminCreatePost = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = PostPayload.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }
  const data = parsed.data;
  const content = sanitizeHtml(data.content ?? "");
  const status = data.status ?? BlogPostStatus.DRAFT;

  const author = req.user?.userId
    ? await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, name: true },
      })
    : null;

  const post = await prisma.blogPost.create({
    data: {
      title: data.title,
      slug: await uniqueSlug(data.slug || data.title),
      subtitle: data.subtitle ?? null,
      excerpt: data.excerpt?.trim() || (content ? autoExcerpt(content) : null),
      content,
      coverImageUrl: data.coverImageUrl ?? null,
      coverImageAlt: data.coverImageAlt ?? null,
      categoryId: toBigIntOrNull(data.categoryId),
      tags: normalizeTags(data.tags),
      authorId: author?.id ?? null,
      authorName: author?.name ?? null,
      status,
      publishedAt:
        status === BlogPostStatus.PUBLISHED
          ? data.publishedAt
            ? new Date(data.publishedAt)
            : new Date()
          : null,
      scheduledFor:
        status === BlogPostStatus.SCHEDULED && data.scheduledFor
          ? new Date(data.scheduledFor)
          : null,
      isFeatured: data.isFeatured ?? false,
      readTimeMinutes: readTimeFor(content),
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      ogImageUrl: data.ogImageUrl ?? null,
    },
    include: { category: true },
  });

  // Only one post can wear the featured badge at a time.
  if (post.isFeatured) {
    await prisma.blogPost.updateMany({
      where: { id: { not: post.id }, isFeatured: true },
      data: { isFeatured: false },
    });
  }

  void auditLog({ action: "BLOG_POST_CREATE", resource: post.id.toString(), detail: { title: post.title, status } });
  return res.status(201).json({ post: serializePost(post) });
};

export const adminUpdatePost = async (req: AuthenticatedRequest, res: Response) => {
  const id = toBigIntOrNull(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid post id" });

  const parsed = PostPayload.partial({ title: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }
  const data = parsed.data;

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: "Post not found" });

  const content = data.content !== undefined ? sanitizeHtml(data.content) : existing.content;
  const status = data.status ?? existing.status;

  // Stamp publishedAt the first time a post actually goes live, and keep the
  // original date on every edit after that.
  let publishedAt = existing.publishedAt;
  if (status === BlogPostStatus.PUBLISHED) {
    publishedAt = data.publishedAt
      ? new Date(data.publishedAt)
      : existing.publishedAt ?? new Date();
  } else if (status === BlogPostStatus.DRAFT || status === BlogPostStatus.SCHEDULED) {
    publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.slug !== undefined || data.title !== undefined
        ? { slug: await uniqueSlug(data.slug || data.title || existing.title, id) }
        : {}),
      ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
      ...(data.excerpt !== undefined
        ? { excerpt: data.excerpt?.trim() || (content ? autoExcerpt(content) : null) }
        : {}),
      ...(data.content !== undefined ? { content, readTimeMinutes: readTimeFor(content) } : {}),
      ...(data.coverImageUrl !== undefined ? { coverImageUrl: data.coverImageUrl } : {}),
      ...(data.coverImageAlt !== undefined ? { coverImageAlt: data.coverImageAlt } : {}),
      ...(data.categoryId !== undefined ? { categoryId: toBigIntOrNull(data.categoryId) } : {}),
      ...(data.tags !== undefined ? { tags: normalizeTags(data.tags) } : {}),
      ...(data.isFeatured !== undefined ? { isFeatured: data.isFeatured } : {}),
      ...(data.seoTitle !== undefined ? { seoTitle: data.seoTitle } : {}),
      ...(data.seoDescription !== undefined ? { seoDescription: data.seoDescription } : {}),
      ...(data.ogImageUrl !== undefined ? { ogImageUrl: data.ogImageUrl } : {}),
      status,
      publishedAt,
      scheduledFor:
        status === BlogPostStatus.SCHEDULED
          ? data.scheduledFor
            ? new Date(data.scheduledFor)
            : existing.scheduledFor
          : null,
    },
    include: { category: true },
  });

  if (post.isFeatured) {
    await prisma.blogPost.updateMany({
      where: { id: { not: post.id }, isFeatured: true },
      data: { isFeatured: false },
    });
  }

  void auditLog({ action: "BLOG_POST_UPDATE", resource: post.id.toString(), detail: { title: post.title, status } });
  return res.json({ post: serializePost(post) });
};

export const adminDeletePost = async (req: AuthenticatedRequest, res: Response) => {
  const id = toBigIntOrNull(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid post id" });
  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { title: true } });
  if (!existing) return res.status(404).json({ message: "Post not found" });

  await prisma.blogPost.delete({ where: { id } });
  void auditLog({ action: "BLOG_POST_DELETE", resource: id.toString(), detail: { title: existing.title } });
  return res.status(204).send();
};

/* ---- Categories ---- */

const CategoryPayload = z.object({
  name: z.string().min(1, "Name is required").max(80),
  slug: z.string().max(80).optional(),
  description: z.string().max(400).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const adminListCategories = async (_req: AuthenticatedRequest, res: Response) => {
  const categories = await prisma.blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { posts: true } } },
  });
  return res.json({
    categories: categories.map((c) => serializeCategory(c, c._count.posts)),
  });
};

export const adminCreateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const parsed = CategoryPayload.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }
  const data = parsed.data;
  const category = await prisma.blogCategory.create({
    data: {
      name: data.name,
      slug: await uniqueCategorySlug(data.slug || data.name),
      description: data.description ?? null,
      color: data.color ?? null,
      sortOrder: data.sortOrder ?? 0,
    },
  });
  void auditLog({ action: "BLOG_CATEGORY_CREATE", resource: category.id.toString(), detail: { name: category.name } });
  return res.status(201).json({ category: serializeCategory(category, 0) });
};

export const adminUpdateCategory = async (req: AuthenticatedRequest, res: Response) => {
  const id = toBigIntOrNull(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid category id" });
  const parsed = CategoryPayload.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
  }
  const data = parsed.data;
  const existing = await prisma.blogCategory.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: "Category not found" });

  const category = await prisma.blogCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.slug !== undefined || data.name !== undefined
        ? { slug: await uniqueCategorySlug(data.slug || data.name || existing.name, id) }
        : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  });
  void auditLog({ action: "BLOG_CATEGORY_UPDATE", resource: category.id.toString(), detail: { name: category.name } });
  return res.json({ category: serializeCategory(category) });
};

export const adminDeleteCategory = async (req: AuthenticatedRequest, res: Response) => {
  const id = toBigIntOrNull(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid category id" });
  const existing = await prisma.blogCategory.findUnique({ where: { id }, select: { name: true } });
  if (!existing) return res.status(404).json({ message: "Category not found" });

  // Posts survive their category; the relation is SetNull.
  await prisma.blogCategory.delete({ where: { id } });
  void auditLog({ action: "BLOG_CATEGORY_DELETE", resource: id.toString(), detail: { name: existing.name } });
  return res.status(204).send();
};
