import { TopAppBar } from "../components/TopAppBar";
import { LiveStreamCard } from "../components/LiveStreamCard";
import { CategoryRow } from "../components/CategoryRow";
import { motion } from "motion/react";
import { Radio } from "lucide-react";
import { liveStreams } from "../data/mockData";

interface LiveScreenProps {
  onSearchClick: () => void;
  onLiveStreamClick: (id: string) => void;
}

export function LiveScreen({ onSearchClick, onLiveStreamClick }: LiveScreenProps) {
  const liveNow = liveStreams.filter(s => s.isLive);
  const upcoming = liveStreams.filter(s => !s.isLive);

  return (
    <div className="min-h-screen bg-[#0B0B0F] pb-24">
      <TopAppBar onSearchClick={onSearchClick} showLogo={false} />
      
      {/* Header with animated pulse */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-3 h-3 rounded-full bg-[#E50914]"
          />
          <h1 className="text-3xl font-bold text-white">Live</h1>
        </div>
        <p className="text-[#A1A1AA]">Watch premieres, events and exclusive content live</p>
      </div>
      
      {/* Live Now - Featured */}
      {liveNow.length > 0 && (
        <>
          <div className="px-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-5 h-5 text-[#E50914]" />
              <h2 className="text-white text-xl font-bold">Live Now</h2>
              <span className="text-[#A1A1AA] text-sm">
                {liveNow.reduce((sum, s) => sum + s.viewerCount, 0).toLocaleString()} watching
              </span>
            </div>
            
            {/* Featured live stream */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl overflow-hidden bg-[#14141B] mb-6 cursor-pointer"
              onClick={() => onLiveStreamClick(liveNow[0].id)}
            >
              <div className="relative aspect-video">
                <img
                  src={liveNow[0].thumbnail}
                  alt={liveNow[0].title}
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Live badge */}
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-4 left-4 bg-[#E50914] text-white px-4 py-2 rounded-full font-bold uppercase flex items-center gap-2"
                >
                  <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  Live
                </motion.div>
                
                {/* Viewer count */}
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-full font-semibold flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  {liveNow[0].viewerCount.toLocaleString()} watching
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="inline-block bg-[#FFB020] text-[#0B0B0F] px-3 py-1 rounded-full text-sm font-bold mb-3">
                    {liveNow[0].category}
                  </div>
                  <h2 className="text-white text-2xl font-bold mb-2">{liveNow[0].title}</h2>
                  <p className="text-white/90 mb-4">{liveNow[0].hostName}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#E50914] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#F40612] transition-colors"
                  >
                    Watch Now
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Other live streams */}
          {liveNow.length > 1 && (
            <CategoryRow title="More Live Events">
              {liveNow.slice(1).map((stream) => (
                <LiveStreamCard 
                  key={stream.id} 
                  stream={stream}
                  onClick={() => onLiveStreamClick(stream.id)}
                />
              ))}
            </CategoryRow>
          )}
        </>
      )}
      
      {/* Upcoming Premieres */}
      {upcoming.length > 0 && (
        <div className="mt-8">
          <CategoryRow title="Upcoming Premieres">
            {upcoming.map((stream) => (
              <LiveStreamCard 
                key={stream.id} 
                stream={stream}
                onClick={() => onLiveStreamClick(stream.id)}
              />
            ))}
          </CategoryRow>
        </div>
      )}
      
      {/* Watch Parties Section */}
      <div className="mt-8 px-6">
        <h2 className="text-white text-xl font-bold mb-4">Popular Watch Parties</h2>
        <div className="grid grid-cols-2 gap-3">
          {liveStreams.filter(s => s.category === "Watch Party").map((stream) => (
            <motion.div
              key={stream.id}
              whileHover={{ scale: 1.02 }}
              className="bg-[#14141B] rounded-xl overflow-hidden cursor-pointer"
              onClick={() => onLiveStreamClick(stream.id)}
            >
              <div className="relative aspect-video">
                <img
                  src={stream.thumbnail}
                  alt={stream.title}
                  className="w-full h-full object-cover"
                />
                {stream.isLive && (
                  <div className="absolute top-2 left-2 bg-[#E50914] text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-white text-sm font-semibold line-clamp-2">{stream.title}</h3>
                <p className="text-[#A1A1AA] text-xs mt-1">{stream.hostName}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
