// Mock data for WANZAMI streaming app

export interface Movie {
  id: string;
  title: string;
  year: number;
  duration: string;
  rating: string;
  genre: string[];
  description: string;
  thumbnail: string;
  backdrop: string;
  cast: string[];
  progress?: number; // for continue watching (0-100)
  isOriginal?: boolean;
  trending?: boolean;
}

export interface Series extends Movie {
  seasons: number;
  episodes: number;
}

export interface LiveStream {
  id: string;
  title: string;
  hostName: string;
  thumbnail: string;
  viewerCount: number;
  isLive: boolean;
  category: string;
  scheduledTime?: string;
}

export const movies: Movie[] = [
  {
    id: "m1",
    title: "Lagos Rising",
    year: 2025,
    duration: "2h 15m",
    rating: "8.5",
    genre: ["Action", "Thriller", "Nollywood"],
    description: "In the heart of Lagos, a young tech entrepreneur must navigate dangerous corporate espionage while uncovering a conspiracy that threatens the entire city.",
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=450&fit=crop",
    cast: ["Chiwetel Ejiofor", "Genevieve Nnaji", "John Boyega"],
    isOriginal: true,
    trending: true,
    progress: 35
  },
  {
    id: "m2",
    title: "The Kingdom",
    year: 2024,
    duration: "1h 58m",
    rating: "9.2",
    genre: ["Drama", "Historical"],
    description: "An epic tale of power, betrayal, and redemption set in ancient Benin Kingdom during its golden age.",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop",
    cast: ["David Oyelowo", "Lupita Nyong'o", "Daniel Kaluuya"],
    isOriginal: true,
    trending: true
  },
  {
    id: "m3",
    title: "Love in Accra",
    year: 2025,
    duration: "1h 42m",
    rating: "7.8",
    genre: ["Romance", "Comedy"],
    description: "A chance encounter at a bustling Accra market sparks an unlikely romance between two strangers from different worlds.",
    thumbnail: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800&h=450&fit=crop",
    cast: ["Issa Rae", "Idris Elba"],
    progress: 78
  },
  {
    id: "m4",
    title: "Sahara Knights",
    year: 2024,
    duration: "2h 8m",
    rating: "8.9",
    genre: ["Action", "Adventure"],
    description: "A team of elite warriors must cross the Sahara to stop an ancient evil from awakening.",
    thumbnail: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=800&h=450&fit=crop",
    cast: ["Mahershala Ali", "Charlize Theron"],
    isOriginal: false,
    trending: true
  },
  {
    id: "m5",
    title: "Motherland",
    year: 2025,
    duration: "1h 55m",
    rating: "8.1",
    genre: ["Drama", "Family"],
    description: "A diaspora daughter returns to her ancestral village in Nigeria to reconnect with her roots and heal family wounds.",
    thumbnail: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&h=450&fit=crop",
    cast: ["Angela Bassett", "Viola Davis"],
    progress: 12
  },
  {
    id: "m6",
    title: "Street Kings",
    year: 2024,
    duration: "1h 48m",
    rating: "7.5",
    genre: ["Crime", "Drama", "Nollywood"],
    description: "A gritty crime drama following three friends navigating the dangerous underworld of urban Nigeria.",
    thumbnail: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=450&fit=crop",
    cast: ["RMD", "Jim Iyke", "Ramsey Nouah"]
  },
  {
    id: "m7",
    title: "The Wedding",
    year: 2025,
    duration: "2h 5m",
    rating: "8.3",
    genre: ["Romance", "Comedy", "Drama"],
    description: "A lavish Nigerian wedding becomes the backdrop for family drama, unexpected romance, and hilarious chaos.",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop",
    cast: ["Funke Akindele", "Banky W", "Adesua Etomi"]
  },
  {
    id: "m8",
    title: "Warrior Queen",
    year: 2024,
    duration: "2h 20m",
    rating: "9.0",
    genre: ["Action", "Historical", "Drama"],
    description: "The true story of Queen Nzinga, who fought Portuguese colonization in 17th century Angola.",
    thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=450&fit=crop",
    cast: ["Lupita Nyong'o", "Danai Gurira"],
    isOriginal: true
  }
];

