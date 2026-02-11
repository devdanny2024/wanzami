import { useState } from "react";
import { TopAppBar } from "../components/TopAppBar";
import { GenreChips } from "../components/GenreChips";
import { motion } from "motion/react";
import { Play, Star } from "lucide-react";
import { series, genres } from "../data/mockData";

interface SeriesScreenProps {
  onSearchClick: () => void;
  onSeriesClick: (id: string) => void;
}

export function SeriesScreen({ onSearchClick, onSeriesClick }: SeriesScreenProps) {
  const [selectedGenre, setSelectedGenre] = useState("All");
  
  const filteredSeries = selectedGenre === "All" 
    ? series 
    : series.filter(s => s.genre.includes(selectedGenre));

  return (
    <div className="min-h-screen bg-[#0B0B0F] pb-24">
      <TopAppBar onSearchClick={onSearchClick} showLogo={false} />
      
      {/* Header */}
      <div className="px-6 mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Series</h1>
      </div>
      
      {/* Genre filter */}
      <GenreChips 
        genres={genres}
        selectedGenre={selectedGenre}
        onGenreSelect={setSelectedGenre}
      />
      
      {/* Series grid */}
      <div className="px-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredSeries.map((show, index) => (
            <motion.div
              key={show.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative group cursor-pointer"
              onClick={() => onSeriesClick(show.id)}
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#14141B]">
                <img
                  src={show.thumbnail}
                  alt={show.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Rating badge */}
                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#FFB020] fill-[#FFB020]" />
                  <span className="text-white text-xs font-semibold">{show.rating}</span>
                </div>
                
                {/* Original badge */}
                {show.isOriginal && (
                  <div className="absolute top-2 left-2 bg-[#FF6A00] text-white px-2 py-1 rounded text-xs font-bold">
                    ORIGINAL
                  </div>
                )}
                
                {/* Season info */}
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-semibold">
                  {show.seasons} {show.seasons === 1 ? 'Season' : 'Seasons'}
                </div>
                
                {/* Progress bar */}
                {show.progress && show.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1C1C25]">
                    <div 
                      className="h-full bg-[#FF6A00]"
                      style={{ width: `${show.progress}%` }}
                    />
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
              
              {/* Series info */}
              <div className="mt-2">
                <h3 className="text-white font-semibold line-clamp-1">{show.title}</h3>
                <div className="flex items-center gap-2 text-xs text-[#A1A1AA] mt-1">
                  <span>{show.year}</span>
                  <span>•</span>
                  <span>{show.episodes} episodes</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}