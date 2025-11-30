import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import crypto from "crypto";
import { presignPutObject, presignGetObject } from "../upload/s3.js";
import { config } from "../config.js";

export const listTitles = async (_req: Request, res: Response) => {
  const titles = await prisma.title.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      episodes: {
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
      posterUrl: t.posterUrl,
      thumbnailUrl: t.thumbnailUrl,
      trailerUrl: t.trailerUrl,
      archived: t.archived,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      episodeCount: t.episodes.length,
    })),
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
  });

  return res.json({
    episodes: episodes.map((e) => ({
      id: e.id.toString(),
      titleId: e.titleId.toString(),
      seasonNumber: e.seasonNumber,
      episodeNumber: e.episodeNumber,
      name: e.name,
      synopsis: e.synopsis,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    })),
  });
};

export const createTitle = async (req: Request, res: Response) => {
  const { name, type, description, posterUrl, thumbnailUrl, trailerUrl, releaseYear } = req.body as {
    name?: string;
    type?: "MOVIE" | "SERIES";
    description?: string;
    posterUrl?: string;
    thumbnailUrl?: string;
    trailerUrl?: string;
    releaseYear?: number | string;
  };
  if (!name || !type) {
    return res.status(400).json({ message: "name and type are required" });
  }
  const parsedReleaseDate =
    releaseYear && !Number.isNaN(Number(releaseYear)) ? new Date(`${releaseYear}-01-01T00:00:00.000Z`) : undefined;
  const title = await prisma.title.create({
    data: {
      name,
      type,
      description,
      posterUrl,
      thumbnailUrl,
      trailerUrl,
      releaseDate: parsedReleaseDate,
      archived: false,
    },
  });
  return res
    .status(201)
    .json({ title: { id: title.id.toString(), name: title.name, type: title.type } });
};

export const updateTitle = async (req: Request, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing title id" });
  const { name, description, posterUrl, thumbnailUrl, trailerUrl, archived, releaseYear } = req.body as {
    name?: string;
    description?: string;
    posterUrl?: string;
    thumbnailUrl?: string;
    trailerUrl?: string;
    archived?: boolean;
    releaseYear?: number | string;
  };
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (posterUrl !== undefined) data.posterUrl = posterUrl;
  if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
  if (trailerUrl !== undefined) data.trailerUrl = trailerUrl;
  if (archived !== undefined) data.archived = archived;
  if (releaseYear !== undefined && !Number.isNaN(Number(releaseYear))) {
    data.releaseDate = new Date(`${releaseYear}-01-01T00:00:00.000Z`);
  }
  const title = await prisma.title.update({ where: { id }, data });
  return res.json({ title: { id: title.id.toString(), name: title.name, type: title.type } });
};

export const createEpisode = async (req: Request, res: Response) => {
  const titleId = req.params.id ? BigInt(req.params.id) : null;
  if (!titleId) return res.status(400).json({ message: "Missing title id" });
  const { seasonNumber, episodeNumber, name, synopsis } = req.body as {
    seasonNumber?: number;
    episodeNumber?: number;
    name?: string;
    synopsis?: string;
  };
  if (!seasonNumber || !episodeNumber || !name) {
    return res.status(400).json({ message: "seasonNumber, episodeNumber, and name are required" });
  }
  const ep = await prisma.episode.create({
    data: { titleId, seasonNumber, episodeNumber, name, synopsis },
  });
  return res.status(201).json({
    episode: {
      id: ep.id.toString(),
      titleId: ep.titleId.toString(),
      seasonNumber: ep.seasonNumber,
      episodeNumber: ep.episodeNumber,
      name: ep.name,
      synopsis: ep.synopsis,
    },
  });
};

export const updateEpisode = async (req: Request, res: Response) => {
  const episodeId = req.params.episodeId ? BigInt(req.params.episodeId) : null;
  if (!episodeId) return res.status(400).json({ message: "Missing episode id" });
  const { seasonNumber, episodeNumber, name, synopsis } = req.body as {
    seasonNumber?: number;
    episodeNumber?: number;
    name?: string;
    synopsis?: string;
  };
  const data: any = {};
  if (seasonNumber !== undefined) data.seasonNumber = seasonNumber;
  if (episodeNumber !== undefined) data.episodeNumber = episodeNumber;
  if (name !== undefined) data.name = name;
  if (synopsis !== undefined) data.synopsis = synopsis;
  const ep = await prisma.episode.update({ where: { id: episodeId }, data });
  return res.json({
    episode: {
      id: ep.id.toString(),
      titleId: ep.titleId.toString(),
      seasonNumber: ep.seasonNumber,
      episodeNumber: ep.episodeNumber,
      name: ep.name,
      synopsis: ep.synopsis,
    },
  });
};

export const presignAsset = async (req: Request, res: Response) => {
  const { contentType, kind } = req.body as { contentType?: string; kind?: "poster" | "thumbnail" | "trailer" };
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
    return res.json({ key, url, publicUrl });
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
  await prisma.title.delete({ where: { id } });
  return res.status(204).send();
};
