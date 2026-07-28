'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Search } from 'lucide-react';
import { Slug, Sticker, SectionHeading, Sprockets } from './cs/kit';
import { formatPostDate, type BlogCategory, type BlogPost } from '@/lib/blogClient';

/*
  Call Sheet editorial front page. Hard ink borders and offset shadows rather
  than rounded cards, so the blog reads as the same production office as the
  rest of the storefront.
*/

const CoverArt = ({ post, className = '' }: { post: BlogPost; className?: string }) =>
  post.coverImageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.coverImageUrl}
      alt={post.coverImageAlt ?? ''}
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-cs-ink" aria-hidden="true">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cs-paper/40">Wanzami</span>
    </div>
  );

const Byline = ({ post }: { post: BlogPost }) => (
  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-cs-muted">
    {post.author?.name ? `${post.author.name} · ` : ''}
    {formatPostDate(post.publishedAt)} · {post.readTimeMinutes} min read
  </p>
);

function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="cs-border cs-shadow-lg bg-cs-ink"
    >
      <Link href={`/blog/post/${post.slug}`} className="group block">
        <div className="relative h-[300px] overflow-hidden sm:h-[420px] md:h-[520px]">
          <CoverArt post={post} className="transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-cs-ink via-cs-ink/60 to-transparent" />

          <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
            <Sticker>Featured story</Sticker>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-10">
            <div className="max-w-3xl">
              {post.category ? (
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-brand">
                  {post.category.name}
                </p>
              ) : null}
              <h2 className="font-heading text-3xl uppercase leading-[0.95] tracking-wide text-cs-paper sm:text-5xl md:text-6xl">
                {post.title}
              </h2>
              {post.subtitle || post.excerpt ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cs-paper/75 sm:text-base">
                  {post.subtitle ?? post.excerpt}
                </p>
              ) : null}
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-cs-paper/60">
                {post.author?.name ? `${post.author.name} · ` : ''}
                {formatPostDate(post.publishedAt)} · {post.readTimeMinutes} min read
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function PostCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.3) }}
      className="cs-border cs-shadow bg-cs-panel transition-transform duration-200 hover:-translate-y-1"
    >
      <Link href={`/blog/post/${post.slug}`} className="group block h-full">
        <div className="h-44 overflow-hidden border-b-[2.5px] border-cs-ink sm:h-48">
          <CoverArt post={post} className="transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="p-4 sm:p-5">
          {post.category ? (
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cs-rust">
              {post.category.name}
            </p>
          ) : null}
          <h3 className="font-heading text-xl uppercase leading-[1.05] tracking-wide text-cs-ink sm:text-2xl">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cs-muted">{post.excerpt}</p>
          ) : null}
          <div className="mt-4 border-t border-cs-line pt-3">
            <Byline post={post} />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function BlogHomePage({
  posts,
  featured,
  categories,
}: {
  posts: BlogPost[];
  featured: BlogPost | null;
  categories: BlogCategory[];
}) {
  // The featured post owns the hero, so keep it out of the grid beneath it.
  const gridPosts = featured ? posts.filter((p) => p.id !== featured.id) : posts;
  const hasAnything = Boolean(featured) || gridPosts.length > 0;

  return (
    <div className="min-h-screen bg-cs-paper pb-16 pt-20 sm:pt-24">
      <header className="container-page mb-8 sm:mb-12">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Slug>Wanzami press · the story desk</Slug>
            <h1 className="mt-2 font-heading text-4xl uppercase leading-[0.9] tracking-wide text-cs-ink sm:text-6xl lg:text-7xl">
              Wanzami <span className="text-cs-rust">Stories</span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-cs-muted sm:text-lg">
              Insights, culture, and dispatches from the heart of African cinema.
            </p>
          </div>

          <Link
            href="/blog/search"
            className="cs-border inline-flex min-h-[44px] w-full items-center gap-3 bg-cs-panel px-5 py-3 font-mono text-xs uppercase tracking-[0.08em] text-cs-ink transition-transform hover:-translate-y-0.5 md:w-auto"
          >
            <Search className="h-4 w-4 shrink-0 text-cs-rust" />
            Search stories
          </Link>
        </div>

        {categories.length ? (
          <nav aria-label="Blog categories" className="mt-6 flex flex-wrap gap-2">
            {categories
              .filter((c) => (c.postCount ?? 0) > 0)
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/blog/category/${c.slug}`}
                  className="cs-border-thin bg-cs-paper px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-cs-ink transition-colors hover:bg-cs-ink hover:text-cs-paper"
                >
                  {c.name}
                  <span className="ml-1.5 text-cs-muted">{c.postCount}</span>
                </Link>
              ))}
          </nav>
        ) : null}
      </header>

      {!hasAnything ? (
        <div className="container-page">
          <div className="cs-border bg-cs-panel p-10 text-center">
            <Slug>Nothing filed yet</Slug>
            <p className="mt-3 text-cs-muted">
              The first Wanzami story is still in the edit. Check back shortly.
            </p>
          </div>
        </div>
      ) : (
        <>
          {featured ? (
            <section className="container-page mb-12 sm:mb-16">
              <FeaturedPost post={featured} />
            </section>
          ) : null}

          {gridPosts.length ? (
            <section className="container-page">
              <div className="mb-6">
                <SectionHeading slug="Latest filings" title="Fresh off the desk" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post, i) => (
                  <PostCard key={post.id} post={post} index={i} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <div className="mt-16 bg-cs-ink py-3">
        <Sprockets />
      </div>

      <section className="container-page mt-16">
        <div className="cs-border cs-shadow-lg bg-cs-ink p-8 text-center sm:p-12">
          <Slug>Next feature</Slug>
          <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl uppercase leading-[0.95] tracking-wide text-cs-paper sm:text-5xl">
            Stream the stories behind the stories
          </h2>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-[44px] items-center gap-2 border-[2.5px] border-cs-paper bg-cs-rust px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.07em] text-cs-paper transition-transform hover:-translate-y-0.5"
          >
            Browse the catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
