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
      <div className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Skeleton className="h-full w-full rounded-none" />
        </div>
        <div className="relative h-full flex items-center px-4 md:px-12 lg:px-16">
          <div className="max-w-2xl space-y-4 md:space-y-6">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-14 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-16 w-full" />
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
    <div className="relative h-[85vh] md:h-[95vh] w-full overflow-hidden">
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
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center px-4 md:px-12 lg:px-16">
            <div className="max-w-2xl space-y-4 md:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <div className="inline-block px-3 py-1 bg-[#fd7e14]/20 border border-[#fd7e14] rounded-md backdrop-blur-sm mb-4">
                  <span className="text-[#fd7e14] text-xs md:text-sm tracking-wider">WANZAMI ORIGINAL</span>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-white text-4xl md:text-6xl lg:text-7xl tracking-tight"
              >
                {current.title}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex items-center space-x-4 text-sm md:text-base"
              >
                <span className="text-[#fd7e14] border border-[#fd7e14] px-2 py-0.5 rounded text-xs">
                  {current.rating}
                </span>
                <span className="text-gray-300">{current.year}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300">{current.genre}</span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="text-gray-300 text-sm md:text-lg max-w-xl leading-relaxed"
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
                  className="flex items-center justify-center gap-2 bg-[#fd7e14] hover:bg-[#e86f0f] text-white px-6 md:px-8 py-3 md:py-4 rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                  <span className="text-sm md:text-base">Buy Now</span>
                </button>

                <button
                  onClick={() => (onMoreInfoClick ?? onPlayClick)(current)}
                  className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl backdrop-blur-md border border-white/20 transition-all duration-200"
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
      <div className="absolute bottom-8 right-4 md:right-12 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-12 h-1 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-[#fd7e14]' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
