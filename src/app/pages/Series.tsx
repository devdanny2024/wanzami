import { useDevice } from "../context/DeviceContext";
import { ContentRail } from "../components/ContentRail";
import { popularSeries, allContent } from "../data/mockContent";

export function Series() {
  const { isTv, isPortrait } = useDevice();
  
  const series = allContent.filter(c => c.type === "series");
  const topSeries = series.slice(0, 6);
  const newSeries = series.slice(1, 7);

  return (
    <div className={`${isTv ? "px-20 py-16" : isPortrait ? "px-6 py-8" : "px-12 py-12"}`}>
      <h1 className={`text-white font-bold mb-12 ${isTv ? "text-6xl" : "text-4xl"}`}>
        Series
      </h1>

      <div className="space-y-12">
        <ContentRail title="Popular Series" items={popularSeries} />
        <ContentRail title="Top Picks" items={topSeries} />
        <ContentRail title="New Episodes" items={newSeries} />
      </div>
    </div>
  );
}
