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
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24 pb-12">
      {/* Header */}
      <div className="px-4 md:px-12 lg:px-16 mb-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full backdrop-blur-md transition-all group mb-8"
          >
            <ArrowLeft className="w-5 h-5 group-hover:text-[#fd7e14] transition-colors" />
            <span>Back</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-white text-4xl md:text-5xl mb-8">Search Stories</h1>

            {/* Search Bar */}
            <div className="relative max-w-3xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Search articles, authors, topics..."
                className="w-full pl-16 pr-16 py-5 bg-white/10 border-2 border-white/20 focus:border-[#fd7e14] rounded-2xl text-white text-lg placeholder-gray-500 focus:outline-none backdrop-blur-md transition-all"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                >
                  <X className="w-5 h-5 text-white" />
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
                  <TrendingUp className="w-5 h-5 text-[#fd7e14]" />
                  <span className="text-gray-400">Trending Searches</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {trendingSearches.map((term, index) => (
                    <motion.button
                      key={term}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      onClick={() => handleSearch(term)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#fd7e14] rounded-full text-white text-sm transition-all group"
                    >
                      <span className="group-hover:text-[#fd7e14] transition-colors">
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
          <div className="px-4 md:px-12 lg:px-16 mb-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-400">
                  Found <span className="text-white">{searchResults.length}</span> results for{' '}
                  <span className="text-[#fd7e14]">"{searchQuery}"</span>
                </p>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <div className="flex items-center gap-2 text-gray-400 whitespace-nowrap">
                  <Filter className="w-4 h-4" />
                  <span>Sort by:</span>
                </div>
                {['Latest', 'Most Popular', 'Most Viewed', 'Oldest'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                      selectedFilter === filter
                        ? 'bg-[#fd7e14] text-white'
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="px-4 md:px-12 lg:px-16">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-6">
                {searchResults.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => onPostClick(post)}
                    className="bg-gradient-to-br from-gray-900/50 to-gray-900/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-[#fd7e14] transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row gap-6 p-6">
                      {/* Image */}
                      <div className="relative w-full md:w-80 h-48 flex-shrink-0 rounded-xl overflow-hidden">
                        <ImageWithFallback
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 bg-[#fd7e14] text-white text-xs rounded-full">
                            {post.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-white text-2xl mb-3 group-hover:text-[#fd7e14] transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-gray-400 mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={post.author.avatar}
                              alt={post.author.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="text-white text-sm">{post.author.name}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{post.date}</span>
                                <span>•</span>
                                <span>{post.readTime}</span>
                              </div>
                            </div>
                          </div>

                          {post.views && (
                            <div className="text-gray-500 text-sm">
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
              <div className="flex justify-center mt-12">
                <button className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#fd7e14] text-white rounded-xl backdrop-blur-md transition-all">
                  Load More Results
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No results state (you can add this if needed) */}
      {hasSearched && searchResults.length === 0 && (
        <div className="px-4 md:px-12 lg:px-16">
          <div className="max-w-7xl mx-auto text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white text-2xl mb-2">No results found</h3>
            <p className="text-gray-400 mb-6">
              Try searching with different keywords or browse our categories
            </p>
            <button
              onClick={clearSearch}
              className="px-6 py-3 bg-[#fd7e14] hover:bg-[#e86f0f] text-white rounded-xl transition-colors"
            >
              Clear Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
