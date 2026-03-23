import { useState } from "react";
import { Search as SearchIcon, X, Filter } from "lucide-react";
import { useNavigate } from "react-router";
import { useDevice } from "../context/DeviceContext";
import { FocusableButton } from "../components/FocusableButton";
import { allContent, Content } from "../data/mockContent";

export function Search() {
  const navigate = useNavigate();
  const { isTv, isPortrait } = useDevice();
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "movie" | "series" | "live">("all");
  const [showKeyboard, setShowKeyboard] = useState(false);

  const filteredContent = allContent.filter(item => {
    const matchesQuery = query === "" || 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.genre.some(g => g.toLowerCase().includes(query.toLowerCase()));
    
    const matchesType = selectedType === "all" || item.type === selectedType;
    
    return matchesQuery && matchesType;
  });

  const handleItemClick = (item: Content) => {
    if (item.type === "live") {
      navigate(`/live/${item.id}`);
    } else {
      navigate(`/watch/${item.id}`);
    }
  };

  return (
    <div className={`min-h-screen ${isTv ? "px-20 py-16" : isPortrait ? "px-6 py-8" : "px-12 py-12"}`}>
      <h1 className={`text-white font-bold mb-8 ${isTv ? "text-6xl" : "text-4xl"}`}>
        Search
      </h1>

      {/* Search Input */}
      <div className="mb-8">
        <div className="relative max-w-3xl">
          <SearchIcon className={`absolute left-4 top-1/2 -translate-y-1/2 text-white/40 ${isTv ? "w-8 h-8" : "w-6 h-6"}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => isTv && setShowKeyboard(true)}
            placeholder="Search for movies, series, or live events..."
            className={`
              w-full bg-[#0F0F14] border border-white/10 rounded-2xl text-white
              placeholder:text-white/40 focus:outline-none focus:border-[#E63946]
              ${isTv ? "pl-16 pr-16 py-6 text-2xl" : "pl-14 pr-14 py-4 text-lg"}
            `}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className={`absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white`}
            >
              <X className={isTv ? "w-8 h-8" : "w-6 h-6"} />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-8">
        {(["all", "movie", "series", "live"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`
              px-6 py-3 rounded-xl font-semibold capitalize transition-all
              ${isTv ? "text-xl" : "text-base"}
              ${selectedType === type 
                ? "bg-[#E63946] text-white" 
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }
            `}
          >
            {type === "all" ? "All" : type === "live" ? "Live Events" : `${type}s`}
          </button>
        ))}
      </div>

      {/* TV On-Screen Keyboard */}
      {isTv && showKeyboard && (
        <div className="mb-12 bg-[#0F0F14] rounded-2xl p-8 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white text-2xl font-semibold">On-Screen Keyboard</h3>
            <button
              onClick={() => setShowKeyboard(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          <TVKeyboard value={query} onChange={setQuery} />
        </div>
      )}

      {/* Results */}
      <div>
        {query && (
          <p className={`text-white/60 mb-6 ${isTv ? "text-xl" : "text-base"}`}>
            {filteredContent.length} results for "{query}"
          </p>
        )}

        <div className={`grid gap-6 ${
          isTv ? "grid-cols-4" : isPortrait ? "grid-cols-1" : "grid-cols-3"
        }`}>
          {(query ? filteredContent : allContent.slice(0, 12)).map((item, index) => (
            <SearchResultCard
              key={item.id}
              item={item}
              index={index}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </div>

        {filteredContent.length === 0 && query && (
          <div className="text-center py-20">
            <SearchIcon className="w-20 h-20 text-white/20 mx-auto mb-6" />
            <h3 className="text-white text-2xl font-semibold mb-2">No results found</h3>
            <p className="text-white/60 text-lg">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({ item, index, onClick }: { item: Content; index: number; onClick: () => void }) {
  const { isTv } = useDevice();

  return (
    <FocusableButton
      id={`search-result-${item.id}-${index}`}
      onClick={onClick}
      className="group/card relative text-left"
    >
      <div className={`${isTv ? "h-[300px]" : "h-[240px]"} rounded-xl overflow-hidden relative mb-3`}>
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-300"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

        <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/70 backdrop-blur-sm rounded-md">
          <span className="text-white text-sm font-medium capitalize">{item.type}</span>
        </div>
      </div>

      <h3 className={`text-white font-semibold mb-1 line-clamp-1 ${isTv ? "text-xl" : "text-base"}`}>
        {item.title}
      </h3>
      
      <p className={`text-white/60 line-clamp-2 ${isTv ? "text-base" : "text-sm"}`}>
        {item.description}
      </p>
    </FocusableButton>
  );
}

function TVKeyboard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];

  return (
    <div className="space-y-3">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-3">
          {row.map((letter) => (
            <FocusableButton
              key={letter}
              id={`kb-${letter}`}
              onClick={() => onChange(value + letter.toLowerCase())}
              className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-lg text-white text-2xl font-semibold"
            >
              {letter}
            </FocusableButton>
          ))}
        </div>
      ))}
      
      <div className="flex justify-center gap-3 mt-6">
        <FocusableButton
          id="kb-space"
          onClick={() => onChange(value + " ")}
          className="w-64 h-16 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xl font-semibold"
        >
          Space
        </FocusableButton>
        
        <FocusableButton
          id="kb-backspace"
          onClick={() => onChange(value.slice(0, -1))}
          className="w-32 h-16 bg-white/5 hover:bg-white/10 rounded-lg text-white text-xl font-semibold"
        >
          ← Delete
        </FocusableButton>
      </div>
    </div>
  );
}
