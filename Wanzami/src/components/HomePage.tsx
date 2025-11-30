import { Hero } from './Hero';
import { ContentRow } from './ContentRow';
import { PPVContentRow } from './PPVContentRow';
import { MovieData } from './MovieCard';
import { PPVMovieData } from './PPVMovieCard';

interface HomePageProps {
  onMovieClick: (movie: any) => void;
  movies: MovieData[];
  loading?: boolean;
  error?: string | null;
}

// PPV Movies Data
const ppvPremieres: PPVMovieData[] = [
  {
    id: 101,
    title: "The Governor",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 3500,
    buyPrice: 8500,
    currency: "NGN",
    rating: "18+",
    duration: "2h 30m",
    genre: "Political Thriller",
    isPremiere: true
  },
  {
    id: 102,
    title: "Blood Sisters: The Movie",
    image: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mzc5MjY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    price: 2500,
    buyPrice: 6000,
    currency: "NGN",
    rating: "16+",
    duration: "2h 15m",
    genre: "Drama",
    isPremiere: true
  },
  {
    id: 103,
    title: "Anikulapo: Rise of the Spectre",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    price: 3000,
    buyPrice: 7500,
    currency: "NGN",
    rating: "16+",
    duration: "2h 45m",
    genre: "Fantasy",
    isPremiere: true
  },
  {
    id: 104,
    title: "Lagos Vice",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 2800,
    buyPrice: 7000,
    currency: "NGN",
    rating: "18+",
    duration: "2h 20m",
    genre: "Action",
    isPremiere: true
  },
  {
    id: 105,
    title: "Omo Ghetto: The Saga Continues",
    image: "https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwaGFwcHl8ZW58MXx8fHwxNzYzNzkyNjYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    price: 2000,
    buyPrice: 5000,
    currency: "NGN",
    rating: "13+",
    duration: "2h 00m",
    genre: "Comedy",
    isPremiere: false
  }
];

const topNaijaOriginals: MovieData[] = [
  {
    id: 1,
    title: "King of Boys: The Return",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    duration: "2h 45m",
    genre: "Crime Drama"
  },
  {
    id: 2,
    title: "Lagos Hustle",
    image: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mzc5MjY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    duration: "1h 55m",
    genre: "Drama"
  },
  {
    id: 3,
    title: "Ancestral Calling",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    duration: "2h 10m",
    genre: "Fantasy"
  },
  {
    id: 4,
    title: "Family Ties",
    image: "https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwaGFwcHl8ZW58MXx8fHwxNzYzNzkyNjYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    duration: "1h 40m",
    genre: "Comedy"
  },
  {
    id: 5,
    title: "Rhythm & Soul",
    image: "https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGFuY2UlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjM3OTI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    duration: "1h 50m",
    genre: "Musical"
  }
];

const trendingNow: MovieData[] = [
  {
    id: 6,
    title: "City Lights",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    duration: "2h 05m",
    genre: "Thriller"
  },
  {
    id: 7,
    title: "Cinema Paradiso",
    image: "https://images.unsplash.com/photo-1621276336795-925346853745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    duration: "1h 45m",
    genre: "Drama"
  },
  {
    id: 8,
    title: "The Queen's Gambit",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    duration: "2h 20m",
    genre: "Biography"
  },
  {
    id: 9,
    title: "Nollywood Rising",
    image: "https://images.unsplash.com/photo-1761370980993-3ec8c23709fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMGNpbmVtYSUyMG1vdmllfGVufDF8fHx8MTc2Mzc5MjY2MXww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    duration: "1h 30m",
    genre: "Documentary"
  },
  {
    id: 10,
    title: "Street Chronicles",
    image: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mzc5MjY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    duration: "2h 15m",
    genre: "Action"
  }
];

const newReleases: MovieData[] = [
  {
    id: 11,
    title: "Midnight in Lagos",
    image: "https://images.unsplash.com/photo-1677435013662-ef31e32ff9f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWdvcyUyMGNpdHklMjBuaWdodHxlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    duration: "1h 58m",
    genre: "Romance"
  },
  {
    id: 12,
    title: "The Festival",
    image: "https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGFuY2UlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjM3OTI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    duration: "1h 42m",
    genre: "Comedy"
  },
  {
    id: 13,
    title: "Brothers in Arms",
    image: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mzc5MjY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    duration: "2h 30m",
    genre: "War Drama"
  },
  {
    id: 14,
    title: "Heritage Keepers",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    duration: "2h 00m",
    genre: "Adventure"
  },
  {
    id: 15,
    title: "Power Play",
    image: "https://images.unsplash.com/photo-1713845784782-51b36d805391?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwd29tYW4lMjBwb3J0cmFpdCUyMGNpbmVtYXRpY3xlbnwxfHx8fDE3NjM3OTI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "18+",
    duration: "2h 12m",
    genre: "Political Thriller"
  }
];

