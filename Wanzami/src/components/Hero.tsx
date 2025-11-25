import { useState, useEffect } from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HeroContent {
  id: number;
  title: string;
  description: string;
  image: string;
  rating: string;
  year: string;
  genre: string;
}

const heroContent: HeroContent[] = [
  {
    id: 1,
    title: "King of Boys",
    description: "When a powerful businesswoman's political ambitions are threatened, she must navigate the dangerous underworld of Lagos politics and organized crime.",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    year: "2024",
    genre: "Crime Drama"
  },
  {
    id: 2,
    title: "Lagos Nights",
    description: "A gripping tale of love, betrayal, and redemption set against the vibrant backdrop of Nigeria's bustling capital city.",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    year: "2024",
    genre: "Romance Drama"
  },
  {
    id: 3,
    title: "Heritage",
    description: "An epic journey through generations, exploring the rich tapestry of African traditions and the modern challenges facing a family's legacy.",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    year: "2024",
    genre: "Family Drama"
  }
];

interface HeroProps {
  onPlayClick: (content: HeroContent) => void;
}

export function Hero({ onPlayClick }: HeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroContent.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const current = heroContent[currentIndex];

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
                  <span className="text-sm md:text-base">Play Now</span>
                </button>

                <button className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 md:px-8 py-3 md:py-4 rounded-xl backdrop-blur-md border border-white/20 transition-all duration-200">
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
        {heroContent.map((_, index) => (
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
