import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import crypto from "crypto";
import { presignPutObject } from "../upload/s3.js";

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
  const { name, type, description, posterUrl, thumbnailUrl, trailerUrl } = req.body as {
    name?: string;
    type?: "MOVIE" | "SERIES";
    description?: string;
    posterUrl?: string;
    thumbnailUrl?: string;
    trailerUrl?: string;
  };
  if (!name || !type) {
    return res.status(400).json({ message: "name and type are required" });
  }
  const title = await prisma.title.create({
    data: {
      name,
      type,
      description,
      posterUrl,
      thumbnailUrl,
      trailerUrl,
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
  const { name, description, posterUrl, thumbnailUrl, trailerUrl, archived } = req.body as {
    name?: string;
    description?: string;
    posterUrl?: string;
    thumbnailUrl?: string;
    trailerUrl?: string;
    archived?: boolean;
  };
  const data: any = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (posterUrl !== undefined) data.posterUrl = posterUrl;
  if (thumbnailUrl !== undefined) data.thumbnailUrl = thumbnailUrl;
  if (trailerUrl !== undefined) data.trailerUrl = trailerUrl;
  if (archived !== undefined) data.archived = archived;
  const title = await prisma.title.update({ where: { id }, data });
  return res.json({ title: { id: title.id.toString(), name: title.name, type: title.type } });
};

export const presignAsset = async (req: Request, res: Response) => {
  const { contentType, kind } = req.body as { contentType?: string; kind?: "poster" | "thumbnail" | "trailer" };
  const keyPrefix = kind ?? "asset";
  const key = `${keyPrefix}/${Date.now()}-${crypto.randomUUID()}`;
  try {
    const url = await presignPutObject(key, contentType ?? "application/octet-stream");
    return res.json({ key, url });
  } catch (err: any) {
    return res.status(500).json({ message: "Failed to presign asset upload", error: err?.message });
  }
};

export const deleteTitle = async (req: Request, res: Response) => {
  const id = req.params.id ? BigInt(req.params.id) : null;
  if (!id) return res.status(400).json({ message: "Missing title id" });
  await prisma.title.delete({ where: { id } });
  return res.status(204).send();
};
