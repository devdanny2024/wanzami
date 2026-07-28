import type { Metadata } from 'next';
import { BlogHomePage } from '@/components/BlogHomePage';
import { fetchCategories, fetchPosts } from '@/lib/blogClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Wanzami Stories — Insights from African cinema',
  description:
    'Insights, culture, and dispatches from the heart of African cinema. Behind the scenes, interviews, and industry stories from Wanzami.',
  openGraph: {
    title: 'Wanzami Stories',
    description: 'Insights, culture, and dispatches from the heart of African cinema.',
    type: 'website',
  },
};

export default async function BlogRoute() {
  const [{ posts, featured }, categories] = await Promise.all([
    fetchPosts({ limit: 12 }),
    fetchCategories(),
  ]);

  return <BlogHomePage posts={posts} featured={featured} categories={categories} />;
}
