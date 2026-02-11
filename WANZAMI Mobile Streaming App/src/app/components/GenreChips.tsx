import { motion } from "motion/react";

interface GenreChipsProps {
  genres: string[];
  selectedGenre: string;
  onGenreSelect: (genre: string) => void;
}

export function GenreChips({ genres, selectedGenre, onGenreSelect }: GenreChipsProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide mb-6">
      <div className="flex gap-2 px-6">
        {genres.map((genre) => {
          const isSelected = selectedGenre === genre;
          
          return (
            <motion.button
              key={genre}
              whileTap={{ scale: 0.95 }}
              onClick={() => onGenreSelect(genre)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-[#FF6A00] text-white"
                  : "bg-[#14141B] text-[#A1A1AA] hover:bg-[#1C1C25] hover:text-white"
              }`}
            >
              {genre}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}