const africanClassics: MovieData[] = [
  {
    id: 16,
    title: "Living in Bondage",
    image: "https://images.unsplash.com/photo-1621276336795-925346853745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjBtb3ZpZSUyMHRoZWF0ZXIlMjBkYXJrfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    duration: "2h 15m",
    genre: "Classic Drama"
  },
  {
    id: 17,
    title: "The Figurine",
    image: "https://images.unsplash.com/photo-1657356217561-6ed26b47e116?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwY3VsdHVyZSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc2Mzc5MjY2M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "13+",
    duration: "1h 50m",
    genre: "Supernatural"
  },
  {
    id: 18,
    title: "October 1st",
    image: "https://images.unsplash.com/photo-1618051438543-9f85cab01c60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWdlcmlhbiUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2Mzc5MjY2NHww&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    duration: "2h 20m",
    genre: "Historical"
  },
  {
    id: 19,
    title: "Half of a Yellow Sun",
    image: "https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZmFtaWx5JTIwaGFwcHl8ZW58MXx8fHwxNzYzNzkyNjYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "16+",
    duration: "2h 28m",
    genre: "War Epic"
  },
  {
    id: 20,
    title: "Wedding Party",
    image: "https://images.unsplash.com/photo-1758875913518-7869eb5e1e91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwZGFuY2UlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NjM3OTI2NjR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    rating: "PG",
    duration: "1h 48m",
    genre: "Comedy"
  }
];

export function HomePage({ onMovieClick, movies, loading, error }: HomePageProps) {
  const sortedMovies = [...movies].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bDate - aDate;
  });
  const featured = sortedMovies.slice(0, 3).map((m, idx) => ({
    id: typeof m.id === "number" ? m.id : idx,
    title: m.title,
    description: m.description || "Now streaming on Wanzami.",
    image: m.image,
    rating: m.rating || "PG",
    year: m.year ? String(m.year) : "2024",
    genre: m.genre || "Movie",
  }));

  const primaryRow = sortedMovies.slice(0, 10);
  const secondaryRow = sortedMovies.slice(10, 20);
  const tertiaryRow = sortedMovies.slice(20, 30);
  const hasCatalog = movies.length > 0;

  return (
    <div className="min-h-screen bg-black">
      <Hero onPlayClick={onMovieClick} featured={featured} />
      
      <div className="relative -mt-32 z-10 pb-12 md:pb-16">
        <PPVContentRow
          title="PPV Premieres"
          movies={ppvPremieres}
          onMovieClick={onMovieClick}
        />
        
        {loading ? (
          <div className="text-gray-400 px-4 md:px-12 lg:px-16">Loading catalog…</div>
        ) : error ? (
          <div className="text-red-400 px-4 md:px-12 lg:px-16">Failed to load movies: {error}</div>
        ) : hasCatalog ? (
          <>
            <ContentRow title="Latest on Wanzami" movies={primaryRow} onMovieClick={onMovieClick} />
            <ContentRow title="Trending Now" movies={secondaryRow.length ? secondaryRow : primaryRow} onMovieClick={onMovieClick} />
            <ContentRow title="More to Explore" movies={tertiaryRow.length ? tertiaryRow : primaryRow} onMovieClick={onMovieClick} />
          </>
        ) : (
          <>
            <ContentRow
              title="Top Naija Originals"
              movies={topNaijaOriginals}
              onMovieClick={onMovieClick}
            />
            
            <ContentRow
              title="Trending Now"
              movies={trendingNow}
              onMovieClick={onMovieClick}
            />
            
            <ContentRow
              title="New Releases"
              movies={newReleases}
              onMovieClick={onMovieClick}
            />
            
            <ContentRow
              title="African Classics"
              movies={africanClassics}
              onMovieClick={onMovieClick}
            />
          </>
        )}
      </div>
    </div>
  );
}
