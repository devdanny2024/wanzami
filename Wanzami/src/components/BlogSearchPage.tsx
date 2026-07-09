import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ArrowLeft, TrendingUp, Filter, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BlogPost } from './BlogHomePage';

interface BlogSearchPageProps {
  onBack: () => void;
  onPostClick: (post: BlogPost) => void;
}

const searchResults: BlogPost[] = [
  {
    id: 50,
    title: "The Rise of African Cinema: How Nollywood is Reshaping Global Storytelling",
    image: "https://images.unsplash.com/photo-1621276336795-925346853745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Film Industry",
    author: {
      name: "Amaka Okafor",
      avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
    },
    date: "Nov 20, 2024",
    readTime: "8 min read",
    excerpt: "Nigerian cinema has evolved from humble beginnings to become one of the world's largest film industries by volume...",
    views: 12500
  },
  {
    id: 51,
    title: "Behind The Scenes: Making of 'The Governor'",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Behind The Scenes",
    author: {
      name: "Chidi Nwosu",
      avatar: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?w=100&h=100&fit=crop"
    },
    date: "Nov 18, 2024",
    readTime: "6 min read",
    excerpt: "An exclusive look into the production of Wanzami's biggest political thriller with exclusive interviews...",
    views: 8200
  },
  {
    id: 52,
    title: "The Tech Behind Wanzami: Building Africa's Streaming Future",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Technology",
    author: {
      name: "Tunde Bakare",
      avatar: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?w=100&h=100&fit=crop"
    },
    date: "Nov 16, 2024",
    readTime: "12 min read",
    excerpt: "Inside the infrastructure powering millions of streams across Nigeria and building the future...",
    views: 5400
  },
  {
    id: 53,
    title: "Why Nigerian Stories Matter More Than Ever",
    image: "https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGFuY2UlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjM3OTI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Culture",
    author: {
      name: "Yemi Alade",
      avatar: "https://images.unsplash.com/photo-1713845784782-51b36d805391?w=100&h=100&fit=crop"
    },
    date: "Nov 14, 2024",
    readTime: "7 min read",
    excerpt: "Exploring the global impact of authentic African narratives in modern cinema and streaming...",
    views: 18900
  }
];

const trendingSearches = [
  "Nollywood",
  "African Cinema",
  "Wanzami Originals",
  "Film Production",
  "Behind The Scenes",
  "Streaming Technology",
  "Nigerian Culture",
  "Film Reviews"
];

export function BlogSearchPage({ onBack, onPostClick }: BlogSearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Latest');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
  };

  return (
    <div className="min-h-screen bg-cs-paper pt-20 sm:pt-24 pb-12">
      {/* Header */}
      <div className="container-page mb-6 sm:mb-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 min-h-[40px] bg-cs-panel hover:bg-cs-panel border border-cs-line text-cs-ink rounded-full backdrop-blur-md transition-all group mb-6 sm:mb-8"
          >
            <ArrowLeft className="w-5 h-5 group-hover:text-brand transition-colors" />
            <span>Back</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-heading text-cs-ink text-4xl sm:text-5xl tracking-wide leading-none mb-6 sm:mb-8">Search Stories</h1>

            {/* Search Bar */}
            <div className="relative max-w-3xl">
              <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-cs-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Search articles, authors, topics..."
                className="w-full pl-12 sm:pl-16 pr-14 sm:pr-16 py-4 sm:py-5 bg-cs-panel border-2 border-cs-line focus:border-brand rounded-2xl text-cs-ink text-base sm:text-lg placeholder-gray-500 focus:outline-none backdrop-blur-md transition-all"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-cs-panel hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-cs-ink" />
                </button>
              )}
            </div>

            {!hasSearched && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-brand" />
                  <span className="text-cs-muted">Trending Searches</span>
                </div>
                <div className="flex flex-wrap gap-2.5 sm:gap-3">
                  {trendingSearches.map((term, index) => (
                    <motion.button
                      key={term}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      onClick={() => handleSearch(term)}
                      className="px-4 py-2 min-h-[40px] bg-cs-panel hover:bg-cs-panel border border-cs-line hover:border-brand rounded-full text-cs-ink text-sm transition-all group"
                    >
                      <span className="group-hover:text-brand transition-colors">
                        {term}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {hasSearched && (
        <>
          {/* Filter Bar */}
          <div className="container-page mb-6 sm:mb-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <p className="text-cs-muted text-sm sm:text-base">
                  Found <span className="text-cs-ink">{searchResults.length}</span> results for{' '}
                  <span className="text-brand">"{searchQuery}"</span>
                </p>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-2 text-cs-muted whitespace-nowrap">
                  <Filter className="w-4 h-4" />
                  <span>Sort by:</span>
                </div>
                {['Latest', 'Most Popular', 'Most Viewed', 'Oldest'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-2 min-h-[40px] rounded-lg whitespace-nowrap transition-all ${
                      selectedFilter === filter
                        ? 'bg-brand text-cs-ink'
                        : 'bg-cs-panel hover:bg-cs-panel border border-cs-line text-cs-ink'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="container-page">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-5 sm:space-y-6">
                {searchResults.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onPostClick(post)}
                    className="bg-cs-panel rounded-2xl overflow-hidden border border-cs-line hover:border-brand transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row gap-5 sm:gap-6 p-4 sm:p-6">
                      {/* Image */}
                      <div className="relative w-full md:w-80 h-44 sm:h-48 flex-shrink-0 rounded-xl overflow-hidden">
                        <ImageWithFallback
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 bg-brand text-cs-ink text-xs rounded-full">
                            {post.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                        <div>
                          <h3 className="font-heading text-cs-ink text-xl sm:text-2xl tracking-wide leading-tight mb-3 group-hover:text-brand transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-cs-muted mb-0 line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={post.author.avatar}
                              alt={post.author.name}
                              className="w-8 h-8 rounded-full shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-cs-ink text-sm truncate">{post.author.name}</div>
                              <div className="flex items-center gap-2 text-xs text-cs-muted">
                                <span>{post.date}</span>
                                <span>•</span>
                                <span>{post.readTime}</span>
                              </div>
                            </div>
                          </div>

                          {post.views && (
                            <div className="text-cs-muted text-xs sm:text-sm shrink-0">
                              {post.views.toLocaleString()} views
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Load More */}
              <div className="flex justify-center mt-10 sm:mt-12">
                <button className="px-8 py-3 min-h-[44px] bg-cs-panel hover:bg-cs-panel border border-cs-line hover:border-brand text-cs-ink rounded-xl backdrop-blur-md transition-all">
                  Load More Results
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No results state (you can add this if needed) */}
      {hasSearched && searchResults.length === 0 && (
        <div className="container-page">
          <div className="max-w-7xl mx-auto text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-cs-panel rounded-full mb-4">
              <Search className="w-8 h-8 text-cs-muted" />
            </div>
            <h3 className="font-heading text-cs-ink text-2xl tracking-wide mb-2">No results found</h3>
            <p className="text-cs-muted mb-6">
              Try searching with different keywords or browse our categories
            </p>
            <button
              onClick={clearSearch}
              className="px-6 py-3 min-h-[44px] bg-brand hover:bg-brand-dark text-cs-ink rounded-xl transition-colors font-semibold"
            >
              Clear Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
