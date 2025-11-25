import { motion } from 'motion/react';
import { Clock, Star, Trash2, AlertCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MovieData } from './MovieCard';

interface DashboardProps {
  onMovieClick: (movie: MovieData) => void;
}

const continueWatching: Array<MovieData & { progress: number }> = [
  {
    id: 1,
    title: "King of Boys",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    duration: "2h 45m",
    progress: 68
  },
  {
    id: 2,
    title: "Lagos Hustle",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    duration: "1h 55m",
    progress: 42
  },
  {
    id: 3,
    title: "Heritage",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    duration: "2h 10m",
    progress: 15
  }
];

// Purchased PPV Movies with expiry
const purchasedPPV: Array<MovieData & { expiresIn: string; isExpiringSoon: boolean; price: number }> = [
  {
    id: 101,
    title: "The Governor",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    genre: "Political Thriller",
    expiresIn: "1 day 13 hours",
    isExpiringSoon: false,
    price: 3500
  },
  {
    id: 102,
    title: "Lagos Vice",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    genre: "Action",
    expiresIn: "5 hours",
    isExpiringSoon: true,
    price: 2800
  }
];

// Owned Movies (Purchased permanently)
const ownedMovies: Array<MovieData & { purchaseDate: string; buyPrice: number }> = [
  {
    id: 103,
    title: "Anikulapo: Rise of the Spectre",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    genre: "Fantasy",
    purchaseDate: "Nov 15, 2024",
    buyPrice: 7500
  },
  {
    id: 105,
    title: "Omo Ghetto: The Saga Continues",
    image: "https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwaGFwcHl8ZW58MXx8fHwxNzYzNzkyNjYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    genre: "Comedy",
    purchaseDate: "Nov 10, 2024",
    buyPrice: 5000
  }
];

const myList: MovieData[] = [
  {
    id: 4,
    title: "Family Ties",
    image: "https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwaGFwcHl8ZW58MXx8fHwxNzYzNzkyNjYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    genre: "Comedy"
  },
  {
    id: 5,
    title: "Rhythm & Soul",
    image: "https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGFuY2UlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjM3OTI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    genre: "Musical"
  },
  {
    id: 6,
    title: "City Lights",
    image: "https://images.unsplash.com/photo-1621276336795-925346853745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    genre: "Thriller"
  },
  {
    id: 7,
    title: "Heritage Keepers",
    image: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mzc5MjY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    genre: "Adventure"
  }
];

const recentlyAdded: MovieData[] = [
  {
    id: 8,
    title: "Power Play",
    image: "https://images.unsplash.com/photo-1761370980993-3ec8c23709fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMGNpbmVtYSUyMG1vdmllfGVufDF8fHx8MTc2Mzc5MjY2MXww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    genre: "Political Thriller"
  },
  {
    id: 9,
    title: "Dance Revolution",
    image: "https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGFuY2UlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjM3OTI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    genre: "Musical"
  },
  {
    id: 10,
    title: "Urban Tales",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    genre: "Drama"
  },
  {
    id: 11,
    title: "Ancestral Calling",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    genre: "Fantasy"
  }
];

