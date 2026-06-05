import { useState } from 'react';
import { Search, X, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MovieData } from './MovieCard';

interface SearchPageProps {
  onMovieClick: (movie: MovieData) => void;
  movies: MovieData[];
  loading?: boolean;
  error?: string | null;
}

const fallbackMovies: MovieData[] = [
  {
    id: 1,
    title: "King of Boys",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    genre: "Crime Drama"
  },
  {
    id: 2,
    title: "Lagos Hustle",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    genre: "Drama"
  },
  {
    id: 3,
    title: "Ancestral Calling",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    genre: "Fantasy"
  },
  {
    id: 4,
    title: "Family Ties",
    image: "https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwaGFwcHl8ZW58MXx8fHwxNzYzNzkyNjYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    genre: "Comedy"
  },
  {
    id: 5,
    title: "Rhythm & Soul",
    image: "https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGFuY2UlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjM3OTI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    genre: "Musical"
  },
  {
    id: 6,
    title: "City Lights",
    image: "https://images.unsplash.com/photo-1621276336795-925346853745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    genre: "Thriller"
  },
  {
    id: 7,
    title: "Heritage Keepers",
    image: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mzc5MjY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    genre: "Adventure"
  },
  {
    id: 8,
    title: "Power Play",
    image: "https://images.unsplash.com/photo-1761370980993-3ec8c23709fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMGNpbmVtYSUyMG1vdmllfGVufDF8fHx8MTc2Mzc5MjY2MXww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    genre: "Political Thriller"
  }
];

export function SearchPage({ onMovieClick, movies, loading, error }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const allMovies = movies.length ? movies : fallbackMovies;
  const filteredMovies = searchQuery
    ? allMovies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          movie.genre?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMovies;

  return (
    <div className="min-h-screen bg-background container-page pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 md:mb-12"
        >
          <div
            className={`relative max-w-3xl mx-auto transition-all duration-300 ${
              isFocused ? 'scale-105' : 'scale-100'
            }`}
          >
            <div
              className={`flex items-center gap-3 sm:gap-4 bg-graphite/80 backdrop-blur-md rounded-2xl px-4 sm:px-6 py-3.5 sm:py-4 border-2 transition-all duration-300 ${
                isFocused ? 'border-brand shadow-lg shadow-brand/20' : 'border-white/10'
              }`}
            >
              <Search className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-colors ${isFocused ? 'text-brand' : 'text-ash'}`} />

              <input
                type="text"
                placeholder="Search for movies, series, or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="flex-1 min-w-0 bg-transparent text-foreground placeholder-ash/70 outline-none text-base sm:text-lg"
              />

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="text-ash hover:text-foreground transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {isFocused && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute -inset-4 bg-brand/10 rounded-3xl blur-xl -z-10"
              />
            )}
          </div>
        </motion.div>

        {/* Results */}
        {loading && (
          <div className="text-ash text-center mb-8">Loading catalog…</div>
        )}
        {error && !loading && (
          <div className="text-destructive text-center mb-8">Failed to load movies: {error}</div>
        )}

        <AnimatePresence mode="wait">
          {searchQuery ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-6">
                <p className="text-ash">
                  {filteredMovies.length} {filteredMovies.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                </p>
              </div>

              {filteredMovies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {filteredMovies.map((movie) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      className="group cursor-pointer"
                      onClick={() => onMovieClick(movie)}
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-graphite mb-2">
                        <ImageWithFallback
                          src={movie.image}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {/* Border glow */}
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-brand transition-colors" />

                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-current text-white" />
                          </div>
                        </div>
                      </div>

                      <h3 className="text-foreground text-sm font-medium mb-1 line-clamp-1">{movie.title}</h3>
                      <div className="flex items-center gap-2 text-xs">
                        {movie.rating && (
                          <span className="text-brand border border-brand px-1.5 py-0.5 rounded shrink-0">
                            {movie.rating}
                          </span>
                        )}
                        <span className="text-ash line-clamp-1">{movie.genre}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="font-heading text-foreground text-2xl tracking-wide uppercase mb-2">No results found</h3>
                  <p className="text-ash">Try searching for something else</p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="browse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="font-heading text-foreground mb-6 tracking-wide uppercase text-2xl md:text-3xl">Browse All</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {allMovies.map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="group cursor-pointer"
                    onClick={() => onMovieClick(movie)}
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-graphite mb-2">
                      <ImageWithFallback
                        src={movie.image}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-brand transition-colors" />
                    </div>

                    <h3 className="text-foreground text-sm font-medium mb-1 line-clamp-1">{movie.title}</h3>
                    <div className="flex items-center gap-2 text-xs">
                      {movie.rating && (
                        <span className="text-brand border border-brand px-1.5 py-0.5 rounded shrink-0">
                          {movie.rating}
                        </span>
                      )}
                      <span className="text-ash line-clamp-1">{movie.genre}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
