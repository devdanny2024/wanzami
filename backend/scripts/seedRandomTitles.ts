import { PrismaClient, TitleType } from "@prisma/client";

const prisma = new PrismaClient();

const genres = [
  "Drama",
  "Thriller",
  "Action",
  "Comedy",
  "Sci-Fi",
  "Fantasy",
  "Romance",
  "Documentary",
  "Mystery",
  "Adventure",
];

const languages = ["en", "fr", "yo", "ha", "ig", "sw"];
const maturityRatings = ["G", "PG", "PG-13", "R", "TV-14", "TV-MA"];
const countries = ["NG", "US", "GB", "ZA", "KE", "GH", "CA"];

const adjectives = [
  "Midnight",
  "Golden",
  "Broken",
  "Silent",
  "Hidden",
  "Wild",
  "Burning",
  "Electric",
  "Lonely",
  "Crimson",
  "Sacred",
  "Shattered",
];

const nouns = [
  "Echo",
  "Promise",
  "River",
  "Shadow",
  "Path",
  "Legacy",
  "Fire",
  "Destiny",
  "Horizon",
  "Secret",
  "Pulse",
  "Journey",
  "Storm",
  "Covenant",
  "Whisper",
];

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomName = () => `${randomItem(adjectives)} ${randomItem(nouns)}`;

const randomDescription = () =>
  "A fresh story generated for seeding: unexpected choices, high stakes, and characters finding their path.";

const randomGenres = () => {
  const shuffled = [...genres].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
};

const randomCountries = () => {
  const shuffled = [...countries].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
};

const placeholderPoster = (title: string) =>
  `https://placehold.co/600x900/111111/FD7E14?text=${encodeURIComponent(title)}`;
const placeholderThumb = (title: string) =>
  `https://placehold.co/640x360/111111/FD7E14?text=${encodeURIComponent(title)}`;

const buildTitle = (type: TitleType, idx: number) => {
  const name = `${randomName()} ${type === "MOVIE" ? "Film" : "Series"} ${idx + 1}`;
  const year = 2015 + Math.floor(Math.random() * 11); // 2015-2025
  return {
    type,
    name,
    description: randomDescription(),
    genres: randomGenres(),
    language: randomItem(languages),
    maturityRating: randomItem(maturityRatings),
    runtimeMinutes: type === "MOVIE" ? 85 + Math.floor(Math.random() * 50) : null,
    countryAvailability: randomCountries(),
    isOriginal: Math.random() > 0.5,
    releaseDate: new Date(year, 0, 1),
    posterUrl: placeholderPoster(name),
    thumbnailUrl: placeholderThumb(name),
    trailerUrl: null,
    cast: [],
    crew: [],
  };
};

async function main() {
  console.log("Clearing existing titles and related data…");
  await prisma.engagementEvent.deleteMany({});
  await prisma.assetVersion.deleteMany({});
  await prisma.uploadJob.deleteMany({});
  await prisma.episode.deleteMany({});
  await prisma.titleSimilarity.deleteMany({});
  await prisma.titleEmbedding.deleteMany({});
  await prisma.popularitySnapshot.deleteMany({});
  await prisma.title.deleteMany({});

  console.log("Seeding 20 movies and 20 series…");
  const movies = Array.from({ length: 20 }, (_, i) => buildTitle("MOVIE", i));
  const series = Array.from({ length: 20 }, (_, i) => buildTitle("SERIES", i));
  const titles = [...movies, ...series];

  for (const t of titles) {
    await prisma.title.create({ data: t });
  }

  console.log("Done seeding 40 titles.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
