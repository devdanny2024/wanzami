export interface Content {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration?: string;
  year?: number;
  genre: string[];
  type: "movie" | "series" | "live";
  rating?: string;
  progress?: number; // 0-100 for continue watching
}

export interface LiveEvent extends Content {
  type: "live";
  isLive: boolean;
  startTime: string;
  viewers?: number;
  category: "sports" | "music" | "entertainment" | "news";
}

export const heroContent: Content[] = [
  {
    id: "hero-1",
    title: "The Queen of Katwe",
    description: "A Ugandan girl's life changes forever when she discovers she has an amazing talent for chess in this celebration of the human spirit.",
    thumbnail: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=1920&h=1080&fit=crop",
    duration: "2h 4m",
    year: 2023,
    genre: ["Drama", "Biography"],
    type: "movie",
    rating: "PG"
  },
  {
    id: "hero-2",
    title: "Lagos Nights",
    description: "An electrifying thriller set in the heart of Nigeria's bustling metropolis, where a young entrepreneur navigates the dangerous world of tech and crime.",
    thumbnail: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1920&h=1080&fit=crop",
    duration: "1h 52m",
    year: 2024,
    genre: ["Thriller", "Drama"],
    type: "movie",
    rating: "16+"
  },
  {
    id: "hero-3",
    title: "Serengeti Chronicles",
    description: "An epic documentary series following the lives of wildlife and the communities living alongside Tanzania's greatest natural treasure.",
    thumbnail: "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1920&h=1080&fit=crop",
    duration: "8 Episodes",
    year: 2024,
    genre: ["Documentary", "Nature"],
    type: "series",
    rating: "G"
  }
];

export const continueWatching: Content[] = [
  {
    id: "cw-1",
    title: "Blood & Water",
    description: "A Cape Town teen sets out to prove whether a private school swimming star is her sister who was abducted at birth.",
    thumbnail: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&h=400&fit=crop",
    duration: "45m",
    genre: ["Drama", "Mystery"],
    type: "series",
    progress: 65
  },
  {
    id: "cw-2",
    title: "King of Boys",
    description: "When a powerful businesswoman's political ambitions are threatened, she faces her past and fights for her future.",
    thumbnail: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=600&h=400&fit=crop",
    duration: "2h 15m",
    genre: ["Drama", "Crime"],
    type: "movie",
    progress: 32
  },
  {
    id: "cw-3",
    title: "Oloture",
    description: "A journalist goes undercover as a prostitute to expose human trafficking but she soon learns that ignorance can be a bliss.",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=400&fit=crop",
    duration: "1h 46m",
    genre: ["Thriller", "Drama"],
    type: "movie",
    progress: 78
  },
  {
    id: "cw-4",
    title: "Ghana Jollof Wars",
    description: "A culinary competition series where top chefs battle for the title of Africa's best jollof rice maker.",
    thumbnail: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop",
    duration: "35m",
    genre: ["Reality", "Food"],
    type: "series",
    progress: 45
  }
];

export const trendingMovies: Content[] = [
  {
    id: "tm-1",
    title: "The Burial of Kojo",
    description: "A mystical tale of two brothers in rural Ghana, told through the eyes of a young girl.",
    thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=600&h=400&fit=crop",
    duration: "1h 20m",
    year: 2018,
    genre: ["Drama", "Fantasy"],
    type: "movie",
    rating: "13+"
  },
  {
    id: "tm-2",
    title: "93 Days",
    description: "The true story of Nigerian health workers who risked their lives to contain the 2014 Ebola outbreak.",
    thumbnail: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=600&h=400&fit=crop",
    duration: "2h 4m",
    year: 2016,
    genre: ["Drama", "Thriller"],
    type: "movie",
    rating: "16+"
  },
  {
    id: "tm-3",
    title: "Viva Riva!",
    description: "A small-time smuggler returns to Kinshasa with a fortune in stolen fuel, attracting dangerous attention.",
    thumbnail: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop",
    duration: "1h 38m",
    year: 2010,
    genre: ["Crime", "Drama"],
    type: "movie",
    rating: "18+"
  },
  {
    id: "tm-4",
    title: "Lionheart",
    description: "A young woman fights to save her father's company from collapse while battling sexism and tradition.",
    thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop",
    duration: "1h 35m",
    year: 2018,
    genre: ["Comedy", "Drama"],
    type: "movie",
    rating: "PG"
  },
  {
    id: "tm-5",
    title: "Eyimofe",
    description: "Two Nigerian factory workers dream of a better life in Europe, but fate has other plans.",
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&h=400&fit=crop",
    duration: "1h 56m",
    year: 2020,
    genre: ["Drama"],
    type: "movie",
    rating: "13+"
  },
  {
    id: "tm-6",
    title: "The Figurine",
    description: "Two friends find a mystical sculpture in the forest, unleashing both fortune and terror.",
    thumbnail: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&h=400&fit=crop",
    duration: "2h 2m",
    year: 2009,
    genre: ["Horror", "Mystery"],
    type: "movie",
    rating: "16+"
  }
];

