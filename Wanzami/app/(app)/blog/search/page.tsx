import type { Metadata } from 'next';
import { BlogSearchPage } from '@/components/BlogSearchPage';
import { fetchCategories } from '@/lib/blogClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Search stories — Wanzami',
  description: 'Search the Wanzami story archive by title, topic or tag.',
};

export default async function BlogSearchRoute() {
  const categories = await fetchCategories();
  return <BlogSearchPage categories={categories} />;
}
