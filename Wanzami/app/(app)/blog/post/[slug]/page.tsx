import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogPostPage } from '@/components/BlogPostPage';
import { fetchPost } from '@/lib/blogClient';

export const revalidate = 60;

type Params = { params: { slug: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const data = await fetchPost(params.slug);
  if (!data) {
    return { title: 'Story not found — Wanzami' };
  }

  const { post } = data;
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || post.subtitle || undefined;
  const image = post.ogImageUrl || post.coverImageUrl || undefined;

  return {
    title: `${title} — Wanzami Stories`,
    description,
    alternates: { canonical: `/blog/post/${post.slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags,
      ...(image ? { images: [{ url: image, alt: post.coverImageAlt ?? title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function BlogPostRoute({ params }: Params) {
  const data = await fetchPost(params.slug);
  if (!data) notFound();

  const { post, related } = data;

  // Article structured data so search engines and AI answer engines can read
  // the post properly rather than guessing from the markup.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: post.ogImageUrl || post.coverImageUrl || undefined,
    datePublished: post.publishedAt || undefined,
    author: post.author?.name
      ? { '@type': 'Person', name: post.author.name }
      : { '@type': 'Organization', name: 'Wanzami' },
    publisher: { '@type': 'Organization', name: 'Wanzami' },
    keywords: post.tags.join(', ') || undefined,
    articleSection: post.category?.name || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostPage post={post} related={related} />
    </>
  );
}
