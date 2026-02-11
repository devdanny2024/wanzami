import { useState } from "react";
import { motion } from "motion/react";
import { Search, TrendingUp, X } from "lucide-react";
import { GenreChips } from "../components/GenreChips";
import { movies, series, genres, trendingSearches } from "../data/mockData";

interface SearchScreenProps {
  onBack: () => void;
  onMovieClick: (id: string) => void;
}

export function SearchScreen({ onBack, onMovieClick }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  
  const allContent = [...movies, ...series];
  
  const searchResults = searchQuery.trim() 
    ? allContent.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.genre.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];
    
  const genreResults = selectedGenre === "All" 
    ? allContent 
    : allContent.filter(item => item.genre.includes(selectedGenre));

  return (
    <div className="min-h-screen bg-[#0B0B0F] pb-24">
      {/* Search header */}
      <div className="sticky top-0 bg-[#0B0B0F] z-40 px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-[#14141B] flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search movies, series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#14141B] text-white pl-12 pr-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E50914]"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-[#A1A1AA]" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6">
        {!searchQuery ? (
          <>
            {/* Trending Searches */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#E50914]" />
                <h2 className="text-white text-lg font-bold">Trending Searches</h2>
              </div>
              <div className="space-y-2">
                {trendingSearches.map((search) => (
                  <motion.button
                    key={search}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSearchQuery(search)}
                    className="w-full bg-[#14141B] hover:bg-[#1C1C25] text-white px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between"
                  >
                    <span>{search}</span>
                    <Search className="w-4 h-4 text-[#A1A1AA]" />
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Browse by Genre */}
            <div>
              <h2 className="text-white text-lg font-bold mb-4">Browse by Genre</h2>
              <GenreChips 
                genres={genres}
                selectedGenre={selectedGenre}
                onGenreSelect={setSelectedGenre}
              />
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                {genreResults.slice(0, 10).map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => onMovieClick(item.id)}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-semibold text-sm line-clamp-2">{item.title}</h3>
                      <p className="text-[#A1A1AA] text-xs">⭐ {item.rating}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Search Results */}
            <div>
              <h2 className="text-white text-lg font-bold mb-4">
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
              </h2>
              
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {searchResults.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => onMovieClick(item.id)}
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded">
                        <span className="text-[#FFB020] text-xs font-semibold">⭐ {item.rating}</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="text-white font-semibold text-sm line-clamp-2">{item.title}</h3>
                        <p className="text-[#A1A1AA] text-xs">{item.year}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[#A1A1AA] mb-4">No results found</p>
                  <p className="text-[#6B7280] text-sm">Try searching for something else</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
