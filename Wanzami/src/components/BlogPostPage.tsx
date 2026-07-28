'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Link2, Share2 } from 'lucide-react';
import { Slug, Sprockets } from './cs/kit';
import { PostCard } from './BlogHomePage';
import { formatPostDate, recordPostView, type BlogPost } from '@/lib/blogClient';

function ShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the native share below still works.
    }
  };

  const nativeShare = async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      void copy();
      return;
    }
    try {
      await navigator.share({ title, url: window.location.href });
    } catch {
      // The viewer dismissed the sheet.
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void copy()}
        className="cs-border-thin inline-flex min-h-[44px] items-center gap-2 bg-cs-paper px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-cs-ink transition-colors hover:bg-cs-ink hover:text-cs-paper"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <button
        type="button"
        onClick={() => void nativeShare()}
        className="cs-border-thin inline-flex min-h-[44px] items-center gap-2 bg-cs-paper px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-cs-ink transition-colors hover:bg-cs-ink hover:text-cs-paper"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
    </div>
  );
}

export function BlogPostPage({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  // Count the read once the article is actually on screen.
  useEffect(() => {
    recordPostView(post.slug);
  }, [post.slug]);

  return (
    <div className="min-h-screen bg-cs-paper pb-16 pt-20 sm:pt-24">
      <div className="container-page">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-cs-muted transition-colors hover:text-cs-rust"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All stories
        </Link>
      </div>

      <article className="container-page">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-3xl"
        >
          {post.category ? (
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="cs-border-thin inline-block bg-cs-paper px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-cs-rust transition-colors hover:bg-cs-rust hover:text-cs-paper"
            >
              {post.category.name}
            </Link>
          ) : null}

          <h1 className="mt-4 font-heading text-4xl uppercase leading-[0.92] tracking-wide text-cs-ink sm:text-6xl">
            {post.title}
          </h1>

          {post.subtitle ? (
            <p className="mt-4 text-lg leading-relaxed text-cs-muted sm:text-xl">{post.subtitle}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y-[1.5px] border-cs-line py-4">
            <div>
              {post.author?.name ? (
                <p className="font-heading text-lg uppercase tracking-wide text-cs-ink">
                  {post.author.name}
                </p>
              ) : null}
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-cs-muted">
                {formatPostDate(post.publishedAt)} · {post.readTimeMinutes} min read
                {post.views > 0 ? ` · ${post.views.toLocaleString()} reads` : ''}
              </p>
            </div>
            <ShareRow title={post.title} />
          </div>
        </motion.header>

        {post.coverImageUrl ? (
          <motion.figure
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mx-auto mt-8 max-w-4xl"
          >
            <div className="cs-border cs-shadow-lg overflow-hidden bg-cs-ink">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImageUrl}
                alt={post.coverImageAlt ?? ''}
                className="max-h-[560px] w-full object-cover"
              />
            </div>
            {post.coverImageAlt ? (
              <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-cs-muted">
                {post.coverImageAlt}
              </figcaption>
            ) : null}
          </motion.figure>
        ) : null}

        <div
          className="cs-prose mx-auto mt-10 max-w-3xl"
          // Content is sanitized server-side on write (see blogController).
          dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
        />

        {post.tags.length ? (
          <div className="mx-auto mt-10 max-w-3xl border-t border-cs-line pt-5">
            <Slug>Filed under</Slug>
            <div className="mt-2 flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="cs-border-thin bg-cs-panel px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-cs-muted"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mx-auto mt-8 max-w-3xl">
          <ShareRow title={post.title} />
        </div>
      </article>

      {related.length ? (
        <>
          <div className="mt-16 bg-cs-ink py-3">
            <Sprockets />
          </div>
          <section className="container-page mt-12">
            <Slug>Keep reading</Slug>
            <h2 className="mb-6 mt-2 font-heading text-3xl uppercase leading-[0.9] tracking-wide text-cs-ink sm:text-5xl">
              More from the desk
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <PostCard key={p.id} post={p} index={i} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
