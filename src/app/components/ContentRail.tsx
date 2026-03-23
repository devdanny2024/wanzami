import { useRef } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Play, Clock, Users } from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { FocusableButton } from "./FocusableButton";
import { Content, LiveEvent } from "../data/mockContent";

interface ContentRailProps {
  title: string;
  items: Content[];
  showProgress?: boolean;
  isLive?: boolean;
}

export function ContentRail({ title, items, showProgress, isLive }: ContentRailProps) {
  const navigate = useNavigate();
  const { isTv, isPortrait } = useDevice();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = isTv ? 1200 : 800;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleItemClick = (item: Content) => {
    if (item.type === "live") {
      navigate(`/live/${item.id}`);
    } else {
      navigate(`/watch/${item.id}`);
    }
  };

  const cardWidth = isTv ? "w-[380px]" : isPortrait ? "w-[280px]" : "w-[320px]";
  const cardHeight = isTv ? "h-[214px]" : isPortrait ? "h-[158px]" : "h-[180px]";

  return (
    <div className="relative group">
      {/* Rail Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-white font-semibold ${isTv ? "text-3xl" : "text-2xl"}`}>
          {title}
        </h2>
        
        {!isPortrait && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-sm"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-sm"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Rail Content */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item, index) => (
          <ContentCard
            key={item.id}
            item={item}
            index={index}
            onClick={() => handleItemClick(item)}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            showProgress={showProgress}
            isLive={isLive}
          />
        ))}
      </div>
    </div>
  );
}

interface ContentCardProps {
  item: Content;
  index: number;
  onClick: () => void;
  cardWidth: string;
  cardHeight: string;
  showProgress?: boolean;
  isLive?: boolean;
}

function ContentCard({ item, index, onClick, cardWidth, cardHeight, showProgress, isLive }: ContentCardProps) {
  const { isTv } = useDevice();
  const liveEvent = isLive ? (item as LiveEvent) : null;

  return (
    <FocusableButton
      id={`content-${item.id}-${index}`}
      onClick={onClick}
      className={`${cardWidth} flex-shrink-0 group/card relative`}
    >
      {/* Thumbnail */}
      <div className={`${cardHeight} rounded-lg overflow-hidden relative mb-3`}>
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity">
          <div className={`${isTv ? "w-20 h-20" : "w-16 h-16"} rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center`}>
            <Play className={`${isTv ? "w-10 h-10" : "w-8 h-8"} fill-black text-black ml-1`} />
          </div>
        </div>

        {/* Live Badge */}
        {liveEvent?.isLive && (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-[#E63946] rounded-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="text-white text-sm font-semibold">LIVE</span>
          </div>
        )}

        {/* Viewers Count */}
        {liveEvent?.isLive && liveEvent.viewers && (
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-md flex items-center gap-2">
            <Users className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">
              {liveEvent.viewers.toLocaleString()}
            </span>
          </div>
        )}

        {/* Progress Bar */}
        {showProgress && item.progress !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-[#E63946]"
              style={{ width: `${item.progress}%` }}
            ></div>
          </div>
        )}

        {/* Duration */}
        {item.duration && !isLive && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-sm rounded text-white text-xs font-semibold">
            {item.duration}
          </div>
        )}

        {/* Start Time (for upcoming live events) */}
        {liveEvent && !liveEvent.isLive && liveEvent.startTime && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-sm rounded flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-semibold">{liveEvent.startTime}</span>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className={`text-white font-medium mb-1 line-clamp-1 ${isTv ? "text-xl" : "text-base"}`}>
        {item.title}
      </h3>

      {/* Metadata */}
      <div className="flex items-center gap-2 text-white/60 text-sm">
        {item.year && <span>{item.year}</span>}
        {item.genre && item.genre.length > 0 && (
          <>
            {item.year && <span className="w-1 h-1 rounded-full bg-white/40"></span>}
            <span>{item.genre[0]}</span>
          </>
        )}
      </div>
    </FocusableButton>
  );
}
