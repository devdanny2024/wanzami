import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MessageSquare, X, Send, Users, Settings, Maximize } from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { FocusableButton } from "../components/FocusableButton";
import { liveEvents } from "../data/mockContent";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

const mockChatMessages: ChatMessage[] = [
  { id: "1", user: "Kwame_GH", message: "This is amazing! 🔥", timestamp: "2m ago" },
  { id: "2", user: "Amara_NG", message: "Can't believe this is happening live!", timestamp: "2m ago" },
  { id: "3", user: "TendaiZW", message: "Best performance of the night", timestamp: "1m ago" },
  { id: "4", user: "Zola_SA", message: "Who else is watching from South Africa? 🇿🇦", timestamp: "1m ago" },
  { id: "5", user: "FatouSN", message: "Absolutely incredible 💯", timestamp: "45s ago" },
  { id: "6", user: "KofiAccra", message: "This needs to be a full album!", timestamp: "30s ago" },
  { id: "7", user: "Nia_KE", message: "I've been waiting all week for this", timestamp: "20s ago" },
  { id: "8", user: "ChimaNG", message: "Best streaming platform in Africa 🌍", timestamp: "10s ago" },
];

export function LivePlayer() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { isTv, isPortrait, isLandscape } = useDevice();
  const [showChat, setShowChat] = useState(!isTv);
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [newMessage, setNewMessage] = useState("");
  const [showControls, setShowControls] = useState(true);

  const event = liveEvents.find(e => e.id === eventId);

  useEffect(() => {
    // Simulate new chat messages
    const interval = setInterval(() => {
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        user: ["Kwame", "Amara", "Tendai", "Zola", "Fatou"][Math.floor(Math.random() * 5)],
        message: ["Amazing!", "Love this", "Incredible", "Best show ever", "🔥🔥🔥"][Math.floor(Math.random() * 5)],
        timestamp: "Just now"
      };
      setChatMessages(prev => [...prev.slice(-20), newMsg]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto-hide controls on TV
  useEffect(() => {
    if (!isTv) return;
    
    const timer = setTimeout(() => setShowControls(false), 3000);
    const handleMove = () => {
      setShowControls(true);
      clearTimeout(timer);
    };

    window.addEventListener("mousemove", handleMove);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      clearTimeout(timer);
    };
  }, [isTv, showControls]);

  if (!event) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0A0F]">
        <p className="text-white text-xl">Event not found</p>
      </div>
    );
  }

  // TV Layout: Full screen with toggle chat
  if (isTv) {
    return (
      <div className="h-screen w-screen bg-black relative">
        {/* Video Player */}
        <div className="w-full h-full relative">
          <img
            src={event.thumbnail}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          
          {/* Live Indicator */}
          <div className="absolute top-8 left-8 flex items-center gap-4 px-6 py-3 bg-[#E63946] rounded-xl">
            <span className="w-4 h-4 rounded-full bg-white animate-pulse"></span>
            <span className="text-white font-bold text-2xl">LIVE</span>
          </div>

          {/* Viewers Count */}
          <div className="absolute top-8 right-8 flex items-center gap-3 px-6 py-3 bg-black/70 backdrop-blur-sm rounded-xl">
            <Users className="w-6 h-6 text-white" />
            <span className="text-white font-semibold text-xl">
              {event.viewers?.toLocaleString() || "0"}
            </span>
          </div>

          {/* Controls Overlay */}
          {showControls && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50">
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between">
                <FocusableButton
                  id="live-back"
                  onClick={() => navigate("/live")}
                  autoFocus
                  className="flex items-center gap-3 text-white hover:text-white/80"
                >
                  <ArrowLeft className="w-8 h-8" />
                  <span className="text-2xl font-semibold">Back</span>
                </FocusableButton>

                <div className="flex gap-4">
                  <FocusableButton
                    id="live-toggle-chat"
                    onClick={() => setShowChat(!showChat)}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white flex items-center gap-3"
                  >
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-xl">{showChat ? "Hide" : "Show"} Chat</span>
                  </FocusableButton>

                  <FocusableButton
                    id="live-settings"
                    onClick={() => {}}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white"
                  >
                    <Settings className="w-6 h-6" />
                  </FocusableButton>
                </div>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h2 className="text-white text-4xl font-bold mb-2">{event.title}</h2>
                <p className="text-white/80 text-xl">{event.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar (TV) */}
        {showChat && (
          <div className="absolute top-0 right-0 w-[500px] h-full bg-[#0F0F14]/95 backdrop-blur-md border-l border-white/10">
            <LiveChat
              messages={chatMessages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSend={() => {
                if (newMessage.trim()) {
                  setChatMessages([...chatMessages, {
                    id: Date.now().toString(),
                    user: "You",
                    message: newMessage,
                    timestamp: "Just now"
                  }]);
                  setNewMessage("");
                }
              }}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}
      </div>
    );
  }

  // Tablet Layout
  return (
    <div className="h-screen w-screen bg-[#0A0A0F] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button
          onClick={() => navigate("/live")}
          className="flex items-center gap-2 text-white hover:text-white/80"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-semibold">Back</span>
        </button>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-[#E63946] rounded-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
          <span className="text-white font-bold">LIVE</span>
        </div>
      </div>

      {/* Content */}
      {isLandscape ? (
        // Landscape: Side by side
        <div className="flex-1 flex overflow-hidden">
          {/* Video */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <img
              src={event.thumbnail}
              alt={event.title}
              className="w-full h-full object-contain"
            />
            
            {/* Viewers */}
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">
                {event.viewers?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Chat */}
          <div className="w-[380px] border-l border-white/10">
            <LiveChat
              messages={chatMessages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSend={() => {
                if (newMessage.trim()) {
                  setChatMessages([...chatMessages, {
                    id: Date.now().toString(),
                    user: "You",
                    message: newMessage,
                    timestamp: "Just now"
                  }]);
                  setNewMessage("");
                }
              }}
            />
          </div>
        </div>
      ) : (
        // Portrait: Stacked
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video */}
          <div className="h-[350px] bg-black flex items-center justify-center relative flex-shrink-0">
            <img
              src={event.thumbnail}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">
                {event.viewers?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Event Info */}
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-white text-xl font-bold mb-1">{event.title}</h2>
            <p className="text-white/70 text-sm">{event.description}</p>
          </div>

          {/* Chat */}
          <div className="flex-1">
            <LiveChat
              messages={chatMessages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              onSend={() => {
                if (newMessage.trim()) {
                  setChatMessages([...chatMessages, {
                    id: Date.now().toString(),
                    user: "You",
                    message: newMessage,
                    timestamp: "Just now"
                  }]);
                  setNewMessage("");
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface LiveChatProps {
  messages: ChatMessage[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onSend: () => void;
  onClose?: () => void;
}

function LiveChat({ messages, newMessage, setNewMessage, onSend, onClose }: LiveChatProps) {
  const { isTv } = useDevice();

  return (
    <div className="h-full flex flex-col bg-[#0F0F14]">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className={`${isTv ? "w-7 h-7" : "w-6 h-6"} text-white`} />
          <h3 className={`text-white font-semibold ${isTv ? "text-2xl" : "text-lg"}`}>Live Chat</h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="group">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`font-semibold text-[#F4A261] ${isTv ? "text-lg" : "text-sm"}`}>
                {msg.user}
              </span>
              <span className={`text-white/40 ${isTv ? "text-base" : "text-xs"}`}>
                {msg.timestamp}
              </span>
            </div>
            <p className={`text-white/90 ${isTv ? "text-xl" : "text-sm"}`}>{msg.message}</p>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSend()}
            placeholder="Send a message..."
            className={`
              flex-1 bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3
              text-white placeholder:text-white/40 focus:outline-none focus:border-[#E63946]
              ${isTv ? "text-xl" : "text-sm"}
            `}
          />
          <button
            onClick={onSend}
            className={`
              bg-[#E63946] hover:bg-[#D62839] rounded-lg text-white
              flex items-center justify-center transition-colors
              ${isTv ? "px-6" : "px-4"}
            `}
          >
            <Send className={isTv ? "w-6 h-6" : "w-5 h-5"} />
          </button>
        </div>
      </div>
    </div>
  );
}
