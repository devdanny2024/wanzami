'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Play, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Slug, Stamp } from './cs/kit';
import type { MovieData } from './MovieCard';
import { fetchDiscoverArt, type Title } from '@/lib/contentClient';
import {
  INDIGENOUS_LANGUAGES,
  EMPTY_STATE,
  PROMINENT_GENRES,
  activeFilterCount,
  categoryArt,
  clearGroup,
  facetCounts,
  facetsFor,
  filterTitles,
  hasActiveFilters,
  indigenousCounts,
  labelFor,
  parseFilters,
  parseTab,
  toQuery,
  toggleFilter,
  EMPTY_FILTERS,
  type DiscoverFilters,
  type DiscoverKind,
  type DiscoverTab,
  type Facet,
} from '@/lib/discover';

type SortKey = 'featured' | 'newest' | 'az';

const TAB_LABEL: Record<DiscoverTab, string> = {
  language: 'Language',
  genre: 'Genre',
  collection: 'Collections',
};

const KIND_SLUG: Record<DiscoverKind, string> = {
  language: 'WANZAMI / LANGUAGE',
  genre: 'WANZAMI / GENRE',
  collection: 'WANZAMI / COLLECTION',
};

const TAB_QUESTION: Record<DiscoverTab, string> = {
  language: 'What language do I want?',
  genre: 'What kind of story?',
  collection: 'What has Wanzami selected?',
};

function toMovieData(title: Title, idx: number): MovieData {
  const numericId = Number(title.id);
  return {
    id: Number.isNaN(numericId) ? Date.now() + idx : numericId,
    backendId: title.id,
    title: title.name,
    image: title.thumbnailUrl || title.posterUrl || 'https://placehold.co/600x338/161310/FD7E14?text=Wanzami',
    description: title.description,
    rating: title.maturityRating ?? 'PG',
    type: title.type,
    genres: title.genres,
    genre: title.genres?.[0],
    runtimeMinutes: title.runtimeMinutes ?? 0,
    trailerUrl: title.trailerUrl,
    posterUrl: title.posterUrl,
    thumbnailUrl: title.thumbnailUrl,
    maturityRating: title.maturityRating,
    isPpv: title.isPpv ?? false,
    hasAccess: title.isPpv === false,
    isOriginal: title.isOriginal ?? false,
    createdAt: title.createdAt,
  } as MovieData;
}

/* ------------------------------------------------------------------ */
/* Tile                                                                */
/* ------------------------------------------------------------------ */

