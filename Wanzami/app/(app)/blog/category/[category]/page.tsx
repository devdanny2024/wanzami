import type { Metadata } from 'next';
import { BlogCategoryPage } from '@/components/BlogCategoryPage';
import { fetchCategories, fetchPosts } from '@/lib/blogClient';

export const revalidate = 60;

type Params = { params: { category: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = decodeURIComponent(params.category);
  const categories = await fetchCategories();
  const category = categories.find((c) => c.slug === slug);
  const name = category?.name ?? slug;

  return {
    title: `${name} — Wanzami Stories`,
    description: category?.description || `Stories filed under ${name} on Wanzami.`,
    alternates: { canonical: `/blog/category/${slug}` },
  };
}

export default async function BlogCategoryRoute({ params }: Params) {
  const slug = decodeURIComponent(params.category);
  const [{ posts }, categories] = await Promise.all([
    fetchPosts({ category: slug, limit: 50 }),
    fetchCategories(),
  ]);
  const category = categories.find((c) => c.slug === slug) ?? null;

  return <BlogCategoryPage category={category} posts={posts} allCategories={categories} />;
}
