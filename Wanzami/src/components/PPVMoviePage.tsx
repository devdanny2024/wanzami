import { useState } from 'react';
import { Play, X, Clock, Shield, Monitor, RefreshCw, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { PPVMovieData } from './PPVMovieCard';

interface PPVMoviePageProps {
  movie: PPVMovieData & { description?: string; year?: string };
  onClose: () => void;
  onRent: (movie: PPVMovieData) => void;
  onBuy?: (movie: PPVMovieData) => void;
  isPurchased?: boolean;
  isOwned?: boolean;
  timeRemaining?: string;
}

export function PPVMoviePage({ 
  movie, 
  onClose, 
  onRent, 
  onBuy,
  isPurchased = false, 
  isOwned = false,
  timeRemaining 
}: PPVMoviePageProps) {
  const [showTrailer, setShowTrailer] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black overflow-y-auto"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-50 w-10 h-10 bg-black/80 hover:bg-black rounded-full flex items-center justify-center text-white backdrop-blur-sm border border-white/20"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Hero banner */}
      <div className="relative h-[70vh] md:h-[85vh]">
        <ImageWithFallback
          src={movie.image}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end pb-12 md:pb-16 px-4 md:px-12 lg:px-16">
          <div className="max-w-3xl space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#fd7e14]/20 border border-[#fd7e14] rounded-md backdrop-blur-sm mb-4">
                <Clock className="w-4 h-4 text-[#fd7e14]" />
                <span className="text-[#fd7e14] text-xs md:text-sm tracking-wider">
                  PAY-PER-VIEW {movie.isPremiere && '• PREMIERE'}
                </span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-4xl md:text-6xl lg:text-7xl tracking-tight"
            >
              {movie.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 text-sm md:text-base"
            >
              <span className="text-[#fd7e14] border border-[#fd7e14] px-2 py-0.5 rounded text-xs">
                {movie.rating || "16+"}
              </span>
              <span className="text-gray-300">{movie.year || "2024"}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">{movie.duration || "2h 15m"}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-300">{movie.genre || "Drama"}</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-300 text-sm md:text-lg max-w-2xl"
            >
              {movie.description || "An exclusive premiere on Wanzami. Experience premium Nigerian cinema from the comfort of your home."}
            </motion.p>

            {/* Owned status */}
            {isOwned && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-600 rounded-lg"
              >
                <ShoppingCart className="w-5 h-5 text-green-500" />
                <span className="text-green-400">You own this movie</span>
              </motion.div>
            )}

            {/* Purchased (rental) status */}
            {isPurchased && timeRemaining && !isOwned && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-600 rounded-lg"
              >
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-blue-400">Rental expires in {timeRemaining}</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Section */}
      <div className="px-4 md:px-12 lg:px-16 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
            {/* Purchase Box */}
            <div className="lg:col-span-2">
              {!isOwned ? (
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border-2 border-[#fd7e14]/30">
                  <h2 className="text-white text-2xl md:text-3xl mb-2">Get This Movie</h2>
                  <p className="text-gray-400 mb-6">Choose to rent or own it forever</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Rent Option */}
                    <div className="bg-black/40 border-2 border-gray-700 hover:border-[#fd7e14] rounded-xl p-5 transition-all group cursor-pointer">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-5 h-5 text-[#fd7e14]" />
                        <h3 className="text-white text-lg">Rent</h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">Watch for 48 hours</p>
                      <div className="flex items-end gap-2 mb-4">
                        <div className="text-3xl text-[#fd7e14]">
                          {movie.currency === 'NGN' ? '₦' : movie.currency === 'USDC' ? 'USDC ' : '$'}
                          {movie.price.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => onRent(movie)}
                        className="w-full flex items-center justify-center gap-2 bg-[#fd7e14]/20 hover:bg-[#fd7e14] text-[#fd7e14] hover:text-white px-4 py-3 rounded-lg transition-all border border-[#fd7e14]"
                      >
                        <span>Rent Now</span>
                      </button>
                    </div>

                    {/* Buy Option */}
                    {movie.buyPrice && (
                      <div className="bg-gradient-to-br from-[#fd7e14]/20 to-[#fd7e14]/5 border-2 border-[#fd7e14] rounded-xl p-5 relative overflow-hidden group cursor-pointer">
                        <div className="absolute top-2 right-2 bg-[#fd7e14] text-white text-xs px-2 py-1 rounded">
                          BEST VALUE
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <ShoppingCart className="w-5 h-5 text-[#fd7e14]" />
                          <h3 className="text-white text-lg">Buy</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">Own it forever</p>
                        <div className="flex items-end gap-2 mb-4">
                          <div className="text-3xl text-white">
                            {movie.currency === 'NGN' ? '₦' : movie.currency === 'USDC' ? 'USDC ' : '$'}
                            {movie.buyPrice.toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => onBuy && onBuy(movie)}
                          className="w-full flex items-center justify-center gap-2 bg-[#fd7e14] hover:bg-[#e86f0f] text-white px-4 py-3 rounded-lg transition-all"
                        >
                          <span>Buy Now</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowTrailer(!showTrailer)}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl backdrop-blur-md border border-white/20 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                    <span>Watch Trailer</span>
                  </button>

                  <div className="text-xs text-gray-500 mt-4">
                    By purchasing, you agree to our Terms of Service and Refund Policy
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-900/30 to-gray-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border-2 border-green-600/30">
                  <h2 className="text-white text-2xl md:text-3xl mb-4">Ready to Watch</h2>
                  <p className="text-gray-400 mb-6">You own this movie - watch anytime</p>

                  <button
                    onClick={() => alert('Starting playback...')}
                    className="w-full flex items-center justify-center gap-2 bg-[#fd7e14] hover:bg-[#e86f0f] text-white px-6 py-4 rounded-xl transition-all duration-200 hover:scale-105 mb-4"
                  >
                    <Play className="w-6 h-6 fill-current" />
                    <span className="text-lg">Play Now</span>
                  </button>

                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Watch unlimited times</span>
                  </div>
                </div>
              )}
            </div>

            {/* Before You Pay Info */}
            <div className="space-y-4">
              <h3 className="text-white text-xl mb-4">What You Get</h3>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
                <div className="flex items-start gap-3 mb-2">
                  <Monitor className="w-5 h-5 text-[#fd7e14] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Playback Quality</h4>
                    <p className="text-gray-400 text-sm">Up to 4K Ultra HD where available</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
                <div className="flex items-start gap-3 mb-2">
                  <Clock className="w-5 h-5 text-[#fd7e14] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Access Period</h4>
                    <p className="text-gray-400 text-sm">
                      Rental: 48 hours from purchase<br/>
                      {movie.buyPrice && 'Purchase: Lifetime access'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
                <div className="flex items-start gap-3 mb-2">
                  <RefreshCw className="w-5 h-5 text-[#fd7e14] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Refund Policy</h4>
                    <p className="text-gray-400 text-sm">Refunds available within 30 minutes if not started</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-gray-800">
                <div className="flex items-start gap-3 mb-2">
                  <Shield className="w-5 h-5 text-[#fd7e14] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-white mb-1">Device Support</h4>
                    <p className="text-gray-400 text-sm">Watch on up to 3 devices simultaneously</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}