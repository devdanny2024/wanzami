import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  MessageCircle,
  Gift,
  Eye,
  Radio,
  Send
} from "lucide-react";
import { liveStreams } from "../data/mockData";

interface LiveStreamPlayerScreenProps {
  streamId: string;
  onBack: () => void;
}

export function LiveStreamPlayerScreen({ streamId, onBack }: LiveStreamPlayerScreenProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  
  const stream = liveStreams.find(s => s.id === streamId);
  
  if (!stream) {
    return <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-white">Stream not found</div>;
  }
  
  const mockChatMessages = [
    { user: "Alex", message: "This is amazing! 🔥", time: "2m ago" },
    { user: "Sarah", message: "Can't wait for the premiere!", time: "3m ago" },
    { user: "Mike", message: "Love this show!", time: "5m ago" },
    { user: "Emma", message: "Best cast ever! 👏", time: "7m ago" },
    { user: "John", message: "When does it start?", time: "8m ago" }
  ];
  
  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      // In a real app, this would send to server
      setChatMessage("");
    }
  };

  return (
    <div className="relative min-h-screen bg-black">
      {/* Video player */}
      <div className="relative aspect-video bg-black">
        <img
          src={stream.thumbnail}
          alt={stream.title}
          className="w-full h-full object-cover"
        />
        
        {/* Video overlay controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80"
            >
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
                <div className="flex-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onBack}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center mb-3"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </motion.button>
                  
                  <div>
                    <h2 className="text-white font-bold text-lg mb-1">{stream.title}</h2>
                    <p className="text-white/80 text-sm">{stream.hostName}</p>
                  </div>
                </div>
                
                {/* Live indicator & viewer count */}
                <div className="flex flex-col items-end gap-2">
                  {stream.isLive && (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="bg-[#E50914] text-white px-3 py-1 rounded-full text-sm font-bold uppercase flex items-center gap-1.5"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Live
                    </motion.div>
                  )}
                  
                  <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    {stream.viewerCount.toLocaleString()}
                  </div>
                </div>
              </div>
              
              {/* Center play/pause */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white fill-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  )}
                </motion.button>
              </div>
              
              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsMuted(!isMuted)}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </motion.button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowChat(!showChat)}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center relative"
                    >
                      <MessageCircle className="w-5 h-5 text-white" />
                      {showChat && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#E50914] rounded-full" />
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Gift className="w-5 h-5 text-white" />
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Maximize className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Content below video */}
      <div className="bg-[#0B0B0F] px-6 py-6">
        {/* Stream info */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-5 h-5 text-[#E50914]" />
            <span className="text-[#A1A1AA] text-sm">
              {stream.isLive ? 'Live Now' : stream.scheduledTime}
            </span>
          </div>
          
          <h1 className="text-white text-2xl font-bold mb-2">{stream.title}</h1>
          <p className="text-white/80 mb-4">Hosted by {stream.hostName}</p>
          
          <div className="inline-block bg-[#FFB020] text-[#0B0B0F] px-3 py-1 rounded-full text-sm font-bold">
            {stream.category}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 bg-[#E50914] text-white py-3 rounded-full font-semibold"
          >
            Join Watch Party
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-[#14141B] border border-white/20 flex items-center justify-center"
          >
            <Gift className="w-5 h-5 text-white" />
          </motion.button>
        </div>
        
        {/* Stats */}
        <div className="bg-[#14141B] rounded-xl p-4 grid grid-cols-3 gap-4 text-center mb-6">
          <div>
            <div className="text-xl font-bold text-white">{stream.viewerCount.toLocaleString()}</div>
            <div className="text-[#A1A1AA] text-xs">Watching</div>
          </div>
          <div className="border-l border-r border-[#1C1C25]">
            <div className="text-xl font-bold text-white">2.4k</div>
            <div className="text-[#A1A1AA] text-xs">Likes</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white">856</div>
            <div className="text-[#A1A1AA] text-xs">Messages</div>
          </div>
        </div>
        
        {/* Live chat */}
        <div className="bg-[#14141B] rounded-xl overflow-hidden">
          <div className="bg-[#1C1C25] px-4 py-3 flex items-center justify-between border-b border-[#0B0B0F]">
            <h3 className="text-white font-semibold">Live Chat</h3>
            <span className="text-[#A1A1AA] text-sm">856 messages</span>
          </div>
          
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {mockChatMessages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-[#FFB020] text-sm font-semibold">{msg.user}</span>
                  <span className="text-[#6B7280] text-xs">{msg.time}</span>
                </div>
                <p className="text-white/90 text-sm">{msg.message}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="p-4 border-t border-[#1C1C25]">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Send a message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#0B0B0F] text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#E50914]"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleSendMessage}
                className="w-10 h-10 rounded-full bg-[#E50914] flex items-center justify-center"
              >
                <Send className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
