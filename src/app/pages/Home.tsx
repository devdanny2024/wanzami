import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useDevice } from "../context/DeviceContext";
import { FocusableButton } from "../components/FocusableButton";
import { ContentRail } from "../components/ContentRail";
import { heroContent, continueWatching, trendingMovies, popularSeries, liveEvents } from "../data/mockContent";

export function Home() {
  const navigate = useNavigate();
  const { isTv, isPortrait } = useDevice();
  const [currentHero, setCurrentHero] = useState(0);

  // Auto-rotate hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroContent.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const hero = heroContent[currentHero];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="relative">
        {/* Hero Image */}
        <div className={`relative ${isTv ? "h-[900px]" : isPortrait ? "h-[600px]" : "h-[700px]"}`}>
          <img
            src={hero.thumbnail}
            alt={hero.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F]/80 via-transparent to-transparent"></div>

          {/* Hero Content */}
          <div className={`absolute bottom-0 left-0 right-0 ${isTv ? "p-20" : isPortrait ? "p-8" : "p-12"}`}>
            <div className={`${isTv ? "max-w-3xl" : isPortrait ? "max-w-lg" : "max-w-2xl"}`}>
              {/* Genre Pills */}
              <div className="flex gap-2 mb-4">
                {hero.genre.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <h1 className={`text-white font-bold mb-4 ${isTv ? "text-7xl" : isPortrait ? "text-4xl" : "text-5xl"}`}>
                {hero.title}
              </h1>

              <div className="flex items-center gap-4 mb-6 text-white/80">
                {hero.year && <span>{hero.year}</span>}
                {hero.rating && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/60"></span>
                    <span className="px-2 py-0.5 border border-white/40 rounded text-sm">{hero.rating}</span>
                  </>
                )}
                {hero.duration && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/60"></span>
                    <span>{hero.duration}</span>
                  </>
                )}
              </div>

              <p className={`text-white/90 mb-8 ${isTv ? "text-2xl leading-relaxed" : "text-lg"}`}>
                {hero.description}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <FocusableButton
                  id={`hero-play-${currentHero}`}
                  onClick={() => navigate(`/watch/${hero.id}`)}
                  className={`
                    bg-white hover:bg-white/90 text-black font-semibold rounded-xl
                    flex items-center gap-3 transition-all
                    ${isTv ? "px-12 py-5 text-2xl" : "px-8 py-3.5 text-lg"}
                  `}
                >
                  <Play className={`fill-current ${isTv ? "w-8 h-8" : "w-6 h-6"}`} />
                  Play
                </FocusableButton>

                <FocusableButton
                  id={`hero-info-${currentHero}`}
                  onClick={() => {}}
                  className={`
                    bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl
                    flex items-center gap-3 transition-all border border-white/20
                    ${isTv ? "px-12 py-5 text-2xl" : "px-8 py-3.5 text-lg"}
                  `}
                >
                  <Info className={isTv ? "w-8 h-8" : "w-6 h-6"} />
                  More Info
                </FocusableButton>
              </div>
            </div>

            {/* Hero Navigation Dots */}
            <div className="flex gap-2 mt-12">
              {heroContent.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentHero(index)}
                  className={`h-1 rounded-full transition-all ${
                    index === currentHero 
                      ? "w-12 bg-[#E63946]" 
                      : "w-8 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Rails */}
      <div className={`${isTv ? "px-20 pb-20 -mt-32" : isPortrait ? "px-6 pb-12 -mt-24" : "px-12 pb-16 -mt-28"}`}>
        <div className="relative z-10 space-y-12">
          <ContentRail title="Continue Watching" items={continueWatching} showProgress />
          <ContentRail title="Live Now" items={liveEvents.filter(e => e.isLive)} isLive />
          <ContentRail title="Trending Movies" items={trendingMovies} />
          <ContentRail title="Popular Series" items={popularSeries} />
          <ContentRail title="Coming Up" items={liveEvents.filter(e => !e.isLive)} />
        </div>
      </div>
    </div>
  );
}
