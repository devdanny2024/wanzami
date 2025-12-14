import { Hero } from "./Hero";
import { ContentRow } from "./ContentRow";
import { MovieData } from "./MovieCard";

interface HomePageProps {
  onMovieClick: (movie: any) => void;
  onContinueClick?: (movie: any) => void;
  movies: MovieData[];
  loading?: boolean;
  error?: string | null;
  top10?: MovieData[];
  top10Series?: MovieData[];
  trending?: MovieData[];
  trendingSeries?: MovieData[];
  continueWatching?: any[];
  becauseYouWatched?: any[];
  recsLoading?: boolean;
  recsError?: string | null;
  showGenreRows?: boolean; // disable genre rows on home; can enable on dedicated pages
}

function buildGenreRows(items: MovieData[], labelSuffix: string, maxSections = 6, maxItems = 18) {
  const genreMap = new Map<string, MovieData[]>();
  items.forEach((item) => {
    // support MovieData with optional genres array
    const g = item.genre || (item as any)?.genres?.[0];
    const key = g || "Other";
    const list = genreMap.get(key) ?? [];
    if (list.length < maxItems) list.push(item);
    genreMap.set(key, list);
  });
  const sortedKeys = Array.from(genreMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, maxSections);
  return sortedKeys.map(([key, list]) => ({
    title: `${key} ${labelSuffix}`,
    items: list,
  }));
}

export function HomePage({
  onMovieClick,
  onContinueClick,
  movies,
  loading,
  error,
  top10 = [],
  top10Series: top10SeriesProp = [],
  trending = [],
  trendingSeries: trendingSeriesProp = [],
  continueWatching = [],
  becauseYouWatched = [],
  recsLoading,
  recsError,
  showGenreRows = false,
}: HomePageProps) {
  const sortedMovies = [...movies].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });

  const featured = sortedMovies.slice(0, 3).map((m, idx) => ({
    id: typeof m.id === "number" ? m.id : idx,
    title: m.title,
    description: m.description || "Now streaming on Wanzami.",
    image: m.image,
    rating: m.rating || "PG",
    year: m.year ? String(m.year) : "2024",
    genre: m.genre || "Movie",
  }));

  const moviesOnly = sortedMovies.filter((m) => m.type === "MOVIE");
  const seriesOnly = sortedMovies.filter((m) => m.type === "SERIES");

  const moviesPrimary = moviesOnly.slice(0, 10);
  const moviesSecondary = moviesOnly.slice(10, 30);
  const seriesPrimary = seriesOnly.slice(0, 10);
  const seriesSecondary = seriesOnly.slice(10, 30);

  const top10Movies = (top10 ?? []).filter((t) => t.type === "MOVIE");
  const top10Series = (top10SeriesProp ?? top10 ?? []).filter((t) => t.type === "SERIES");

  const trendingMovies = (trending ?? []).filter((t) => t.type === "MOVIE");
  const trendingSeries = (trendingSeriesProp ?? trending ?? []).filter((t) => t.type === "SERIES");

  const movieGenreRows = showGenreRows ? buildGenreRows(moviesOnly, "Movies") : [];
  const seriesGenreRows = showGenreRows ? buildGenreRows(seriesOnly, "Series") : [];

  const hasCatalog = movies.length > 0;

  return (
    <div className="min-h-screen bg-black">
      <Hero onPlayClick={onMovieClick} featured={featured} />
      <div className="relative -mt-32 z-10 pb-12 md:pb-16">
        {loading ? (
          <div className="text-gray-400 px-4 md:px-12 lg:px-16">Loading catalog...</div>
        ) : error ? (
          <div className="text-red-400 px-4 md:px-12 lg:px-16">Failed to load movies: {error}</div>
        ) : hasCatalog ? (
          <>
            {continueWatching.length > 0 && (
              <ContentRow
                title="Continue Watching"
                movies={continueWatching as any}
                onMovieClick={onContinueClick ?? onMovieClick}
                maxVisible={6}
              />
            )}
            {becauseYouWatched.length > 0 && (
              <ContentRow title="Because You Watched" movies={becauseYouWatched as any} onMovieClick={onMovieClick} />
            )}
            {moviesOnly.length > 0 || top10Movies.length > 0 || trendingMovies.length > 0 ? (
              <>
                <div className="px-4 md:px-12 lg:px-16 mt-6">
                  <h2 className="text-white text-2xl mb-3">Movies</h2>
                </div>
                {top10Movies.length > 0 && (
                  <ContentRow title="Top 10 Movies" movies={top10Movies} onMovieClick={onMovieClick} />
                )}
                {trendingMovies.length > 0 && (
                  <ContentRow title="Trending Movies" movies={trendingMovies} onMovieClick={onMovieClick} />
                )}
                {movieGenreRows.map((row) => (
                  <ContentRow key={row.title} title={row.title} movies={row.items} onMovieClick={onMovieClick} />
                ))}
                {moviesPrimary.length > 0 && (
                  <ContentRow title="Latest Movies" movies={moviesPrimary} onMovieClick={onMovieClick} />
                )}
                {moviesSecondary.length > 0 && (
                  <ContentRow title="Other Movie Picks" movies={moviesSecondary} onMovieClick={onMovieClick} />
                )}
              </>
            ) : null}

            {seriesOnly.length > 0 || top10Series.length > 0 || trendingSeries.length > 0 ? (
              <>
                <div className="px-4 md:px-12 lg:px-16 mt-6">
                  <h2 className="text-white text-2xl mb-3">Series</h2>
                </div>
                {top10Series.length > 0 && (
                  <ContentRow title="Top 10 Series" movies={top10Series} onMovieClick={onMovieClick} />
                )}
                {trendingSeries.length > 0 && (
                  <ContentRow title="Trending Series" movies={trendingSeries} onMovieClick={onMovieClick} />
                )}
                {seriesGenreRows.map((row) => (
                  <ContentRow key={row.title} title={row.title} movies={row.items} onMovieClick={onMovieClick} />
                ))}
                {seriesPrimary.length > 0 && (
                  <ContentRow title="Latest Series" movies={seriesPrimary} onMovieClick={onMovieClick} />
                )}
                {seriesSecondary.length > 0 && (
                  <ContentRow title="Other Series Picks" movies={seriesSecondary} onMovieClick={onMovieClick} />
                )}
              </>
            ) : null}
          </>
        ) : null}
      </div>
      {recsLoading && (
        <div className="text-gray-400 px-4 md:px-12 lg:px-16 mt-4">Loading personalized rows...</div>
      )}
      {recsError && (
        <div className="text-red-400 px-4 md:px-12 lg:px-16 mt-4">Personalized rows unavailable: {recsError}</div>
      )}
    </div>
  );
}
