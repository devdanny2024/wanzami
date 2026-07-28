'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Slug } from './cs/kit';
import { PostCard } from './BlogHomePage';
import type { BlogCategory, BlogPost } from '@/lib/blogClient';

export function BlogCategoryPage({
  category,
  posts,
  allCategories,
}: {
  category: BlogCategory | null;
  posts: BlogPost[];
  allCategories: BlogCategory[];
}) {
  const name = category?.name ?? 'Category';

  return (
    <div className="min-h-screen bg-cs-paper pb-16 pt-20 sm:pt-24">
      <header className="container-page mb-8">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-cs-muted transition-colors hover:text-cs-rust"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All stories
        </Link>

        <Slug>Category file</Slug>
        <h1 className="mt-2 font-heading text-4xl uppercase leading-[0.9] tracking-wide text-cs-ink sm:text-6xl">
          {name}
        </h1>
        {category?.description ? (
          <p className="mt-3 max-w-2xl text-base text-cs-muted sm:text-lg">{category.description}</p>
        ) : null}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cs-muted">
          {posts.length} {posts.length === 1 ? 'story' : 'stories'}
        </p>

        {allCategories.length ? (
          <nav aria-label="Other categories" className="mt-6 flex flex-wrap gap-2">
            {allCategories
              .filter((c) => (c.postCount ?? 0) > 0)
              .map((c) => {
                const active = c.slug === category?.slug;
                return (
                  <Link
                    key={c.id}
                    href={`/blog/category/${c.slug}`}
                    aria-current={active ? 'page' : undefined}
                    className={`cs-border-thin px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] transition-colors ${
                      active
                        ? 'bg-cs-ink text-cs-paper'
                        : 'bg-cs-paper text-cs-ink hover:bg-cs-ink hover:text-cs-paper'
                    }`}
                  >
                    {c.name}
                  </Link>
                );
              })}
          </nav>
        ) : null}
      </header>

      <section className="container-page">
        {posts.length === 0 ? (
          <div className="cs-border bg-cs-panel p-10 text-center">
            <Slug>Empty file</Slug>
            <p className="mt-3 text-cs-muted">
              Nothing has been filed under {name} yet.
            </p>
            <Link
              href="/blog"
              className="cs-border-thin mt-5 inline-flex min-h-[44px] items-center bg-cs-paper px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-cs-ink transition-colors hover:bg-cs-ink hover:text-cs-paper"
            >
              Back to all stories
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <PostCard key={post.id} post={post} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
