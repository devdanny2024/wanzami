import { prisma } from "../src/prisma.js";

const titles = [
  {
    name: "Midnight Run",
    type: "MOVIE" as const,
    description: "A relentless night chase that tests loyalties and limits.",
    releaseYear: 2024,
    genres: ["Action", "Thriller"],
    cast: ["Tega Lawson", "Marie Cruz"],
    crew: ["Ola Ade - Director"],
    language: "en",
    maturityRating: "PG-13",
    runtimeMinutes: 112,
    countryAvailability: ["US", "GB", "NG"],
    isOriginal: true,
  },
  {
    name: "Lagoon Secrets",
    type: "SERIES" as const,
    description: "A journalist uncovers a web of secrets in a coastal city.",
    releaseYear: 2023,
    genres: ["Drama", "Mystery"],
    cast: ["Zara Mensah", "David Cole"],
    crew: ["Ife Akin - Showrunner"],
    language: "en",
    maturityRating: "TV-14",
    runtimeMinutes: 48,
    countryAvailability: ["NG", "ZA", "US"],
    isOriginal: false,
    episodes: [
      { seasonNumber: 1, episodeNumber: 1, name: "The Whispering Docks", runtimeMinutes: 48 },
      { seasonNumber: 1, episodeNumber: 2, name: "Signals", runtimeMinutes: 47 },
      { seasonNumber: 1, episodeNumber: 3, name: "Crosscurrents", runtimeMinutes: 49 },
    ],
  },
];

async function main() {
  for (const t of titles) {
    const releaseDate =
      t.releaseYear && !Number.isNaN(Number(t.releaseYear))
        ? new Date(`${t.releaseYear}-01-01T00:00:00.000Z`)
        : undefined;

    const existing = await prisma.title.findFirst({
      where: { name: t.name, type: t.type },
    });

    const title = existing
      ? await prisma.title.update({
          where: { id: existing.id },
          data: {
            description: t.description,
            releaseDate,
            genres: t.genres,
            cast: t.cast,
            crew: t.crew,
            language: t.language,
            maturityRating: t.maturityRating,
            runtimeMinutes: t.runtimeMinutes,
            countryAvailability: t.countryAvailability,
            isOriginal: t.isOriginal,
            archived: false,
          },
        })
      : await prisma.title.create({
          data: {
            name: t.name,
            type: t.type,
            description: t.description,
            releaseDate,
            genres: t.genres,
            cast: t.cast,
            crew: t.crew,
            language: t.language,
            maturityRating: t.maturityRating,
            runtimeMinutes: t.runtimeMinutes,
            countryAvailability: t.countryAvailability,
            isOriginal: t.isOriginal,
            archived: false,
          },
        });

    console.log(`Ensured title: ${title.name} (${title.type})`);

    if (t.type === "SERIES" && t.episodes?.length) {
      for (const ep of t.episodes) {
        const existingEpisode = await prisma.episode.findFirst({
          where: {
            titleId: title.id,
            seasonNumber: ep.seasonNumber,
            episodeNumber: ep.episodeNumber,
          },
        });

        if (existingEpisode) {
          await prisma.episode.update({
            where: { id: existingEpisode.id },
            data: {
              name: ep.name,
              runtimeMinutes: ep.runtimeMinutes,
            },
          });
        } else {
          await prisma.episode.create({
            data: {
              titleId: title.id,
              seasonNumber: ep.seasonNumber,
              episodeNumber: ep.episodeNumber,
              name: ep.name,
              runtimeMinutes: ep.runtimeMinutes,
            },
          });
        }
        console.log(
          `  Ensured S${ep.seasonNumber}E${ep.episodeNumber}: ${ep.name}`
        );
      }
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