export const popularSeries: Content[] = [
  {
    id: "ps-1",
    title: "Castle & Castle",
    description: "A power couple runs Nigeria's leading law firm while juggling family drama and high-stakes cases.",
    thumbnail: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop",
    duration: "12 Episodes",
    year: 2018,
    genre: ["Drama", "Legal"],
    type: "series",
    rating: "13+"
  },
  {
    id: "ps-2",
    title: "Shuga",
    description: "Young adults in Nairobi navigate love, relationships, and health challenges in this groundbreaking series.",
    thumbnail: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=400&fit=crop",
    duration: "22 Episodes",
    year: 2019,
    genre: ["Drama", "Romance"],
    type: "series",
    rating: "16+"
  },
  {
    id: "ps-3",
    title: "The Republic",
    description: "Political intrigue and power plays unfold in this gripping series set in a fictional African nation.",
    thumbnail: "https://images.unsplash.com/photo-1526512340740-9217d0159da9?w=600&h=400&fit=crop",
    duration: "10 Episodes",
    year: 2021,
    genre: ["Political", "Thriller"],
    type: "series",
    rating: "16+"
  },
  {
    id: "ps-4",
    title: "Taste of Love",
    description: "A celebrity chef returns home to open a restaurant and reconnect with her roots.",
    thumbnail: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    duration: "8 Episodes",
    year: 2022,
    genre: ["Romance", "Drama"],
    type: "series",
    rating: "PG"
  },
  {
    id: "ps-5",
    title: "Wura",
    description: "A mining magnate's family battles for control of an empire built on secrets and lies.",
    thumbnail: "https://images.unsplash.com/photo-1500259571355-332da5cb07aa?w=600&h=400&fit=crop",
    duration: "24 Episodes",
    year: 2023,
    genre: ["Drama", "Family"],
    type: "series",
    rating: "16+"
  }
];

export const liveEvents: LiveEvent[] = [
  {
    id: "live-1",
    title: "Afrobeats Fest Lagos",
    description: "Live from Eko Atlantic - featuring Wizkid, Burna Boy, Tems and special guests for an unforgettable night.",
    thumbnail: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop",
    type: "live",
    isLive: true,
    startTime: "20:00 WAT",
    viewers: 45200,
    category: "music",
    genre: ["Music", "Concert"],
    rating: "G"
  },
  {
    id: "live-2",
    title: "CAF Champions League Final",
    description: "Al Ahly vs Wydad Casablanca - The ultimate showdown for African club football supremacy.",
    thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=400&fit=crop",
    type: "live",
    isLive: true,
    startTime: "21:00 CAT",
    viewers: 128500,
    category: "sports",
    genre: ["Sports", "Football"],
    rating: "G"
  },
  {
    id: "live-3",
    title: "The Night Show with Trevor",
    description: "Tonight's guests: Lupita Nyong'o and comedian Basket Mouth discuss African cinema's global rise.",
    thumbnail: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&h=400&fit=crop",
    type: "live",
    isLive: false,
    startTime: "22:00 EAT",
    viewers: 0,
    category: "entertainment",
    genre: ["Talk Show", "Entertainment"],
    rating: "PG"
  },
  {
    id: "live-4",
    title: "Rwanda Tech Summit 2026",
    description: "Innovation leaders discuss the future of African tech, AI, and digital transformation.",
    thumbnail: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&h=400&fit=crop",
    type: "live",
    isLive: false,
    startTime: "Tomorrow 14:00 CAT",
    viewers: 0,
    category: "news",
    genre: ["Tech", "Business"],
    rating: "G"
  },
  {
    id: "live-5",
    title: "Amapiano All-Stars",
    description: "The biggest Amapiano artists live from Pretoria in an exclusive 3-hour marathon.",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
    type: "live",
    isLive: true,
    startTime: "19:00 SAST",
    viewers: 67300,
    category: "music",
    genre: ["Music", "Amapiano"],
    rating: "PG"
  }
];

export const allContent = [...trendingMovies, ...popularSeries, ...continueWatching];
