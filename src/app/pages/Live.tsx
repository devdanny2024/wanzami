import { useNavigate } from "react-router";
import { Users, Clock, Play } from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { FocusableButton } from "../components/FocusableButton";
import { liveEvents, LiveEvent } from "../data/mockContent";

export function Live() {
  const navigate = useNavigate();
  const { isTv, isPortrait } = useDevice();

  const liveNow = liveEvents.filter(e => e.isLive);
  const upcoming = liveEvents.filter(e => !e.isLive);
  const featured = liveNow[0] || upcoming[0];

  return (
    <div className="w-full">
      {/* Featured Live Event */}
      {featured && (
        <div className="relative">
          <div className={`relative ${isTv ? "h-[900px]" : isPortrait ? "h-[500px]" : "h-[650px]"}`}>
            <img
              src={featured.thumbnail}
              alt={featured.title}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/60 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F]/80 via-transparent to-transparent"></div>

            <div className={`absolute bottom-0 left-0 right-0 ${isTv ? "p-20" : isPortrait ? "p-8" : "p-12"}`}>
              <div className={`${isTv ? "max-w-3xl" : "max-w-2xl"}`}>
                {/* Live Badge */}
                {featured.isLive && (
                  <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-[#E63946] rounded-xl mb-6">
                    <span className="w-3 h-3 rounded-full bg-white animate-pulse"></span>
                    <span className={`text-white font-bold ${isTv ? "text-2xl" : "text-lg"}`}>LIVE NOW</span>
                  </div>
                )}

                {!featured.isLive && (
                  <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl mb-6 border border-white/20">
                    <Clock className="w-5 h-5 text-white" />
                    <span className={`text-white font-semibold ${isTv ? "text-xl" : "text-base"}`}>
                      Starts {featured.startTime}
                    </span>
                  </div>
                )}

                <h1 className={`text-white font-bold mb-4 ${isTv ? "text-7xl" : isPortrait ? "text-4xl" : "text-5xl"}`}>
                  {featured.title}
                </h1>

                {featured.isLive && featured.viewers && (
                  <div className="flex items-center gap-3 mb-6">
                    <Users className={isTv ? "w-8 h-8" : "w-6 h-6"} color="white" />
                    <span className={`text-white/90 ${isTv ? "text-2xl" : "text-xl"}`}>
                      {featured.viewers.toLocaleString()} watching now
                    </span>
                  </div>
                )}

                <p className={`text-white/90 mb-8 ${isTv ? "text-2xl leading-relaxed" : "text-lg"}`}>
                  {featured.description}
                </p>

                <FocusableButton
                  id="featured-live-play"
                  onClick={() => navigate(`/live/${featured.id}`)}
                  autoFocus
                  className={`
                    bg-white hover:bg-white/90 text-black font-semibold rounded-xl
                    flex items-center gap-3 transition-all
                    ${isTv ? "px-12 py-5 text-2xl" : "px-8 py-3.5 text-lg"}
                  `}
                >
                  <Play className={`fill-current ${isTv ? "w-8 h-8" : "w-6 h-6"}`} />
                  {featured.isLive ? "Watch Live" : "Set Reminder"}
                </FocusableButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Events Grid */}
      <div className={`${isTv ? "px-20 py-16" : isPortrait ? "px-6 py-8" : "px-12 py-12"}`}>
        {liveNow.length > 0 && (
          <div className="mb-16">
            <h2 className={`text-white font-semibold mb-8 ${isTv ? "text-4xl" : "text-3xl"}`}>
              Live Now
            </h2>
            <div className={`grid gap-6 ${
              isTv ? "grid-cols-3" : isPortrait ? "grid-cols-1" : "grid-cols-2"
            }`}>
              {liveNow.map((event, index) => (
                <LiveEventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <h2 className={`text-white font-semibold mb-8 ${isTv ? "text-4xl" : "text-3xl"}`}>
              Coming Up
            </h2>
            <div className={`grid gap-6 ${
              isTv ? "grid-cols-3" : isPortrait ? "grid-cols-1" : "grid-cols-2"
            }`}>
              {upcoming.map((event, index) => (
                <LiveEventCard key={event.id} event={event} index={index + liveNow.length} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveEventCard({ event, index }: { event: LiveEvent; index: number }) {
  const navigate = useNavigate();
  const { isTv } = useDevice();

  return (
    <FocusableButton
      id={`live-event-${event.id}-${index}`}
      onClick={() => navigate(`/live/${event.id}`)}
      className="group/card relative"
    >
      <div className={`${isTv ? "h-[300px]" : "h-[240px]"} rounded-xl overflow-hidden relative mb-4`}>
        <img
          src={event.thumbnail}
          alt={event.title}
          className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

        {/* Live Badge or Start Time */}
        {event.isLive ? (
          <div className="absolute top-4 left-4 px-4 py-2 bg-[#E63946] rounded-lg flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
            <span className={`text-white font-bold ${isTv ? "text-lg" : "text-sm"}`}>LIVE</span>
          </div>
        ) : (
          <div className="absolute top-4 left-4 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-white" />
            <span className={`text-white font-semibold ${isTv ? "text-base" : "text-sm"}`}>
              {event.startTime}
            </span>
          </div>
        )}

        {/* Viewers */}
        {event.isLive && event.viewers && (
          <div className="absolute top-4 right-4 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-white" />
            <span className={`text-white font-semibold ${isTv ? "text-base" : "text-sm"}`}>
              {event.viewers.toLocaleString()}
            </span>
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
          <div className={`${isTv ? "w-20 h-20" : "w-16 h-16"} rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center`}>
            <Play className={`${isTv ? "w-10 h-10" : "w-8 h-8"} fill-black text-black ml-1`} />
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
          <span className="text-white text-sm font-medium capitalize">{event.category}</span>
        </div>
      </div>

      <h3 className={`text-white font-semibold mb-2 line-clamp-2 ${isTv ? "text-2xl" : "text-lg"}`}>
        {event.title}
      </h3>
      
      <p className={`text-white/60 line-clamp-2 ${isTv ? "text-lg" : "text-sm"}`}>
        {event.description}
      </p>
    </FocusableButton>
  );
}
