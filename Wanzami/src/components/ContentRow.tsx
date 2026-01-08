import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard, MovieData } from './MovieCard';
import { motion } from 'motion/react';

interface ContentRowProps {
  title: string;
  movies: MovieData[];
  onMovieClick: (movie: MovieData) => void;
  maxVisible?: number;
}

export function ContentRow({ title, movies, onMovieClick, maxVisible }: ContentRowProps) {
  const displayMovies = maxVisible ? movies.slice(0, maxVisible) : movies;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [cardWidth, setCardWidth] = useState(220);

  const ITEMS_PER_VIEW = 3.5;
  const GAP_PX = 16; // matches gap-4 at desktop

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 0);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  // Recalculate card width so exactly 6 items fit per viewport (desktop), with sensible min/max clamps.
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const recalc = () => {
      const viewportWidth = typeof window !== "undefined" ? window.innerWidth : container.clientWidth;

      // On mobile, use a fixed narrower card width so more cards are visible in the viewport.
      if (viewportWidth < 768) {
        setCardWidth(200);
        setShowLeftArrow(container.scrollLeft > 0);
        setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
        return;
      }

      const available = container.clientWidth - GAP_PX * (ITEMS_PER_VIEW - 1);
      const target = available / ITEMS_PER_VIEW;
      const clamped = Math.max(300, Math.min(420, target));
      setCardWidth(clamped);
      setShowLeftArrow(container.scrollLeft > 0);
      setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    };

    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [displayMovies.length]);

  return (
    <div className="group/row relative mb-8 md:mb-12 px-6 md:px-10 lg:px-14">
      <h2 className="text-white mb-4 px-0 tracking-tight text-xl md:text-2xl">
        {title}
      </h2>

      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleScroll('left')}
            className="hidden md:flex absolute left-0 top-0 bottom-0 z-10 items-center justify-center w-12 bg-black/80 hover:bg-black/90 text-white opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8" />
          </motion.button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-2 md:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-12 lg:px-16 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayMovies.map((movie) => (
            <div
              key={movie.id}
              className="flex-none p-2"
              style={{
                width: `${cardWidth}px`,
                minWidth: `${cardWidth}px`,
              }}
            >
              <MovieCard movie={movie} onClick={onMovieClick} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {showRightArrow && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleScroll('right')}
            className="hidden md:flex absolute right-0 top-0 bottom-0 z-10 items-center justify-center w-12 bg-black/80 hover:bg-black/90 text-white opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
