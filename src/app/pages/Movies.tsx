import { useDevice } from "../context/DeviceContext";
import { ContentRail } from "../components/ContentRail";
import { trendingMovies, allContent } from "../data/mockContent";

export function Movies() {
  const { isTv, isPortrait } = useDevice();
  
  const movies = allContent.filter(c => c.type === "movie");
  const actionMovies = movies.slice(0, 6);
  const dramaMovies = movies.slice(2, 8);
  const newReleases = movies.slice(1, 7);

  return (
    <div className={`${isTv ? "px-20 py-16" : isPortrait ? "px-6 py-8" : "px-12 py-12"}`}>
      <h1 className={`text-white font-bold mb-12 ${isTv ? "text-6xl" : "text-4xl"}`}>
        Movies
      </h1>

      <div className="space-y-12">
        <ContentRail title="Trending Now" items={trendingMovies} />
        <ContentRail title="New Releases" items={newReleases} />
        <ContentRail title="Action & Thriller" items={actionMovies} />
        <ContentRail title="Drama" items={dramaMovies} />
      </div>
    </div>
  );
}
