import { motion } from 'motion/react';
import { Clock, Star, Trash2, AlertCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { MovieData } from './MovieCard';

interface DashboardProps {
  onMovieClick: (movie: MovieData) => void;
}

const continueWatching: Array<MovieData & { progress: number }> = [];

// Purchased PPV Movies with expiry
const purchasedPPV: Array<MovieData & { expiresIn: string; isExpiringSoon: boolean; price: number }> = [];

// Owned Movies (Purchased permanently)
const ownedMovies: Array<MovieData & { purchaseDate: string; buyPrice: number }> = [];

const myList: MovieData[] = [];

const recentlyAdded: MovieData[] = [];

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
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