export function Dashboard({ onMovieClick }: DashboardProps) {
  return (
    <div className="min-h-screen bg-black pt-24 md:pt-32 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 md:px-12 lg:px-16 mb-8 md:mb-12"
      >
        <h1 className="text-white text-3xl md:text-4xl mb-2">My Wanzami</h1>
        <p className="text-gray-400">Your personalized streaming experience</p>
      </motion.div>

      {/* Continue Watching */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between px-4 md:px-12 lg:px-16 mb-4">
          <h2 className="text-white text-xl md:text-2xl flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#fd7e14]" />
            Continue Watching
          </h2>
        </div>

        <div className="px-4 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {continueWatching.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="group cursor-pointer"
                onClick={() => onMovieClick(item)}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-3">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                    <motion.div
                      className="h-full bg-[#fd7e14]"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#fd7e14] flex items-center justify-center">
                      <div className="text-white text-2xl">▶</div>
                    </div>
                  </div>

                  {/* Border glow on hover */}
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[#fd7e14] transition-colors" />
                </div>

                <h3 className="text-white mb-1">{item.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{item.progress}% complete</span>
                  <span>•</span>
                  <span>{item.duration}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* My List */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between px-4 md:px-12 lg:px-16 mb-4">
          <h2 className="text-white text-xl md:text-2xl flex items-center gap-2">
            <Star className="w-6 h-6 text-[#fd7e14]" />
            My List
          </h2>
        </div>

        <div className="px-4 md:px-12 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {myList.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer relative"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-2">
                  <ImageWithFallback
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/80 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>

                  {/* Border glow */}
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[#fd7e14] transition-colors" />
                </div>

                <h3 className="text-white text-sm mb-1 line-clamp-1">{movie.title}</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#fd7e14] border border-[#fd7e14] px-1.5 py-0.5 rounded">
                    {movie.rating}
                  </span>
                  <span className="text-gray-400">{movie.genre}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Added */}
      <div>
        <div className="px-4 md:px-12 lg:px-16 mb-4">
          <h2 className="text-white text-xl md:text-2xl">Personalized Picks</h2>
        </div>

        <div className="px-4 md:px-12 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {recentlyAdded.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer"
                onClick={() => onMovieClick(movie)}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-2">
                  <ImageWithFallback
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* NEW badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-[#fd7e14] text-white text-xs rounded">
                    NEW
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Border glow */}
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[#fd7e14] transition-colors" />
                </div>

                <h3 className="text-white text-sm mb-1 line-clamp-1">{movie.title}</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#fd7e14] border border-[#fd7e14] px-1.5 py-0.5 rounded">
                    {movie.rating}
                  </span>
                  <span className="text-gray-400">{movie.genre}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchased PPV Movies */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between px-4 md:px-12 lg:px-16 mb-4">
          <h2 className="text-white text-xl md:text-2xl flex items-center gap-2">
            <Star className="w-6 h-6 text-[#fd7e14]" />
            Purchased PPV Movies
          </h2>
        </div>

        <div className="px-4 md:px-12 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {purchasedPPV.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer relative"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-2">
                  <ImageWithFallback
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/80 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>

                  {/* Border glow */}
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[#fd7e14] transition-colors" />
                </div>

                <h3 className="text-white text-sm mb-1 line-clamp-1">{movie.title}</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#fd7e14] border border-[#fd7e14] px-1.5 py-0.5 rounded">
                    {movie.rating}
                  </span>
                  <span className="text-gray-400">{movie.genre}</span>
                </div>

                {/* Expiry Info */}
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className={movie.isExpiringSoon ? "text-red-500" : "text-gray-400"}>
                    {movie.isExpiringSoon ? <AlertCircle className="w-4 h-4" /> : null}
                    Expires in {movie.expiresIn}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Owned Movies */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-center justify-between px-4 md:px-12 lg:px-16 mb-4">
          <h2 className="text-white text-xl md:text-2xl flex items-center gap-2">
            <Star className="w-6 h-6 text-[#fd7e14]" />
            Owned Movies
          </h2>
        </div>

        <div className="px-4 md:px-12 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {ownedMovies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                className="group cursor-pointer relative"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 mb-2">
                  <ImageWithFallback
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/80 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>

                  {/* Border glow */}
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[#fd7e14] transition-colors" />
                </div>

                <h3 className="text-white text-sm mb-1 line-clamp-1">{movie.title}</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#fd7e14] border border-[#fd7e14] px-1.5 py-0.5 rounded">
                    {movie.rating}
                  </span>
                  <span className="text-gray-400">{movie.genre}</span>
                </div>

                {/* Purchase Info */}
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="text-gray-400">
                    Purchased on {movie.purchaseDate}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}