import { motion } from "motion/react";
import { ArrowLeft, Play, Download, Plus, Share2, Star } from "lucide-react";
import { CategoryRow } from "../components/CategoryRow";
import { MoviePosterCard } from "../components/MoviePosterCard";
import { movies } from "../data/mockData";

interface MovieDetailScreenProps {
  movieId: string;
  onBack: () => void;
  onMovieClick: (id: string) => void;
}

export function MovieDetailScreen({ movieId, onBack, onMovieClick }: MovieDetailScreenProps) {
  const movie = movies.find(m => m.id === movieId);
  
  if (!movie) {
    return <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-white">Movie not found</div>;
  }
  
  const similarMovies = movies
    .filter(m => m.id !== movieId && m.genre.some(g => movie.genre.includes(g)))
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#0B0B0F] pb-24">
      {/* Hero backdrop */}
      <div className="relative h-[500px]">
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0F]/80 via-transparent to-transparent" />
        
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="absolute top-6 left-6 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-10"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </motion.button>
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          {movie.isOriginal && (
            <span className="inline-block bg-[#E50914] text-white px-3 py-1 rounded text-xs font-bold uppercase mb-3">
              Wanzami Original
            </span>
          )}
          
          <h1 className="text-4xl font-bold text-white mb-3">{movie.title}</h1>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-[#FFB020] fill-[#FFB020]" />
              <span className="text-white font-semibold">{movie.rating}</span>
            </div>
            <span className="text-white">{movie.year}</span>
            <span className="text-[#A1A1AA]">•</span>
            <span className="text-white">{movie.duration}</span>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="px-6 -mt-4 mb-8 flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 bg-[#E50914] text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#F40612] transition-colors"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>Play</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-[#14141B] border border-white/20 flex items-center justify-center hover:bg-[#1C1C25] transition-colors"
        >
          <Download className="w-6 h-6 text-white" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-[#14141B] border border-white/20 flex items-center justify-center hover:bg-[#1C1C25] transition-colors"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-[#14141B] border border-white/20 flex items-center justify-center hover:bg-[#1C1C25] transition-colors"
        >
          <Share2 className="w-6 h-6 text-white" />
        </motion.button>
      </div>
      
      {/* Description */}
      <div className="px-6 mb-8">
        <h2 className="text-white text-xl font-bold mb-3">Synopsis</h2>
        <p className="text-white/80 leading-relaxed">{movie.description}</p>
      </div>
      
      {/* Genres */}
      <div className="px-6 mb-8">
        <h3 className="text-[#A1A1AA] text-sm mb-2">Genres</h3>
        <div className="flex flex-wrap gap-2">
          {movie.genre.map(genre => (
            <span 
              key={genre}
              className="bg-[#14141B] text-white px-3 py-1.5 rounded-full text-sm"
            >
              {genre}
            </span>
          ))}
        </div>
      </div>
      
      {/* Cast */}
      <div className="mb-8">
        <h2 className="text-white text-xl font-bold mb-4 px-6">Cast</h2>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 px-6">
            {movie.cast.map((actor, index) => (
              <motion.div
                key={actor}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex-shrink-0 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-[#14141B] mb-2 overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-${1500000000000 + index}000-000000000000?w=100&h=100&fit=crop&face`}
                    alt={actor}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
                    }}
                  />
                </div>
                <p className="text-white text-xs font-semibold max-w-[80px] truncate">{actor}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* More details */}
      <div className="px-6 mb-8 space-y-3">
        <div className="flex justify-between py-3 border-b border-[#1C1C25]">
          <span className="text-[#A1A1AA]">Director</span>
          <span className="text-white font-semibold">Ava DuVernay</span>
        </div>
        <div className="flex justify-between py-3 border-b border-[#1C1C25]">
          <span className="text-[#A1A1AA]">Language</span>
          <span className="text-white font-semibold">English</span>
        </div>
        <div className="flex justify-between py-3 border-b border-[#1C1C25]">
          <span className="text-[#A1A1AA]">Subtitles</span>
          <span className="text-white font-semibold">15 languages</span>
        </div>
      </div>
      
      {/* Similar movies */}
      {similarMovies.length > 0 && (
        <CategoryRow title="More Like This">
          {similarMovies.map((m) => (
            <MoviePosterCard 
              key={m.id} 
              item={m}
              onClick={() => onMovieClick(m.id)}
            />
          ))}
        </CategoryRow>
      )}
    </div>
  );
}
