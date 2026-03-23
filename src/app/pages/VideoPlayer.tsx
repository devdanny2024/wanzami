import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  ArrowLeft, Play, Pause, Volume2, VolumeX, Settings, 
  Maximize, Minimize, SkipBack, SkipForward, Subtitles 
} from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { FocusableButton } from "../components/FocusableButton";
import { allContent } from "../data/mockContent";

export function VideoPlayer() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { isTv, isTablet } = useDevice();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(125); // seconds
  const [duration] = useState(7245); // total seconds
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState("1080p");
  const [subtitles, setSubtitles] = useState("English");
  const [audioTrack, setAudioTrack] = useState("English");

  const content = allContent.find(c => c.id === contentId);

  useEffect(() => {
    // Simulate playback
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentTime(prev => Math.min(prev + 1, duration));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isPlaying, duration]);

  // Auto-hide controls
  useEffect(() => {
    if (!showControls || showSettings) return;
    
    const timer = setTimeout(() => setShowControls(false), 3000);
    const handleMove = () => {
      setShowControls(true);
      clearTimeout(timer);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("keydown", handleMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("keydown", handleMove);
      clearTimeout(timer);
    };
  }, [showControls, showSettings]);

  if (!content) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0A0A0F]">
        <p className="text-white text-xl">Content not found</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / duration) * 100;

  return (
    <div className="h-screen w-screen bg-black relative">
      {/* Video */}
      <div className="w-full h-full">
        <img
          src={content.thumbnail}
          alt={content.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/50">
          {/* Top Bar */}
          <div className={`absolute top-0 left-0 right-0 ${isTv ? "p-8" : "p-6"} flex items-center justify-between`}>
            <FocusableButton
              id="player-back"
              onClick={() => navigate(-1)}
              autoFocus
              className="flex items-center gap-3 text-white hover:text-white/80"
            >
              <ArrowLeft className={isTv ? "w-8 h-8" : "w-6 h-6"} />
              <div>
                <div className={`font-semibold ${isTv ? "text-2xl" : "text-base"}`}>
                  {content.title}
                </div>
                {content.type === "series" && (
                  <div className={`text-white/70 ${isTv ? "text-lg" : "text-sm"}`}>
                    Season 1 • Episode 1
                  </div>
                )}
              </div>
            </FocusableButton>

            <div className="flex gap-3">
              <FocusableButton
                id="player-subtitles"
                onClick={() => {}}
                className={`${isTv ? "p-4" : "p-3"} bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white`}
              >
                <Subtitles className={isTv ? "w-7 h-7" : "w-6 h-6"} />
              </FocusableButton>

              <FocusableButton
                id="player-settings-btn"
                onClick={() => setShowSettings(!showSettings)}
                className={`${isTv ? "p-4" : "p-3"} bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white`}
              >
                <Settings className={isTv ? "w-7 h-7" : "w-6 h-6"} />
              </FocusableButton>
            </div>
          </div>

          {/* Center Play/Pause */}
          <div className="absolute inset-0 flex items-center justify-center">
            <FocusableButton
              id="player-playpause"
              onClick={() => setIsPlaying(!isPlaying)}
              className={`
                ${isTv ? "w-28 h-28" : "w-20 h-20"} 
                rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm 
                flex items-center justify-center transition-all
                ${isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"}
              `}
            >
              {isPlaying ? (
                <Pause className={`${isTv ? "w-14 h-14" : "w-10 h-10"} text-white fill-white`} />
              ) : (
                <Play className={`${isTv ? "w-14 h-14" : "w-10 h-10"} text-white fill-white ml-2`} />
              )}
            </FocusableButton>
          </div>

          {/* Bottom Controls */}
          <div className={`absolute bottom-0 left-0 right-0 ${isTv ? "p-8" : "p-6"}`}>
            {/* Progress Bar */}
            <div className="mb-6">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E63946]
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#E63946] [&::-moz-range-thumb]:border-0"
                style={{
                  background: `linear-gradient(to right, #E63946 ${progress}%, rgba(255,255,255,0.2) ${progress}%)`
                }}
              />
              <div className={`flex justify-between mt-2 ${isTv ? "text-xl" : "text-sm"} text-white/80`}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FocusableButton
                  id="player-play"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`${isTv ? "p-4" : "p-3"} hover:bg-white/10 rounded-xl text-white`}
                >
                  {isPlaying ? (
                    <Pause className={`${isTv ? "w-8 h-8" : "w-6 h-6"} fill-white`} />
                  ) : (
                    <Play className={`${isTv ? "w-8 h-8" : "w-6 h-6"} fill-white`} />
                  )}
                </FocusableButton>

                {isTv && (
                  <>
                    <FocusableButton
                      id="player-rewind"
                      onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                      className="p-4 hover:bg-white/10 rounded-xl text-white"
                    >
                      <SkipBack className="w-8 h-8" />
                    </FocusableButton>

                    <FocusableButton
                      id="player-forward"
                      onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                      className="p-4 hover:bg-white/10 rounded-xl text-white"
                    >
                      <SkipForward className="w-8 h-8" />
                    </FocusableButton>
                  </>
                )}

                <FocusableButton
                  id="player-volume"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`${isTv ? "p-4" : "p-3"} hover:bg-white/10 rounded-xl text-white`}
                >
                  {isMuted ? (
                    <VolumeX className={isTv ? "w-8 h-8" : "w-6 h-6"} />
                  ) : (
                    <Volume2 className={isTv ? "w-8 h-8" : "w-6 h-6"} />
                  )}
                </FocusableButton>

                {!isTv && (
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="80"
                    className="w-24 h-1 bg-white/20 rounded-full appearance-none
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                )}
              </div>

              <FocusableButton
                id="player-fullscreen"
                onClick={() => {}}
                className={`${isTv ? "p-4" : "p-3"} hover:bg-white/10 rounded-xl text-white`}
              >
                <Maximize className={isTv ? "w-8 h-8" : "w-6 h-6"} />
              </FocusableButton>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className={`
          absolute ${isTv ? "top-24 right-8 w-[400px]" : "top-20 right-6 w-[320px]"}
          bg-[#0F0F14]/95 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden
        `}>
          <div className={`${isTv ? "p-6" : "p-4"}`}>
            <h3 className={`text-white font-semibold mb-4 ${isTv ? "text-2xl" : "text-lg"}`}>
              Playback Settings
            </h3>

            <div className="space-y-4">
              {/* Quality */}
              <div>
                <label className={`text-white/70 block mb-2 ${isTv ? "text-lg" : "text-sm"}`}>
                  Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className={`
                    w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3
                    text-white focus:outline-none focus:border-[#E63946]
                    ${isTv ? "text-xl" : "text-base"}
                  `}
                >
                  <option value="auto">Auto</option>
                  <option value="2160p">4K (2160p)</option>
                  <option value="1080p">Full HD (1080p)</option>
                  <option value="720p">HD (720p)</option>
                  <option value="480p">SD (480p)</option>
                </select>
              </div>

              {/* Subtitles */}
              <div>
                <label className={`text-white/70 block mb-2 ${isTv ? "text-lg" : "text-sm"}`}>
                  Subtitles
                </label>
                <select
                  value={subtitles}
                  onChange={(e) => setSubtitles(e.target.value)}
                  className={`
                    w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3
                    text-white focus:outline-none focus:border-[#E63946]
                    ${isTv ? "text-xl" : "text-base"}
                  `}
                >
                  <option value="Off">Off</option>
                  <option value="English">English</option>
                  <option value="French">Français</option>
                  <option value="Swahili">Kiswahili</option>
                  <option value="Yoruba">Yoruba</option>
                  <option value="Zulu">isiZulu</option>
                </select>
              </div>

              {/* Audio Track */}
              <div>
                <label className={`text-white/70 block mb-2 ${isTv ? "text-lg" : "text-sm"}`}>
                  Audio Track
                </label>
                <select
                  value={audioTrack}
                  onChange={(e) => setAudioTrack(e.target.value)}
                  className={`
                    w-full bg-[#0A0A0F] border border-white/10 rounded-lg px-4 py-3
                    text-white focus:outline-none focus:border-[#E63946]
                    ${isTv ? "text-xl" : "text-base"}
                  `}
                >
                  <option value="English">English</option>
                  <option value="French">Français</option>
                  <option value="Original">Original</option>
                </select>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className={`
                  w-full bg-[#E63946] hover:bg-[#D62839] text-white rounded-lg
                  font-semibold transition-colors
                  ${isTv ? "py-4 text-xl" : "py-3 text-base"}
                `}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
