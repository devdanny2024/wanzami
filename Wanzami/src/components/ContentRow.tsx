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

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.85;
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

    setShowLeftArrow(container.scrollLeft > 4);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMovies.length]);

  return (
    <div className="group/row relative mb-8 md:mb-10">
      <h2 className="container-page font-heading text-foreground mb-3 md:mb-4 tracking-wide uppercase text-2xl md:text-3xl">
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
            aria-label="Scroll left"
            className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 items-center justify-center w-12 lg:w-16 bg-gradient-to-r from-black via-black/80 to-transparent text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8" />
          </motion.button>
        )}

        {/* Scrollable container — responsive snap carousel */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-4 sm:px-6 lg:px-10 2xl:px-12"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayMovies.map((movie) => (
            <div
              key={movie.id}
              className="flex-none snap-start w-[44%] sm:w-[32%] md:w-[26%] lg:w-[22%] xl:w-[18.5%] 2xl:w-[15.5%]"
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
            aria-label="Scroll right"
            className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 items-center justify-center w-12 lg:w-16 bg-gradient-to-l from-black via-black/80 to-transparent text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
