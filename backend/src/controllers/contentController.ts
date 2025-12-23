import { Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../prisma.js";
import { presignPutObject, presignGetObject } from "../upload/s3.js";
import { config } from "../config.js";
import { resolveCountry } from "../utils/country.js";
import { auditLog } from "../utils/audit.js";
import { AssetStatus } from "@prisma/client";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

const kidSafeRatings = ["G", "PG", "TV-Y", "TV-G", "TV-PG", "PG-13"];
const teenSafeRatings = ["PG-13", "TV-14"];

const parseOptionalNumber = (val: any): number | undefined => {
  if (val === null || val === undefined) return undefined;
  const num = Number(val);
  return Number.isFinite(num) ? num : undefined;
};

export const listTitles = async (_req: Request, res: Response) => {
  const titles = await prisma.title.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      episodes: {
        select: { id: true },
      },
      seasons: {
        select: { id: true },
      },
    },
  });

  return res.json({
    titles: titles.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      type: t.type,
      description: t.description,
      genres: t.genres,
      cast: t.cast,
      crew: t.crew,
      language: t.language,
      maturityRating: t.maturityRating,
      runtimeMinutes: t.runtimeMinutes,
      countryAvailability: t.countryAvailability,
      isOriginal: t.isOriginal,
      posterUrl: t.posterUrl,
      thumbnailUrl: t.thumbnailUrl,
      trailerUrl: t.trailerUrl,
      previewSpriteUrl: t.previewSpriteUrl,
      previewVttUrl: t.previewVttUrl,
      introStartSec: t.introStartSec,
      introEndSec: t.introEndSec,
      archived: t.archived,
      pendingReview: t.pendingReview,
      isPpv: t.isPpv,
      ppvPriceNaira: t.ppvPriceNaira,
      ppvCurrency: t.ppvCurrency,
      ppvDescription: t.ppvDescription,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      episodeCount: t.episodes.length,
      seasonCount: t.seasons.length,
      releaseYear: t.releaseDate ? t.releaseDate.getUTCFullYear() : undefined,
    })),
  });
};

const parseKidMode = (req: Request) => {
  const q = (req.query.kidMode as string | undefined)?.toLowerCase();
  if (q === "true" || q === "1") return true;
  const header = (req.headers["x-kid-mode"] as string | undefined)?.toLowerCase();
  if (header === "true" || header === "1") return true;
  return false;
};

const deriveAge = (req: Request): number | null => {
  const ageHeader = req.headers["x-profile-age"] as string | undefined;
  if (ageHeader && !Number.isNaN(Number(ageHeader))) {
    return Math.max(0, Number(ageHeader));
  }
  const birthYearHeader = req.headers["x-profile-birthyear"] as string | undefined;
  if (birthYearHeader && !Number.isNaN(Number(birthYearHeader))) {
    const year = Number(birthYearHeader);
    const now = new Date().getFullYear();
    if (year > 1900 && year <= now) {
      return Math.max(0, now - year);
    }
  }
  return null;
};

const maturityClause = (kidMode: boolean, age: number | null) => {
  if (kidMode) {
    return {
      OR: [{ maturityRating: { in: kidSafeRatings } }, { maturityRating: null }],
    };
  }
  if (age !== null) {
    if (age < 13) {
      return {
        OR: [{ maturityRating: { in: kidSafeRatings } }, { maturityRating: null }],
      };
    }
    if (age < 18) {
      return {
        OR: [
          { maturityRating: { in: [...kidSafeRatings, ...teenSafeRatings] } },
          { maturityRating: null },
        ],
      };
    }
  }
  return undefined;
};

const resolvePlaybackUrl = async (url?: string | null) => {
  if (!url) return url;
  if (url.startsWith("s3://")) {
    const withoutScheme = url.replace("s3://", "");
    const [, ...rest] = withoutScheme.split("/");
    const key = rest.join("/");
    try {
      return await presignGetObject(key, 3600);
    } catch (err) {
      console.error("presign playback url failed", { key, err });
      return null;
    }
  }
  return url;
};

