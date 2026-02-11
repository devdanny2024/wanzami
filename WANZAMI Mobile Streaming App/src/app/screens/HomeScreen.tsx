import { useState } from "react";
import { TopAppBar } from "../components/TopAppBar";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryRow } from "../components/CategoryRow";
import { MoviePosterCard } from "../components/MoviePosterCard";
import { ContinueWatchingCard } from "../components/ContinueWatchingCard";
import { LiveStreamCard } from "../components/LiveStreamCard";
import { movies, series, liveStreams } from "../data/mockData";

interface HomeScreenProps {
  onSearchClick: () => void;
  onMovieClick: (id: string) => void;
  onLiveStreamClick: (id: string) => void;
}

export function HomeScreen({ onSearchClick, onMovieClick, onLiveStreamClick }: HomeScreenProps) {
  const [currentHeroIndex] = useState(0);
  
  const heroMovie = movies.filter(m => m.trending)[currentHeroIndex] || movies[0];
  const continueWatching = [...movies, ...series].filter(item => item.progress && item.progress > 0);
  const trending = movies.filter(m => m.trending);
  const originals = movies.filter(m => m.isOriginal);
  const liveNow = liveStreams.filter(s => s.isLive);

  return (
    <div className="min-h-screen bg-[#0B0B0F] pb-24">
      <TopAppBar onSearchClick={onSearchClick} />
      
      {/* Hero Banner */}
      <div className="px-6 mb-8">
        <HeroBanner 
          movie={heroMovie}
          onPlay={() => onMovieClick(heroMovie.id)}
          onInfo={() => onMovieClick(heroMovie.id)}
        />
      </div>
      
      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <CategoryRow title="Continue Watching">
          {continueWatching.map((item) => (
            <ContinueWatchingCard 
              key={item.id} 
              item={item}
              onClick={() => onMovieClick(item.id)}
            />
          ))}
        </CategoryRow>
      )}
      
      {/* Live Events Happening Now */}
      {liveNow.length > 0 && (
        <CategoryRow title="🔴 Live Events Happening Now">
          {liveNow.map((stream) => (
            <LiveStreamCard 
              key={stream.id} 
              stream={stream}
              onClick={() => onLiveStreamClick(stream.id)}
            />
          ))}
        </CategoryRow>
      )}
      
      {/* Trending in Nigeria */}
      <CategoryRow title="Trending in Nigeria">
        {trending.map((movie) => (
          <MoviePosterCard 
            key={movie.id} 
            item={movie}
            onClick={() => onMovieClick(movie.id)}
          />
        ))}
      </CategoryRow>
      
      {/* Wanzami Originals */}
      <CategoryRow title="Wanzami Originals">
        {originals.map((movie) => (
          <MoviePosterCard 
            key={movie.id} 
            item={movie}
            size="large"
            onClick={() => onMovieClick(movie.id)}
          />
        ))}
      </CategoryRow>
      
      {/* New on Wanzami */}
      <CategoryRow title="New on Wanzami">
        {movies.slice(0, 6).map((movie) => (
          <MoviePosterCard 
            key={movie.id} 
            item={movie}
            onClick={() => onMovieClick(movie.id)}
          />
        ))}
      </CategoryRow>
      
      {/* Popular Series */}
      <CategoryRow title="Popular Series">
        {series.map((show) => (
          <MoviePosterCard 
            key={show.id} 
            item={show}
            onClick={() => onMovieClick(show.id)}
          />
        ))}
      </CategoryRow>
      
      {/* Top Movies */}
      <CategoryRow title="Top Movies">
        {movies.slice(3).map((movie) => (
          <MoviePosterCard 
            key={movie.id} 
            item={movie}
            size="small"
            onClick={() => onMovieClick(movie.id)}
          />
        ))}
      </CategoryRow>
    </div>
  );
}
