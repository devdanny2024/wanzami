import { useState, useEffect } from 'react';
import { Play, Info } from 'lucide-react';
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
      <div className="container-page pt-4 pb-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5 order-2 lg:order-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-16 w-full max-w-md" />
            <div className="flex gap-3">
              <Skeleton className="h-12 w-36" />
              <Skeleton className="h-12 w-36" />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Skeleton className="aspect-[16/10] w-full" />
          </div>
        </div>
      </div>
    );
  }

  const current = slides[currentIndex % slides.length];

  return (
    <section className="container-page pt-4 pb-10">
      <div className="cs-slug mb-4 flex items-center gap-2">
        <span>Scene 01 — Featured · Now streaming</span>
        <span className="h-px flex-1 bg-cs-line" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5 }}
            className="space-y-5 order-2 lg:order-1"
          >
            <span
              className="inline-block bg-brand px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-cs-ink cs-shadow-sm"
              style={{ transform: 'rotate(-2deg)' }}
            >
              Wanzami Original
            </span>

            <h1 className="font-heading uppercase tracking-wide leading-[0.85] text-cs-ink text-5xl sm:text-6xl md:text-7xl">
              {current.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.08em] text-cs-muted">
              <span className="border-[1.5px] border-cs-ink px-2 py-0.5 text-cs-ink">{current.rating}</span>
              <span>{current.year}</span>
              <span className="text-cs-line">•</span>
              <span>{current.genre}</span>
            </div>

            <p className="max-w-xl text-[15px] leading-relaxed text-cs-ink/80 line-clamp-3">
              {current.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={() => onPlayClick(current)}
                className="inline-flex items-center justify-center gap-2 min-h-[52px] bg-cs-rust text-cs-paper px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.07em] cs-shadow transition-transform hover:-translate-y-0.5 active:translate-y-px"
              >
                <Play className="w-5 h-5 fill-current" />
                {current.isPpv ? 'Buy Now' : 'Play Now'}
              </button>

              <button
                onClick={() => (onMoreInfoClick ?? onPlayClick)(current)}
                className="inline-flex items-center justify-center gap-2 min-h-[52px] bg-cs-paper text-cs-ink cs-border px-8 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.07em] transition-colors hover:bg-cs-ink hover:text-cs-paper"
              >
                <Info className="w-5 h-5" />
                More Info
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Featured one-sheet — framed art */}
        <div className="order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="relative cs-border cs-shadow-lg bg-cs-ink overflow-hidden aspect-[16/10]"
            >
              <ImageWithFallback
                src={current.image}
                alt={current.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute left-3 top-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cs-paper bg-cs-ink/70 px-2 py-1">
                Reel 01
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Carousel indicators */}
          <div className="mt-4 flex justify-center lg:justify-end gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
                className={`h-2 transition-all duration-300 ${
                  index === currentIndex ? 'w-10 bg-cs-rust' : 'w-6 bg-cs-line hover:bg-cs-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
