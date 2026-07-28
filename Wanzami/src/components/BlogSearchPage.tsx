'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Search, X } from 'lucide-react';
import { Slug } from './cs/kit';
import { PostCard } from './BlogHomePage';
import { searchPosts, type BlogCategory, type BlogPost } from '@/lib/blogClient';

export function BlogSearchPage({ categories }: { categories: BlogCategory[] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BlogPost[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) {
      setResults([]);
      setHasSearched(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const found = await searchPosts(term);
      setResults(found);
      setHasSearched(true);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="min-h-screen bg-cs-paper pb-16 pt-20 sm:pt-24">
      <header className="container-page mb-8">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-cs-muted transition-colors hover:text-cs-rust"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All stories
        </Link>

        <Slug>Archive search</Slug>
        <h1 className="mt-2 font-heading text-4xl uppercase leading-[0.9] tracking-wide text-cs-ink sm:text-6xl">
          Find a story
        </h1>

        <div className="relative mt-6 max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cs-muted" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, topics, tags…"
            aria-label="Search stories"
            className="cs-border min-h-[52px] w-full bg-cs-panel py-3 pl-11 pr-11 text-base text-cs-ink outline-none placeholder:text-cs-muted focus:border-cs-rust"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cs-muted transition-colors hover:text-cs-rust"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {!query && categories.length ? (
          <div className="mt-6">
            <Slug>Or browse by category</Slug>
            <nav className="mt-2 flex flex-wrap gap-2">
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
          </div>
        ) : null}
      </header>

      <section className="container-page">
        {searching ? (
          <div className="flex items-center gap-2 text-cs-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Searching the archive</span>
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="cs-border bg-cs-panel p-10 text-center">
            <Slug>No matches</Slug>
            <p className="mt-3 text-cs-muted">
              Nothing in the archive matches &ldquo;{query}&rdquo;. Try a different word.
            </p>
          </div>
        ) : results.length > 0 ? (
          <>
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.12em] text-cs-muted">
              {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
