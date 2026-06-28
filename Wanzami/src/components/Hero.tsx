import { useState, useEffect } from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Skeleton } from './ui/skeleton';

interface HeroContent {
  id: number;
  title: string;
  description: string;
  image: string;
  rating: string;
  year: string;
  genre: string;
   isPpv?: boolean;
}

interface HeroProps {
  onPlayClick: (content: HeroContent) => void;
  onMoreInfoClick?: (content: HeroContent) => void;
  featured?: HeroContent[];
}

export function Hero({ onPlayClick, onMoreInfoClick, featured }: HeroProps) {
  const slides = featured && featured.length > 0 ? featured : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (slides.length > 0 ? (prev + 1) % slides.length : 0));
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="relative h-[64vh] min-h-[420px] sm:h-[72vh] md:h-[80vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="container-page relative h-full flex items-end md:items-center pb-24 md:pb-0">
          <div className="max-w-2xl w-full space-y-4 md:space-y-6">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-14 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-16 w-full max-w-xl" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = slides[currentIndex % slides.length];

  return (
    <div className="relative h-[70vh] min-h-[460px] sm:h-[80vh] md:h-[92vh] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <ImageWithFallback
              src={current.image}
              alt={current.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlays — cinematic, readable on every breakpoint */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent md:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="container-page relative h-full flex items-end md:items-center pb-24 md:pb-0">
            <div className="max-w-2xl w-full space-y-3 sm:space-y-4 md:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="inline-block px-3 py-1 bg-brand/20 border border-brand rounded-md backdrop-blur-sm">
                  <span className="text-brand text-xs md:text-sm tracking-[0.2em] font-medium">WANZAMI ORIGINAL</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="font-heading text-foreground text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-wide leading-[0.9] uppercase"
              >
                {current.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm md:text-base"
              >
                <span className="text-brand border border-brand px-2 py-0.5 rounded text-xs">
                  {current.rating}
                </span>
                <span className="text-ash">{current.year}</span>
                <span className="text-ash/50">•</span>
                <span className="text-ash">{current.genre}</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-ash text-sm md:text-lg max-w-xl leading-relaxed line-clamp-3"
              >
                {current.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 pt-2"
              >
                <button
                  onClick={() => onPlayClick(current)}
                  className="flex items-center justify-center gap-2 min-h-[48px] bg-brand hover:bg-brand-dark text-white px-6 md:px-8 py-3 md:py-4 rounded-xl font-medium transition-all duration-200 hover:scale-[1.03] active:scale-95"
                >
                  <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                  <span className="text-sm md:text-base">
                    {current.isPpv ? "Buy Now" : "Play Now"}
                  </span>
                </button>

                <button
                  onClick={() => (onMoreInfoClick ?? onPlayClick)(current)}
                  className="flex items-center justify-center gap-2 min-h-[48px] bg-white/10 hover:bg-white/20 text-foreground px-6 md:px-8 py-3 md:py-4 rounded-xl backdrop-blur-md border border-white/20 transition-all duration-200 active:scale-95"
                >
                  <Info className="w-5 h-5 md:w-6 md:h-6" />
                  <span className="text-sm md:text-base">More Info</span>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Carousel indicators */}
      <div className="container-page absolute bottom-6 md:bottom-8 left-0 right-0 flex justify-center md:justify-end gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'w-10 bg-brand' : 'w-6 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