export const listPublicTitles = async (req: Request, res: Response) => {
  const countryOverride = (req.query.country as string | undefined)?.toUpperCase()?.trim();
  const country = countryOverride || resolveCountry(req);
  const kidMode = parseKidMode(req);
  const age = deriveAge(req);

  const titles = await prisma.title.findMany({
    where: {
      archived: false,
      pendingReview: false,
      OR: [
        { countryAvailability: { has: country } },
        { countryAvailability: { equals: [] } },
      ],
      AND: maturityClause(kidMode, age),
    },
    orderBy: [
      { releaseDate: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      episodes: {
        select: { id: true },
      },
      seasons: {
        select: { id: true },
      },
    },
  });

  return res.json({
    titles: titles.map((t) => ({
      id: t.id.toString(),
      name: t.name,
      type: t.type,
      description: t.description,
      genres: t.genres,
      cast: t.cast,
      crew: t.crew,
      language: t.language,
      maturityRating: t.maturityRating,
      runtimeMinutes: t.runtimeMinutes,
      countryAvailability: t.countryAvailability,
      isOriginal: t.isOriginal,
      posterUrl: t.posterUrl,
      thumbnailUrl: t.thumbnailUrl,
      trailerUrl: t.trailerUrl,
      introStartSec: t.introStartSec,
      introEndSec: t.introEndSec,
      archived: t.archived,
      pendingReview: t.pendingReview,
      isPpv: t.isPpv,
      ppvPriceNaira: t.ppvPriceNaira,
      ppvCurrency: t.ppvCurrency,
      ppvDescription: t.ppvDescription,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      episodeCount: t.episodes.length,
      seasonCount: t.seasons.length,
      releaseYear: t.releaseDate ? t.releaseDate.getUTCFullYear() : undefined,
    })),
  });
};

export const getTitleWithEpisodes = async (req: Request, res: Response) => {
  const titleId = req.params.id ? BigInt(req.params.id) : null;
  if (!titleId) {
    return res.status(400).json({ message: "Missing title id" });
  }
  const countryOverride = (req.query.country as string | undefined)?.toUpperCase()?.trim();
  const country = countryOverride || resolveCountry(req);
  const kidMode = parseKidMode(req);
  const age = deriveAge(req);

  const title = await prisma.title.findFirst({
    where: {
      id: titleId,
      archived: false,
      pendingReview: false,
      OR: [
        { countryAvailability: { has: country } },
        { countryAvailability: { equals: [] } },
      ],
      AND: maturityClause(kidMode, age),
  },
  include: {
    seasons: {
      orderBy: [{ seasonNumber: "asc" }],
    },
    episodes: {
      orderBy: [
        { seasonNumber: "asc" },
        { episodeNumber: "asc" },
      ],
        where: { pendingReview: false },
        include: {
          assetVersions: {
            where: { status: AssetStatus.READY },
          },
        },
      },
      assetVersions: {
        where: { status: AssetStatus.READY },
      },
    },
  });

  if (!title) {
    return res.status(404).json({ message: "Title not found" });
  }

  const trailerUrl = await resolvePlaybackUrl(title.trailerUrl);

  const assetVersions = await Promise.all(
    title.assetVersions.map(async (a) => ({
      id: a.id.toString(),
      rendition: a.rendition,
      url: await resolvePlaybackUrl(a.url),
      sizeBytes: a.sizeBytes ? Number(a.sizeBytes) : undefined,
      durationSec: a.durationSec ?? undefined,
      status: a.status,
    }))
  );

  const episodes = await Promise.all(
    title.episodes.map(async (e) => ({
      id: e.id.toString(),
      titleId: e.titleId.toString(),
      seasonNumber: e.seasonNumber,
      episodeNumber: e.episodeNumber,
      name: e.name,
      synopsis: e.synopsis,
      runtimeMinutes: e.runtimeMinutes,
      previewSpriteUrl: e.previewSpriteUrl,
      previewVttUrl: e.previewVttUrl,
      introStartSec: e.introStartSec,
      introEndSec: e.introEndSec,
      seasonId: e.seasonId ? e.seasonId.toString() : null,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      assetVersions: await Promise.all(
        (e as any).assetVersions?.map(async (a: any) => ({
          id: a.id.toString(),
          rendition: a.rendition,
          url: await resolvePlaybackUrl(a.url),
          sizeBytes: a.sizeBytes ? Number(a.sizeBytes) : undefined,
          durationSec: a.durationSec ?? undefined,
          status: a.status,
        })) ?? []
      ),
    }))
  );

  return res.json({
    title: {
      id: title.id.toString(),
      name: title.name,
      type: title.type,
      description: title.description,
      genres: title.genres,
      cast: title.cast,
      crew: title.crew,
      language: title.language,
      maturityRating: title.maturityRating,
      runtimeMinutes: title.runtimeMinutes,
      countryAvailability: title.countryAvailability,
      isOriginal: title.isOriginal,
      posterUrl: title.posterUrl,
      thumbnailUrl: title.thumbnailUrl,
      trailerUrl,
      introStartSec: title.introStartSec,
      introEndSec: title.introEndSec,
      previewSpriteUrl: title.previewSpriteUrl,
      previewVttUrl: title.previewVttUrl,
      archived: title.archived,
      createdAt: title.createdAt,
      updatedAt: title.updatedAt,
      releaseYear: title.releaseDate ? title.releaseDate.getUTCFullYear() : undefined,
      isPpv: title.isPpv,
      ppvPriceNaira: title.ppvPriceNaira,
      ppvCurrency: title.ppvCurrency,
      ppvDescription: title.ppvDescription,
      episodeCount: title.episodes.length,
      assetVersions,
      episodes,
      seasons: title.seasons.map((s) => ({
        id: s.id.toString(),
        titleId: s.titleId.toString(),
        seasonNumber: s.seasonNumber,
        name: s.name,
        description: s.description,
        releaseDate: s.releaseDate,
        status: s.status,
        posterUrl: s.posterUrl,
        thumbnailUrl: s.thumbnailUrl,
        previewSpriteUrl: s.previewSpriteUrl,
        previewVttUrl: s.previewVttUrl,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    },
  });
};

export const listEpisodesForTitle = async (req: Request, res: Response) => {
  const titleId = req.params.id ? BigInt(req.params.id) : null;
  if (!titleId) {
    return res.status(400).json({ message: "Missing title id" });
  }

  const episodes = await prisma.episode.findMany({
    where: { titleId },
    orderBy: [
      { seasonNumber: "asc" },
      { episodeNumber: "asc" },
    ],
    include: {
      assetVersions: {
        where: { status: AssetStatus.READY },
      },
    },
  });

  return res.json({
    episodes: episodes.map((e) => ({
      id: e.id.toString(),
      titleId: e.titleId.toString(),
      seasonNumber: e.seasonNumber,
      episodeNumber: e.episodeNumber,
      name: e.name,
      synopsis: e.synopsis,
      runtimeMinutes: e.runtimeMinutes,
      previewSpriteUrl: e.previewSpriteUrl,
      previewVttUrl: e.previewVttUrl,
      introStartSec: e.introStartSec,
      introEndSec: e.introEndSec,
      seasonId: e.seasonId ? e.seasonId.toString() : null,
      pendingReview: e.pendingReview,
      assetVersions: (e as any).assetVersions?.map((a: any) => ({
        id: a.id.toString(),
        rendition: a.rendition,
        url: a.url,
        sizeBytes: a.sizeBytes ? Number(a.sizeBytes) : undefined,
        durationSec: a.durationSec ?? undefined,
        status: a.status,
      })),
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
  });
};

export const createTitle = async (req: Request, res: Response) => {
  const {
    name,
    type,
    description,
    posterUrl,
    thumbnailUrl,
    trailerUrl,
    previewSpriteUrl,
    previewVttUrl,
  releaseYear,
  genres,
  cast,
  crew,
  language,
  maturityRating,
  runtimeMinutes,
  countryAvailability,
  isOriginal,
  pendingReview,
  introStartSec,
  introEndSec,
  isPpv,
  ppvPriceNaira,
  ppvCurrency,
  seasons,
} = req.body as {
  name?: string;
  type?: "MOVIE" | "SERIES";
  description?: string;
  posterUrl?: string;
    thumbnailUrl?: string;
    trailerUrl?: string;
    previewSpriteUrl?: string;
    previewVttUrl?: string;
    releaseYear?: number | string;
    genres?: string[];
    cast?: string[];
    crew?: string[];
    language?: string;
  maturityRating?: string;
  runtimeMinutes?: number | string;
  countryAvailability?: string[];
  isOriginal?: boolean;
  pendingReview?: boolean;
  introStartSec?: number;
  introEndSec?: number;
  isPpv?: boolean;
  ppvPriceNaira?: number | string | null;
  ppvCurrency?: string | null;
  seasons?: Array<{
    seasonNumber: number;
    name?: string;
    description?: string;
    releaseDate?: string;
    status?: string;
    posterUrl?: string;
    thumbnailUrl?: string;
    previewSpriteUrl?: string;
    previewVttUrl?: string;
  }>;
};
  if (!name || !type) {
    return res.status(400).json({ message: "name and type are required" });
  }
  const parsedReleaseDate =
    releaseYear && !Number.isNaN(Number(releaseYear)) ? new Date(`${releaseYear}-01-01T00:00:00.000Z`) : undefined;
  const parsedRuntime =
    runtimeMinutes !== undefined && !Number.isNaN(Number(runtimeMinutes)) ? Number(runtimeMinutes) : undefined;
  const title = await prisma.title.create({
    data: {
      name,
      type,
      description,
      posterUrl,
      thumbnailUrl,
      trailerUrl,
      previewSpriteUrl,
      previewVttUrl,
      introStartSec: parseOptionalNumber(introStartSec),
      introEndSec: parseOptionalNumber(introEndSec),
      releaseDate: parsedReleaseDate,
      genres: Array.isArray(genres) ? genres.map(String) : [],
      cast: Array.isArray(cast) ? cast.map(String) : [],
      crew: Array.isArray(crew) ? crew.map(String) : [],
      language: language ?? undefined,
      maturityRating: maturityRating ?? undefined,
      runtimeMinutes: parsedRuntime,
      countryAvailability: Array.isArray(countryAvailability) ? countryAvailability.map(String) : [],
      isOriginal: isOriginal ?? false,
      archived: false,
      pendingReview: pendingReview ?? false,
      isPpv: isPpv ?? false,
      ppvPriceNaira:
        ppvPriceNaira !== undefined && ppvPriceNaira !== null && !Number.isNaN(Number(ppvPriceNaira))
          ? Number(ppvPriceNaira)
          : null,
      ppvCurrency: ppvCurrency ?? null,
      seasons:
        type === "SERIES" && Array.isArray(seasons)
          ? {
              create: seasons.map((s) => ({
                seasonNumber: Number(s.seasonNumber),
                name: s.name ?? undefined,
                description: s.description ?? undefined,
                releaseDate: s.releaseDate ? new Date(s.releaseDate) : undefined,
                status: s.status ?? undefined,
                posterUrl: s.posterUrl ?? undefined,
                thumbnailUrl: s.thumbnailUrl ?? undefined,
                previewSpriteUrl: s.previewSpriteUrl ?? undefined,
                previewVttUrl: s.previewVttUrl ?? undefined,
              })),
            }
          : undefined,
    },
  });
  void auditLog({
    action: "TITLE_CREATE",
    resource: title.id.toString(),
    detail: { name, type, countryAvailability, maturityRating },
  });
  return res
    .status(201)
    .json({ title: { id: title.id.toString(), name: title.name, type: title.type } });
};

export const updateTitle = async (req: Request, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing title id" });
  const {
    name,
    description,
    posterUrl,
    thumbnailUrl,
    trailerUrl,
    previewSpriteUrl,
    previewVttUrl,
    archived,
    releaseYear,
    genres,
    cast,
    crew,
    language,
    maturityRating,
  runtimeMinutes,
  countryAvailability,
  isOriginal,
  pendingReview,
  introStartSec,
  introEndSec,
  isPpv,
  ppvPriceNaira,
  ppvCurrency,
} = req.body as {
  name?: string;
  description?: string;
  posterUrl?: string;
  thumbnailUrl?: string;
    trailerUrl?: string;
    previewSpriteUrl?: string;
    previewVttUrl?: string;
    archived?: boolean;
    releaseYear?: number | string;
    genres?: string[];
    cast?: string[];
    crew?: string[];
    language?: string;
    maturityRating?: string;
  runtimeMinutes?: number | string;
  countryAvailability?: string[];
  isOriginal?: boolean;
  pendingReview?: boolean;
  introStartSec?: number;
  introEndSec?: number;
  isPpv?: boolean;
  ppvPriceNaira?: number | string | null;
  ppvCurrency?: string | null;
};
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (posterUrl !== undefined) data.posterUrl = posterUrl;
  if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
  if (trailerUrl !== undefined) data.trailerUrl = trailerUrl;
  if (previewSpriteUrl !== undefined) data.previewSpriteUrl = previewSpriteUrl;
  if (previewVttUrl !== undefined) data.previewVttUrl = previewVttUrl;
  if (introStartSec !== undefined) data.introStartSec = parseOptionalNumber(introStartSec);
  if (introEndSec !== undefined) data.introEndSec = parseOptionalNumber(introEndSec);
  if (archived !== undefined) data.archived = archived;
  if (releaseYear !== undefined && !Number.isNaN(Number(releaseYear))) {
    data.releaseDate = new Date(`${releaseYear}-01-01T00:00:00.000Z`);
  }
  if (genres !== undefined) data.genres = Array.isArray(genres) ? genres.map(String) : [];
  if (cast !== undefined) data.cast = Array.isArray(cast) ? cast.map(String) : [];
  if (crew !== undefined) data.crew = Array.isArray(crew) ? crew.map(String) : [];
  if (language !== undefined) data.language = language;
  if (maturityRating !== undefined) data.maturityRating = maturityRating;
  if (runtimeMinutes !== undefined && !Number.isNaN(Number(runtimeMinutes))) {
    data.runtimeMinutes = Number(runtimeMinutes);
  }
  if (countryAvailability !== undefined) {
    data.countryAvailability = Array.isArray(countryAvailability) ? countryAvailability.map(String) : [];
  }
  if (isOriginal !== undefined) data.isOriginal = isOriginal;
  if (pendingReview !== undefined) data.pendingReview = pendingReview;
  if (isPpv !== undefined) data.isPpv = isPpv;
  if (ppvPriceNaira !== undefined) {
    data.ppvPriceNaira =
      ppvPriceNaira !== null && !Number.isNaN(Number(ppvPriceNaira)) ? Number(ppvPriceNaira) : null;
  }
  if (ppvCurrency !== undefined) data.ppvCurrency = ppvCurrency;
  try {
    const title = await prisma.title.update({ where: { id }, data });
    void auditLog({
      action: "TITLE_UPDATE",
      resource: id.toString(),
      detail: { fields: Object.keys(data) },
    });
    return res.json({ title: { id: title.id.toString(), name: title.name, type: title.type } });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return res.status(404).json({ message: "Title not found" });
    }
    throw err;
  }
};

export const publishTitle = async (req: Request, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing title id" });
  const publishEpisodes = (req.body as any)?.publishEpisodes ?? true;
  const title = await prisma.title.update({
    where: { id },
    data: { archived: false, pendingReview: false },
  });
  if (publishEpisodes && title.type === "SERIES") {
    await prisma.episode.updateMany({
      where: { titleId: id },
      data: { pendingReview: false },
    });
  }
  void auditLog({
    action: "TITLE_PUBLISH",
    resource: id.toString(),
    detail: { publishEpisodes },
  });
  return res.json({ title: { id: title.id.toString(), name: title.name, type: title.type, pendingReview: title.pendingReview, archived: title.archived } });
};

export const createEpisode = async (req: Request, res: Response) => {
  const titleId = req.params.id ? BigInt(req.params.id) : null;
  if (!titleId) return res.status(400).json({ message: "Missing title id" });
  const {
    seasonNumber,
    episodeNumber,
    name,
    synopsis,
    runtimeMinutes,
    previewSpriteUrl,
    previewVttUrl,
    introStartSec,
    introEndSec,
  } = req.body as {
    seasonNumber?: number;
    episodeNumber?: number;
    name?: string;
    synopsis?: string;
    runtimeMinutes?: number | string;
    previewSpriteUrl?: string;
    previewVttUrl?: string;
    introStartSec?: number;
    introEndSec?: number;
    pendingReview?: boolean;
  };
  if (!seasonNumber || !episodeNumber || !name) {
    return res.status(400).json({ message: "seasonNumber, episodeNumber, and name are required" });
  }
  const season = await prisma.season.upsert({
    where: {
      titleId_seasonNumber: {
        titleId,
        seasonNumber,
      },
    },
    update: {},
    create: {
      titleId,
      seasonNumber,
    },
  });
  const ep = await prisma.episode.create({
    data: {
      titleId,
      seasonId: season.id,
      seasonNumber,
      episodeNumber,
      name,
      synopsis,
      previewSpriteUrl,
      previewVttUrl,
      introStartSec: parseOptionalNumber(introStartSec),
      introEndSec: parseOptionalNumber(introEndSec),
      runtimeMinutes:
        runtimeMinutes !== undefined && !Number.isNaN(Number(runtimeMinutes))
          ? Number(runtimeMinutes)
          : undefined,
      pendingReview: (req.body as any)?.pendingReview ?? true,
    },
  });
  void auditLog({
    action: "EPISODE_CREATE",
    resource: ep.id.toString(),
    detail: { titleId: ep.titleId.toString(), seasonNumber, episodeNumber },
  });
  return res.status(201).json({
    episode: {
      id: ep.id.toString(),
      titleId: ep.titleId.toString(),
      seasonId: ep.seasonId ? ep.seasonId.toString() : null,
      seasonNumber: ep.seasonNumber,
      episodeNumber: ep.episodeNumber,
      name: ep.name,
      synopsis: ep.synopsis,
      previewSpriteUrl: ep.previewSpriteUrl,
      previewVttUrl: ep.previewVttUrl,
      introStartSec: ep.introStartSec,
      introEndSec: ep.introEndSec,
      runtimeMinutes: ep.runtimeMinutes,
      pendingReview: ep.pendingReview,
    },
  });
};

export const updateEpisode = async (req: Request, res: Response) => {
  const episodeId = req.params.episodeId ? BigInt(req.params.episodeId) : null;
  if (!episodeId) return res.status(400).json({ message: "Missing episode id" });
  const {
    seasonNumber,
    episodeNumber,
    name,
    synopsis,
    runtimeMinutes,
    pendingReview,
    previewSpriteUrl,
    previewVttUrl,
    introStartSec,
    introEndSec,
  } = req.body as {
    seasonNumber?: number;
    episodeNumber?: number;
    name?: string;
    synopsis?: string;
    runtimeMinutes?: number | string;
    pendingReview?: boolean;
    previewSpriteUrl?: string;
    previewVttUrl?: string;
    introStartSec?: number;
    introEndSec?: number;
  };
  const existing = await prisma.episode.findUnique({ where: { id: episodeId }, select: { titleId: true } });
  if (!existing) return res.status(404).json({ message: "Episode not found" });
  const data: any = {};
  if (seasonNumber !== undefined) {
    const season = await prisma.season.upsert({
      where: {
        titleId_seasonNumber: {
          titleId: existing.titleId,
          seasonNumber,
        },
      },
      update: {},
      create: { titleId: existing.titleId, seasonNumber },
    });
    data.seasonNumber = seasonNumber;
    data.seasonId = season.id;
  }
  if (episodeNumber !== undefined) data.episodeNumber = episodeNumber;
  if (name !== undefined) data.name = name;
  if (synopsis !== undefined) data.synopsis = synopsis;
  if (previewSpriteUrl !== undefined) data.previewSpriteUrl = previewSpriteUrl;
  if (previewVttUrl !== undefined) data.previewVttUrl = previewVttUrl;
  if (introStartSec !== undefined) data.introStartSec = parseOptionalNumber(introStartSec);
  if (introEndSec !== undefined) data.introEndSec = parseOptionalNumber(introEndSec);
  if (runtimeMinutes !== undefined && !Number.isNaN(Number(runtimeMinutes))) {
    data.runtimeMinutes = Number(runtimeMinutes);
  }
   if (pendingReview !== undefined) data.pendingReview = pendingReview;
  const ep = await prisma.episode.update({ where: { id: episodeId }, data });
  void auditLog({
    action: "EPISODE_UPDATE",
    resource: ep.id.toString(),
    detail: { fields: Object.keys(data) },
  });
  return res.json({
    episode: {
      id: ep.id.toString(),
      titleId: ep.titleId.toString(),
      seasonNumber: ep.seasonNumber,
      episodeNumber: ep.episodeNumber,
      name: ep.name,
      synopsis: ep.synopsis,
      previewSpriteUrl: ep.previewSpriteUrl,
      previewVttUrl: ep.previewVttUrl,
      introStartSec: ep.introStartSec,
      introEndSec: ep.introEndSec,
      seasonId: ep.seasonId ? ep.seasonId.toString() : null,
      runtimeMinutes: ep.runtimeMinutes,
      pendingReview: ep.pendingReview,
    },
  });
};

export const deleteEpisode = async (req: Request, res: Response) => {
  const episodeId = req.params.episodeId ? BigInt(req.params.episodeId) : null;
  if (!episodeId) return res.status(400).json({ message: "Missing episode id" });
  await prisma.$transaction([
    prisma.assetVersion.deleteMany({ where: { episodeId } }),
    prisma.uploadJob.deleteMany({ where: { episodeId } }),
    prisma.engagementEvent.deleteMany({ where: { episodeId } }),
    prisma.episode.delete({ where: { id: episodeId } }),
  ]);
  void auditLog({ action: "EPISODE_DELETE", resource: episodeId.toString() });
  return res.status(204).send();
};

export const listSeasonsForTitle = async (req: Request, res: Response) => {
  const titleId = req.params.id ? BigInt(req.params.id) : null;
  if (!titleId) return res.status(400).json({ message: "Missing title id" });
  const seasons = await prisma.season.findMany({
    where: { titleId },
    orderBy: [{ seasonNumber: "asc" }],
  });
  return res.json({
    seasons: seasons.map((s) => ({
      id: s.id.toString(),
      titleId: s.titleId.toString(),
      seasonNumber: s.seasonNumber,
      name: s.name,
      description: s.description,
      releaseDate: s.releaseDate,
      status: s.status,
      posterUrl: s.posterUrl,
      thumbnailUrl: s.thumbnailUrl,
      previewSpriteUrl: s.previewSpriteUrl,
      previewVttUrl: s.previewVttUrl,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  });
};

export const upsertSeasonsForTitle = async (req: Request, res: Response) => {
  const titleId = req.params.id ? BigInt(req.params.id) : null;
  if (!titleId) return res.status(400).json({ message: "Missing title id" });
  const seasons = ((req.body as any)?.seasons ?? []) as Array<{
    seasonNumber: number;
    name?: string;
    description?: string;
    releaseDate?: string;
    status?: string;
    posterUrl?: string;
    thumbnailUrl?: string;
    previewSpriteUrl?: string;
    previewVttUrl?: string;
  }>;
  if (!Array.isArray(seasons) || !seasons.length) {
    return res.status(400).json({ message: "seasons array is required" });
  }
  const result = [];
  for (const s of seasons) {
    if (!s.seasonNumber && s.seasonNumber !== 0) continue;
    const season = await prisma.season.upsert({
      where: {
        titleId_seasonNumber: {
          titleId,
          seasonNumber: Number(s.seasonNumber),
        },
      },
      update: {
        name: s.name ?? undefined,
        description: s.description ?? undefined,
        releaseDate: s.releaseDate ? new Date(s.releaseDate) : undefined,
        status: s.status ?? undefined,
        posterUrl: s.posterUrl ?? undefined,
        thumbnailUrl: s.thumbnailUrl ?? undefined,
        previewSpriteUrl: s.previewSpriteUrl ?? undefined,
        previewVttUrl: s.previewVttUrl ?? undefined,
      },
      create: {
        titleId,
        seasonNumber: Number(s.seasonNumber),
        name: s.name ?? undefined,
        description: s.description ?? undefined,
        releaseDate: s.releaseDate ? new Date(s.releaseDate) : undefined,
        status: s.status ?? undefined,
        posterUrl: s.posterUrl ?? undefined,
        thumbnailUrl: s.thumbnailUrl ?? undefined,
        previewSpriteUrl: s.previewSpriteUrl ?? undefined,
        previewVttUrl: s.previewVttUrl ?? undefined,
      },
    });
    result.push(season);
  }
  void auditLog({
    action: "SEASON_UPSERT",
    resource: titleId.toString(),
    detail: { count: result.length },
  });
  return res.json({
    seasons: result.map((s) => ({
      id: s.id.toString(),
      titleId: s.titleId.toString(),
      seasonNumber: s.seasonNumber,
      name: s.name,
      description: s.description,
      releaseDate: s.releaseDate,
      status: s.status,
      posterUrl: s.posterUrl,
      thumbnailUrl: s.thumbnailUrl,
      previewSpriteUrl: s.previewSpriteUrl,
      previewVttUrl: s.previewVttUrl,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
  });
};

export const updateSeason = async (req: Request, res: Response) => {
  const seasonId = req.params.seasonId ? BigInt(req.params.seasonId) : null;
  if (!seasonId) return res.status(400).json({ message: "Missing season id" });
  const { seasonNumber, name, description, releaseDate, status, posterUrl, thumbnailUrl, previewSpriteUrl, previewVttUrl } =
    req.body as {
      seasonNumber?: number;
      name?: string;
      description?: string;
      releaseDate?: string;
      status?: string;
      posterUrl?: string;
      thumbnailUrl?: string;
    previewSpriteUrl?: string;
    previewVttUrl?: string;
  };
  const data: any = {};
  if (seasonNumber !== undefined) data.seasonNumber = seasonNumber;
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (releaseDate !== undefined) data.releaseDate = releaseDate ? new Date(releaseDate) : null;
  if (status !== undefined) data.status = status;
  if (posterUrl !== undefined) data.posterUrl = posterUrl;
  if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
  if (previewSpriteUrl !== undefined) data.previewSpriteUrl = previewSpriteUrl;
  if (previewVttUrl !== undefined) data.previewVttUrl = previewVttUrl;
  const season = await prisma.season.update({ where: { id: seasonId }, data });
  void auditLog({
    action: "SEASON_UPDATE",
    resource: seasonId.toString(),
    detail: { fields: Object.keys(data) },
  });
  return res.json({
    season: {
      id: season.id.toString(),
      titleId: season.titleId.toString(),
      seasonNumber: season.seasonNumber,
      name: season.name,
      description: season.description,
      releaseDate: season.releaseDate,
      status: season.status,
      posterUrl: season.posterUrl,
      thumbnailUrl: season.thumbnailUrl,
      previewSpriteUrl: season.previewSpriteUrl,
      previewVttUrl: season.previewVttUrl,
      createdAt: season.createdAt,
      updatedAt: season.updatedAt,
    },
  });
};

export const deleteSeason = async (req: Request, res: Response) => {
  const seasonId = req.params.seasonId ? BigInt(req.params.seasonId) : null;
  if (!seasonId) return res.status(400).json({ message: "Missing season id" });

  const episodes = await prisma.episode.findMany({
    where: { seasonId },
    select: { id: true },
  });
  const episodeIds = episodes.map((e) => e.id);

  await prisma.$transaction([
    prisma.assetVersion.deleteMany({ where: { episodeId: { in: episodeIds } } }),
    prisma.uploadJob.deleteMany({ where: { episodeId: { in: episodeIds } } }),
    prisma.engagementEvent.deleteMany({ where: { episodeId: { in: episodeIds } } }),
    prisma.episode.deleteMany({ where: { id: { in: episodeIds } } }),
    prisma.season.delete({ where: { id: seasonId } }),
  ]);

  void auditLog({ action: "SEASON_DELETE", resource: seasonId.toString(), detail: { episodes: episodeIds.length } });
  return res.status(204).send();
};

export const presignAsset = async (req: Request, res: Response) => {
  const { contentType, kind } = req.body as {
    contentType?: string;
    kind?: "poster" | "thumbnail" | "trailer" | "previewSprite" | "previewVtt";
  };
  const keyPrefix = kind ?? "asset";
  const key = `${keyPrefix}/${Date.now()}-${crypto.randomUUID()}`;
  try {
    console.log("presignAsset config", {
      region: process.env.S3_REGION,
      bucket: process.env.S3_BUCKET,
      endpoint: process.env.S3_ENDPOINT,
      awsRegion: process.env.AWS_REGION,
    });
    const url = await presignPutObject(key, contentType ?? "application/octet-stream");
    const publicUrl =
      config.s3.bucket && config.s3.region
        ? `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`
        : undefined;
    const response = { key, url, publicUrl };
    void auditLog({
      action: "ASSET_PRESIGN",
      resource: key,
      detail: { kind, publicUrl },
    });
    return res.json(response);
  } catch (err: any) {
    console.error("presignAsset error", err);
    return res.status(500).json({ message: "Failed to presign asset upload", error: err?.message });
  }
};

export const presignAssetRead = async (req: Request, res: Response) => {
  const { key, expiresIn } = req.body as { key?: string; expiresIn?: number };
  if (!key) {
    return res.status(400).json({ message: "key is required" });
  }
  const ttl = expiresIn && !Number.isNaN(Number(expiresIn)) ? Math.min(Number(expiresIn), 86400) : 3600;
  try {
    const url = await presignGetObject(key, ttl);
    return res.json({ url });
  } catch (err: any) {
    console.error("presignAssetRead error", err);
    return res.status(500).json({ message: "Failed to presign asset read", error: err?.message });
  }
};

export const deleteTitle = async (req: Request, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing title id" });

  await prisma.$transaction([
    prisma.episode.deleteMany({ where: { titleId: id } }),
    prisma.assetVersion.deleteMany({ where: { titleId: id } }),
    prisma.uploadJob.deleteMany({ where: { titleId: id } }),
    prisma.title.delete({ where: { id } }),
  ]);

  void auditLog({ action: "TITLE_DELETE", resource: id.toString() });
  return res.status(204).send();
};

const s3Delete = async (keys: string[]) => {
  if (!config.s3.bucket || !keys.length) return;
  const client = new S3Client({
    region: config.s3.region || process.env.AWS_REGION || "eu-north-1",
    endpoint: config.s3.endpoint && config.s3.endpoint.trim() !== "" ? config.s3.endpoint : undefined,
    forcePathStyle: !!config.s3.endpoint,
    credentials:
      config.s3.accessKeyId && config.s3.secretAccessKey
        ? { accessKeyId: config.s3.accessKeyId, secretAccessKey: config.s3.secretAccessKey }
        : undefined,
  });
  const unique = Array.from(new Set(keys.filter(Boolean)));
  for (let i = 0; i < unique.length; i += 900) {
    const batch = unique.slice(i, i + 900);
    const cmd = new DeleteObjectsCommand({
      Bucket: config.s3.bucket,
      Delete: { Objects: batch.map((k) => ({ Key: k })) },
    });
    await client.send(cmd);
  }
};

const extractKeyFromUrl = (url?: string | null) => {
  if (!url) return null;
  try {
    if (url.startsWith("s3://")) {
      const without = url.replace("s3://", "");
      const [bucket, ...rest] = without.split("/");
      if (bucket === config.s3.bucket) {
        return rest.join("/");
      }
      return null;
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const u = new URL(url);
      const path = u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
      // subdomain style bucket.s3.region.amazonaws.com/key
      if (u.hostname.startsWith(`${config.s3.bucket}.`)) {
        return decodeURIComponent(path);
      }
    }
  } catch {
    return null;
  }
  return null;
};

export const purgeAllTitles = async (_req: Request, res: Response) => {
  try {
    const titles = await prisma.title.findMany({
      select: {
        posterUrl: true,
        thumbnailUrl: true,
        trailerUrl: true,
        previewSpriteUrl: true,
        previewVttUrl: true,
      },
    });
    const assets = await prisma.assetVersion.findMany({ select: { url: true } });
    const urls = [
      ...titles.flatMap((t) => [
        t.posterUrl,
        t.thumbnailUrl,
        t.trailerUrl,
        t.previewSpriteUrl,
        t.previewVttUrl,
      ]),
      ...assets.map((a) => a.url),
    ].filter(Boolean) as string[];
    const keys = urls
      .map((u) => extractKeyFromUrl(u))
      .filter((k): k is string => !!k);

    // Delete DB records
    await prisma.$transaction([
      prisma.assetVersion.deleteMany({}),
      prisma.episode.deleteMany({}),
      prisma.season.deleteMany({}),
      prisma.titleSimilarity.deleteMany({}),
      prisma.titleEmbedding.deleteMany({}),
      prisma.popularitySnapshot.deleteMany({}),
      prisma.uploadJob.deleteMany({}),
      prisma.title.deleteMany({}),
    ]);

    // Delete S3 objects
    if (keys.length) {
      await s3Delete(keys);
    }

    void auditLog({ action: "TITLE_PURGE_ALL", resource: "all" });
    return res.json({ message: "All titles purged", deletedKeys: keys.length });
  } catch (err) {
    console.error("purgeAllTitles error", err);
    return res.status(500).json({ message: "Failed to purge titles" });
  }
};