function CategoryTile({
  kind,
  facet,
  index,
  count,
  selected,
  art,
  onToggle,
}: {
  kind: DiscoverKind;
  facet: Facet;
  index: number;
  count: number;
  selected: boolean;
  art?: string;
  onToggle: () => void;
}) {
  const [artFailed, setArtFailed] = useState(false);
  const showArt = Boolean(art) && !artFailed;
  const num = String(index + 1).padStart(2, '0');

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={selected}
        aria-label={`${facet.label}, ${count} ${count === 1 ? 'title' : 'titles'}${selected ? ', selected' : ''}`}
        className={`group relative block aspect-[16/10] w-full overflow-hidden bg-cs-ink text-left cs-shadow transition-transform duration-150 motion-reduce:transition-none hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-cs-rust ${
          selected ? 'border-[3px] border-cs-rust' : 'cs-border'
        }`}
      >
        {showArt ? (
          <img
            src={art}
            alt=""
            loading="lazy"
            onError={() => setArtFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            {/* Typographic fallback: ink field, warm light, ghost numeral. */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(120% 90% at 85% 0%, rgba(253,126,20,0.28) 0%, rgba(253,126,20,0) 55%), linear-gradient(160deg, #26211b 0%, #161310 70%)',
              }}
            />
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-4 font-heading text-[7.5rem] leading-none text-cs-paper/[0.07]"
            >
              {num}
            </span>
          </>
        )}

        {/* Dark bottom field keeps the title legible over any image. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
        />

        <span className="absolute left-2.5 top-2.5 bg-cs-ink/90 px-1.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-cs-paper">
          {KIND_SLUG[kind]}
        </span>
        <span className="absolute right-2.5 top-2.5 bg-brand px-1.5 py-1 font-mono text-[11px] font-bold leading-none text-cs-ink">
          {num}
        </span>

        <div className="absolute inset-x-3 bottom-3">
          <span aria-hidden="true" className="mb-2 block h-[3px] w-9 bg-brand" />
          <span className="block font-heading text-[1.65rem] uppercase leading-[0.95] tracking-wide text-cs-paper sm:text-3xl">
            {facet.label}
          </span>
        </div>

        {selected ? (
          <span className="absolute bottom-3 right-3 border-2 border-brand bg-cs-ink px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-brand">
            Selected
          </span>
        ) : null}
      </button>
      <p className="mt-2.5 text-sm text-cs-ink">{facet.blurb}</p>
      <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-cs-muted">
        {count} {count === 1 ? 'film' : 'films'}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Result card (same look as Browse All in search)                     */
/* ------------------------------------------------------------------ */

function ResultCard({ movie, onClick }: { movie: MovieData; onClick: (m: MovieData) => void }) {
  return (
    <button type="button" onClick={() => onClick(movie)} className="group block text-left">
      <div className="relative mb-2 aspect-video overflow-hidden bg-cs-ink cs-border-thin">
        <ImageWithFallback src={movie.image} alt={movie.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute inset-0 border-2 border-transparent transition-colors group-hover:border-cs-rust" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand">
            <Play className="h-5 w-5 fill-current text-white" />
          </div>
        </div>
      </div>
      <h3 className="mb-1 line-clamp-1 text-sm font-medium text-cs-ink">{movie.title}</h3>
      <div className="flex items-center gap-2 text-xs">
        {movie.rating ? (
          <span className="shrink-0 border border-cs-ink px-1.5 py-0.5 font-mono text-cs-ink">{movie.rating}</span>
        ) : null}
        <span className="line-clamp-1 text-cs-muted">{movie.genre}</span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function DiscoverPage({
  titles,
  loading,
  error,
  onMovieClick,
}: {
  titles: Title[];
  loading: boolean;
  error: string | null;
  onMovieClick: (movie: MovieData) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filters = useMemo(() => parseFilters(params), [params]);
  const tab = parseTab(params.get('tab'));
  // `?all=1` shows empty doors too, for design review before the catalogue is tagged.
  const showEmpty = params.get('all') === '1';
  const [sort, setSort] = useState<SortKey>('featured');
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [artOverrides, setArtOverrides] = useState<Record<string, string>>({});

  // Admin-set images replace the defaults; if this fails the default photographs simply stay.
  useEffect(() => {
    let on = true;
    fetchDiscoverArt()
      .then((a) => on && setArtOverrides(a))
      .catch(() => undefined);
    return () => {
      on = false;
    };
  }, []);

  const live = useMemo(() => titles.filter((t) => !t.archived), [titles]);

  const go = useCallback(
    (nextFilters: DiscoverFilters, nextTab: DiscoverTab = tab) => {
      const extra = showEmpty ? (toQuery(nextFilters, nextTab) ? '&all=1' : '?all=1') : '';
      router.replace(`${pathname}${toQuery(nextFilters, nextTab)}${extra}`, { scroll: false });
    },
    [router, pathname, tab, showEmpty],
  );

  const counts = useMemo(() => facetCounts(live, tab, filters), [live, tab, filters]);
  const subCounts = useMemo(() => indigenousCounts(live), [live]);

  const tabFacets = useMemo(() => {
    let list = facetsFor(tab).filter((f) => showEmpty || (counts[f.slug] ?? 0) > 0 || filters[tab].includes(f.slug));
    if (tab === 'genre') {
      const prominent = list.filter((f) => PROMINENT_GENRES.includes(f.slug));
      const rest = list.filter((f) => !PROMINENT_GENRES.includes(f.slug));
      list = showAllGenres ? [...prominent, ...rest] : prominent.length ? prominent : rest;
      return { list, hiddenCount: showAllGenres || !prominent.length ? 0 : rest.length };
    }
    return { list, hiddenCount: 0 };
  }, [tab, counts, filters, showEmpty, showAllGenres]);

  const results = useMemo(() => {
    const matched = filterTitles(live, filters);
    const sorted = [...matched];
    if (sort === 'newest') sorted.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    if (sort === 'az') sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted.map(toMovieData);
  }, [live, filters, sort]);

  const active = hasActiveFilters(filters);
  const activeCount = activeFilterCount(filters);

  const populatedCollections = useMemo(
    () => {
      const c = facetCounts(live, 'collection', EMPTY_FILTERS);
      return facetsFor('collection').filter((f) => (c[f.slug] ?? 0) > 0);
    },
    [live],
  );

  const showSub = tab === 'language' && filters.language.includes('indigenous');
  const subList = INDIGENOUS_LANGUAGES.filter((s) => showEmpty || (subCounts[s.slug] ?? 0) > 0 || filters.sub.includes(s.slug));

  return (
    <div className="min-h-screen bg-cs-paper container-page pb-20">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-7">
          <Slug className="mb-2">Scene 01 / Discovery</Slug>
          <h1 className="font-heading text-4xl uppercase leading-[0.92] tracking-wide text-cs-ink sm:text-6xl">
            Find your next story
          </h1>
          <p className="mt-3 max-w-2xl text-cs-muted">
            Three doors into the catalogue. Pick one, or combine them: Yoruba and thriller makes a more useful slate.
          </p>
        </header>

        {/* Mode tabs */}
        <div role="tablist" aria-label="Browse by" className="mb-6 flex flex-wrap gap-2">
          {(Object.keys(TAB_LABEL) as DiscoverTab[]).map((key) => {
            const isOn = key === tab;
            return (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={isOn}
                onClick={() => go(filters, key)}
                className={`cs-border px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-cs-rust ${
                  isOn ? 'bg-cs-ink text-cs-paper' : 'bg-cs-paper text-cs-ink hover:bg-cs-panel'
                }`}
              >
                {TAB_LABEL[key]}
                {filters[key].length ? (
                  <span className="ml-2 bg-brand px-1.5 py-0.5 text-[10px] text-cs-ink">{filters[key].length}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="mb-4 font-mono text-[11px] uppercase tracking-wider text-cs-muted">
          {TAB_QUESTION[tab]}
        </p>

        {loading ? (
          <div className="py-16 font-mono text-sm uppercase tracking-wider text-cs-muted">Loading the slate...</div>
        ) : error ? (
          <div className="py-16 text-cs-rust">Failed to load the catalogue: {error}</div>
        ) : (
          <>
            {/* Tiles */}
            {tabFacets.list.length ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {tabFacets.list.map((facet, i) => (
                  <CategoryTile
                    key={`${tab}-${facet.slug}`}
                    kind={tab}
                    facet={facet}
                    index={facetsFor(tab).findIndex((f) => f.slug === facet.slug)}
                    count={counts[facet.slug] ?? 0}
                    selected={filters[tab].includes(facet.slug)}
                    art={categoryArt(tab, facet.slug, artOverrides)}
                    onToggle={() => go(toggleFilter(filters, tab, facet.slug))}
                  />
                ))}
              </div>
            ) : (
              <div className="cs-border bg-cs-panel p-8 text-center cs-shadow">
                <Stamp rotate={-4}>No shelves yet</Stamp>
                <p className="mx-auto mt-5 max-w-md text-cs-ink">
                  {tab === 'collection'
                    ? "Wanzami's editorial shelves open here as collections are curated."
                    : 'Nothing is tagged here yet. Check back as the catalogue grows.'}
                </p>
              </div>
            )}

            {tab === 'genre' && tabFacets.hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowAllGenres(true)}
                className="mt-6 font-mono text-xs font-bold uppercase tracking-widest text-cs-rust underline-offset-4 hover:underline"
              >
                View all genres ({tabFacets.hiddenCount} more) {'>'}
              </button>
            ) : null}

            {/* Indigenous sub-list */}
            {showSub && subList.length ? (
              <div className="mt-8 cs-border bg-cs-panel p-5 cs-shadow-sm">
                <Slug className="mb-3">Indigenous / by language</Slug>
                <div className="flex flex-wrap gap-2">
                  {subList.map((s) => {
                    const on = filters.sub.includes(s.slug);
                    return (
                      <button
                        key={s.slug}
                        type="button"
                        aria-pressed={on}
                        onClick={() => go(toggleFilter(filters, 'sub', s.slug))}
                        className={`cs-border-thin px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider ${
                          on ? 'bg-cs-ink text-cs-paper' : 'bg-cs-paper text-cs-ink hover:bg-cs-panel'
                        }`}
                      >
                        {on ? 'x ' : ''}
                        {s.label} <span className="text-cs-muted">{subCounts[s.slug] ?? 0}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Active filters + results */}
            {active ? (
              <section className="mt-12" aria-live="polite">
                <div className="mb-5 flex flex-wrap items-center gap-2 border-t-[3px] border-cs-ink pt-5">
                  <span className="mr-1 font-mono text-[11px] font-bold uppercase tracking-widest text-cs-muted">
                    Filters ({activeCount}) / Sort:
                  </span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    aria-label="Sort results"
                    className="cs-border-thin bg-cs-paper px-2 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-cs-ink"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="az">A to Z</option>
                  </select>
                </div>

                <div className="mb-6 flex flex-wrap items-center gap-2">
                  {(['language', 'genre', 'collection'] as DiscoverKind[]).flatMap((kind) =>
                    filters[kind].map((slug) => (
                      <button
                        key={`${kind}-${slug}`}
                        type="button"
                        onClick={() => go(toggleFilter(filters, kind, slug))}
                        aria-label={`Remove ${TAB_LABEL[kind]} filter ${labelFor(kind, slug)}`}
                        className="inline-flex items-center gap-1.5 bg-cs-ink px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-cs-paper hover:bg-cs-rust"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                        {labelFor(kind, slug)}
                      </button>
                    )),
                  )}
                  {(['language', 'genre', 'collection'] as DiscoverKind[])
                    .filter((k) => filters[k].length)
                    .map((kind) => (
                      <button
                        key={`clear-${kind}`}
                        type="button"
                        onClick={() => go(clearGroup(filters, kind))}
                        className="font-mono text-xs font-bold uppercase tracking-wider text-cs-rust underline-offset-4 hover:underline"
                      >
                        Clear {TAB_LABEL[kind].toLowerCase()}
                      </button>
                    ))}
                  <button
                    type="button"
                    onClick={() => go(EMPTY_FILTERS)}
                    className="font-mono text-xs font-bold uppercase tracking-wider text-cs-rust underline-offset-4 hover:underline"
                  >
                    Clear all
                  </button>
                </div>

                {results.length ? (
                  <>
                    <Slug className="mb-4">
                      {results.length} {results.length === 1 ? 'film' : 'films'} on this slate
                    </Slug>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                      {results.map((movie) => (
                        <ResultCard key={movie.backendId ?? movie.id} movie={movie} onClick={onMovieClick} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="cs-border bg-cs-panel p-8 text-center cs-shadow">
                    <h2 className="font-heading text-3xl uppercase tracking-wide text-cs-ink">{EMPTY_STATE.title}</h2>
                    <p className="mx-auto mt-2 max-w-md text-cs-muted">{EMPTY_STATE.body}</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                      {filters.genre.length ? (
                        <button
                          type="button"
                          onClick={() => go(clearGroup(filters, 'genre'))}
                          className="cs-border bg-brand px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-cs-ink"
                        >
                          Clear genre
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => go(EMPTY_FILTERS)}
                        className="cs-border bg-cs-paper px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-cs-ink"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* The Wanzami Shelf: promoted editorial collections, populated only */}
                {populatedCollections.length ? (
                  <section className="mt-14">
                    <div className="mb-4 flex items-end justify-between">
                      <h2 className="font-heading text-3xl uppercase tracking-wide text-cs-ink">The Wanzami shelf</h2>
                      <button
                        type="button"
                        onClick={() => go(filters, 'collection')}
                        className="font-mono text-xs font-bold uppercase tracking-widest text-cs-muted hover:text-cs-rust"
                      >
                        View all {'>'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {populatedCollections.slice(0, 3).map((c) => (
                        <button
                          key={c.slug}
                          type="button"
                          onClick={() => go(toggleFilter(EMPTY_FILTERS, 'collection', c.slug), 'collection')}
                          className="flex items-center bg-cs-ink p-4 text-left text-cs-paper"
                        >
                          <span className="font-heading text-2xl uppercase tracking-wide">{c.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                {/* Let titles do the selling */}
                {live.length ? (
                  <section className="mt-14">
                    <Slug className="mb-3">The slate / all films</Slug>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                      {live.map(toMovieData).map((movie) => (
                        <ResultCard key={movie.backendId ?? movie.id} movie={movie} onClick={onMovieClick} />
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
