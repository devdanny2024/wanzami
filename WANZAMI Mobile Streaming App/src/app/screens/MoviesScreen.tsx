import { useState } from "react";
import { TopAppBar } from "../components/TopAppBar";
import { GenreChips } from "../components/GenreChips";
import { motion } from "motion/react";
import { Play, Star } from "lucide-react";
import { movies, genres } from "../data/mockData";

interface MoviesScreenProps {
  onSearchClick: () => void;
  onMovieClick: (id: string) => void;
}

export function MoviesScreen({ onSearchClick, onMovieClick }: MoviesScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState("All");
  
  const filteredMovies = selectedGenre === "All" 
    ? movies 
    : movies.filter(m => m.genre.includes(selectedGenre));

  return (
    <div className="min-h-screen bg-[#0B0B0F] pb-24">
      <TopAppBar onSearchClick={onSearchClick} showLogo={false} />
      
      {/* Header */}
      <div className="px-6 mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Movies</h1>
      </div>
      
      {/* Genre filter */}
      <GenreChips 
        genres={genres}
        selectedGenre={selectedGenre}
        onGenreSelect={setSelectedGenre}
      />
      
      {/* Movies grid */}
      <div className="px-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredMovies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group cursor-pointer"
              onClick={() => onMovieClick(movie.id)}
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#14141B]">
                <img
                  src={movie.thumbnail}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Rating badge */}
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#FFB020] fill-[#FFB020]" />
                  <span className="text-white text-xs font-semibold">{movie.rating}</span>
                </div>
                
                {/* Original badge */}
                {movie.isOriginal && (
                  <div className="absolute top-2 left-2 bg-[#FF6A00] text-white px-2 py-1 rounded text-xs font-bold">
                    ORIGINAL
                  </div>
                )}
                
                {/* Play button on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-14 h-14 rounded-full bg-[#FF6A00] flex items-center justify-center"
                  >
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </motion.div>
                </div>
              </div>
              
              {/* Movie info */}
              <div className="mt-2">
                <h3 className="text-white font-semibold line-clamp-1">{movie.title}</h3>
                <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mt-1">
                  <span>{movie.year}</span>
                  <span>•</span>
                  <span>{movie.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}