export const series: Series[] = [
  {
    id: "s1",
    title: "Lagos Life",
    year: 2025,
    duration: "45m",
    rating: "8.7",
    genre: ["Drama", "Comedy"],
    description: "Follow the interconnected lives of young professionals navigating career, love, and friendship in modern Lagos.",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop",
    cast: ["Multiple Ensemble Cast"],
    seasons: 2,
    episodes: 20,
    isOriginal: true,
    progress: 65
  },
  {
    id: "s2",
    title: "Empire of Gold",
    year: 2024,
    duration: "50m",
    rating: "9.1",
    genre: ["Drama", "Thriller"],
    description: "A powerful family's mining empire is threatened by betrayal, secrets, and a fight for succession.",
    thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&h=450&fit=crop",
    cast: ["Multiple Ensemble Cast"],
    seasons: 3,
    episodes: 30,
    isOriginal: true,
    trending: true
  },
  {
    id: "s3",
    title: "The Village",
    year: 2025,
    duration: "40m",
    rating: "8.2",
    genre: ["Drama", "Mystery"],
    description: "Strange occurrences plague a remote village as ancient traditions clash with modern life.",
    thumbnail: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=450&fit=crop",
    cast: ["Ensemble Cast"],
    seasons: 1,
    episodes: 10,
    progress: 30
  },
  {
    id: "s4",
    title: "Street Hustle",
    year: 2024,
    duration: "35m",
    rating: "7.9",
    genre: ["Drama", "Crime"],
    description: "Young entrepreneurs navigate the challenges of building legitimate businesses while facing street pressures.",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop",
    cast: ["Ensemble Cast"],
    seasons: 2,
    episodes: 16,
    isOriginal: true
  },
  {
    id: "s5",
    title: "Royal Court",
    year: 2025,
    duration: "55m",
    rating: "8.8",
    genre: ["Drama", "Historical"],
    description: "Political intrigue and power struggles in a contemporary Nigerian royal dynasty.",
    thumbnail: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=800&h=450&fit=crop",
    cast: ["Ensemble Cast"],
    seasons: 1,
    episodes: 12,
    trending: true
  },
  {
    id: "s6",
    title: "Campus Chronicles",
    year: 2024,
    duration: "30m",
    rating: "7.6",
    genre: ["Comedy", "Drama"],
    description: "University students face academic pressure, relationships, and self-discovery in this coming-of-age series.",
    thumbnail: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop",
    backdrop: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&h=450&fit=crop",
    cast: ["Young Ensemble Cast"],
    seasons: 3,
    episodes: 24
  }
];

export const liveStreams: LiveStream[] = [
  {
    id: "l1",
    title: "Lagos Film Premiere: The Kingdom",
    hostName: "Wanzami Events",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=400&fit=crop",
    viewerCount: 12543,
    isLive: true,
    category: "Premiere"
  },
  {
    id: "l2",
    title: "Watch Party: Lagos Life S2 Finale",
    hostName: "Wanzami Community",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=400&fit=crop",
    viewerCount: 8921,
    isLive: true,
    category: "Watch Party"
  },
  {
    id: "l3",
    title: "Behind The Scenes: Warrior Queen",
    hostName: "Lupita Nyong'o",
    thumbnail: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=400&fit=crop",
    viewerCount: 15234,
    isLive: true,
    category: "BTS"
  },
  {
    id: "l4",
    title: "Nollywood Awards 2026",
    hostName: "Wanzami Live",
    thumbnail: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
    viewerCount: 45678,
    isLive: true,
    category: "Event"
  },
  {
    id: "l5",
    title: "Street Kings Premiere - Red Carpet",
    hostName: "Wanzami Events",
    thumbnail: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=400&fit=crop",
    viewerCount: 6543,
    isLive: false,
    category: "Premiere",
    scheduledTime: "Tonight 8PM WAT"
  },
  {
    id: "l6",
    title: "Meet the Cast: Empire of Gold S4",
    hostName: "Wanzami Originals",
    thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop",
    viewerCount: 0,
    isLive: false,
    category: "Q&A",
    scheduledTime: "Tomorrow 6PM WAT"
  }
];

export const genres = [
  "All",
  "Nollywood",
  "Action",
  "Romance",
  "Comedy",
  "Drama",
  "Thriller",
  "Historical"
];

export const trendingSearches = [
  "Lagos Rising",
  "The Kingdom",
  "Empire of Gold",
  "Warrior Queen",
  "Nollywood Movies 2025",
  "African Romance",
  "Historical Drama"
];
