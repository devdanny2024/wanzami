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

const buildEpisodes = (titleId: bigint) => {
  const seasons = 1 + Math.floor(Math.random() * 3); // 1-3 seasons
  const episodes: Array<{
    titleId: bigint;
    seasonNumber: number;
    episodeNumber: number;
    name: string;
    synopsis: string;
    runtimeMinutes: number;
  }> = [];
  for (let s = 1; s <= seasons; s++) {
    const epCount = 4 + Math.floor(Math.random() * 5); // 4-8 eps per season
    for (let e = 1; e <= epCount; e++) {
      const epName = `Season ${s} Episode ${e}`;
      episodes.push({
        titleId,
        seasonNumber: s,
        episodeNumber: e,
        name: epName,
        synopsis: "Generated episode for seeded series; characters push forward under new pressures.",
        runtimeMinutes: 25 + Math.floor(Math.random() * 15),
      });
    }
  }
  return episodes;
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
    const created = await prisma.title.create({ data: t });
    if (t.type === "SERIES") {
      const episodes = buildEpisodes(created.id);
      await prisma.episode.createMany({ data: episodes });
    }
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
