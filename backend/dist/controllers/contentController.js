import crypto from "crypto";
import { prisma } from "../prisma.js";
import { presignPutObject, presignGetObject } from "../upload/s3.js";
import { config } from "../config.js";
import { resolveCountry } from "../utils/country.js";
import { auditLog } from "../utils/audit.js";
const kidSafeRatings = ["G", "PG", "TV-Y", "TV-G", "TV-PG", "PG-13"];
const teenSafeRatings = ["PG-13", "TV-14"];
export const listTitles = async (_req, res) => {
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
            archived: t.archived,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            episodeCount: t.episodes.length,
            releaseYear: t.releaseDate ? t.releaseDate.getUTCFullYear() : undefined,
        })),
    });
};
const parseKidMode = (req) => {
    const q = req.query.kidMode?.toLowerCase();
    if (q === "true" || q === "1")
        return true;
    const header = req.headers["x-kid-mode"]?.toLowerCase();
    if (header === "true" || header === "1")
        return true;
    return false;
};
const deriveAge = (req) => {
    const ageHeader = req.headers["x-profile-age"];
    if (ageHeader && !Number.isNaN(Number(ageHeader))) {
        return Math.max(0, Number(ageHeader));
    }
    const birthYearHeader = req.headers["x-profile-birthyear"];
    if (birthYearHeader && !Number.isNaN(Number(birthYearHeader))) {
        const year = Number(birthYearHeader);
        const now = new Date().getFullYear();
        if (year > 1900 && year <= now) {
            return Math.max(0, now - year);
        }
    }
    return null;
};
const maturityClause = (kidMode, age) => {
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
export const listPublicTitles = async (req, res) => {
    const countryOverride = req.query.country?.toUpperCase()?.trim();
    const country = countryOverride || resolveCountry(req);
    const kidMode = parseKidMode(req);
    const age = deriveAge(req);
    const titles = await prisma.title.findMany({
        where: {
            archived: false,
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
            archived: t.archived,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            episodeCount: t.episodes.length,
            releaseYear: t.releaseDate ? t.releaseDate.getUTCFullYear() : undefined,
        })),
    });
};
export const getTitleWithEpisodes = async (req, res) => {
    const titleId = req.params.id ? BigInt(req.params.id) : null;
    if (!titleId) {
        return res.status(400).json({ message: "Missing title id" });
    }
    const countryOverride = req.query.country?.toUpperCase()?.trim();
    const country = countryOverride || resolveCountry(req);
    const kidMode = parseKidMode(req);
    const age = deriveAge(req);
    const title = await prisma.title.findFirst({
        where: {
            id: titleId,
            archived: false,
            OR: [
                { countryAvailability: { has: country } },
                { countryAvailability: { equals: [] } },
            ],
            AND: maturityClause(kidMode, age),
        },
        include: {
            episodes: {
                orderBy: [
                    { seasonNumber: "asc" },
                    { episodeNumber: "asc" },
                ],
            },
        },
    });
    if (!title) {
        return res.status(404).json({ message: "Title not found" });
    }
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
            trailerUrl: title.trailerUrl,
            archived: title.archived,
            createdAt: title.createdAt,
            updatedAt: title.updatedAt,
            releaseYear: title.releaseDate ? title.releaseDate.getUTCFullYear() : undefined,
            episodeCount: title.episodes.length,
            episodes: title.episodes.map((e) => ({
                id: e.id.toString(),
                titleId: e.titleId.toString(),
                seasonNumber: e.seasonNumber,
                episodeNumber: e.episodeNumber,
                name: e.name,
                synopsis: e.synopsis,
                runtimeMinutes: e.runtimeMinutes,
                createdAt: e.createdAt,
                updatedAt: e.updatedAt,
            })),
        },
    });
};
export const listEpisodesForTitle = async (req, res) => {
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
            runtimeMinutes: e.runtimeMinutes,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
        })),
    });
};
export const createTitle = async (req, res) => {
    const { name, type, description, posterUrl, thumbnailUrl, trailerUrl, releaseYear, genres, cast, crew, language, maturityRating, runtimeMinutes, countryAvailability, isOriginal, } = req.body;
    if (!name || !type) {
        return res.status(400).json({ message: "name and type are required" });
    }
    const parsedReleaseDate = releaseYear && !Number.isNaN(Number(releaseYear)) ? new Date(`${releaseYear}-01-01T00:00:00.000Z`) : undefined;
    const parsedRuntime = runtimeMinutes !== undefined && !Number.isNaN(Number(runtimeMinutes)) ? Number(runtimeMinutes) : undefined;
    const title = await prisma.title.create({
        data: {
            name,
            type,
            description,
            posterUrl,
            thumbnailUrl,
            trailerUrl,
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
export const updateTitle = async (req, res) => {
    const id = req.params.id ? BigInt(req.params.id) : null;
    if (!id)
        return res.status(400).json({ message: "Missing title id" });
    const { name, description, posterUrl, thumbnailUrl, trailerUrl, archived, releaseYear, genres, cast, crew, language, maturityRating, runtimeMinutes, countryAvailability, isOriginal, } = req.body;
    const data = {};
    if (name !== undefined)
        data.name = name;
    if (description !== undefined)
        data.description = description;
    if (posterUrl !== undefined)
        data.posterUrl = posterUrl;
    if (thumbnailUrl !== undefined)
        data.thumbnailUrl = thumbnailUrl;
    if (trailerUrl !== undefined)
        data.trailerUrl = trailerUrl;
    if (archived !== undefined)
        data.archived = archived;
    if (releaseYear !== undefined && !Number.isNaN(Number(releaseYear))) {
        data.releaseDate = new Date(`${releaseYear}-01-01T00:00:00.000Z`);
    }
    if (genres !== undefined)
        data.genres = Array.isArray(genres) ? genres.map(String) : [];
    if (cast !== undefined)
        data.cast = Array.isArray(cast) ? cast.map(String) : [];
    if (crew !== undefined)
        data.crew = Array.isArray(crew) ? crew.map(String) : [];
    if (language !== undefined)
        data.language = language;
    if (maturityRating !== undefined)
        data.maturityRating = maturityRating;
    if (runtimeMinutes !== undefined && !Number.isNaN(Number(runtimeMinutes))) {
        data.runtimeMinutes = Number(runtimeMinutes);
    }
    if (countryAvailability !== undefined) {
        data.countryAvailability = Array.isArray(countryAvailability) ? countryAvailability.map(String) : [];
    }
    if (isOriginal !== undefined)
        data.isOriginal = isOriginal;
    const title = await prisma.title.update({ where: { id }, data });
    void auditLog({
        action: "TITLE_UPDATE",
        resource: id.toString(),
        detail: { fields: Object.keys(data) },
    });
    return res.json({ title: { id: title.id.toString(), name: title.name, type: title.type } });
};
export const createEpisode = async (req, res) => {
    const titleId = req.params.id ? BigInt(req.params.id) : null;
    if (!titleId)
        return res.status(400).json({ message: "Missing title id" });
    const { seasonNumber, episodeNumber, name, synopsis, runtimeMinutes } = req.body;
    if (!seasonNumber || !episodeNumber || !name) {
        return res.status(400).json({ message: "seasonNumber, episodeNumber, and name are required" });
    }
    const ep = await prisma.episode.create({
        data: {
            titleId,
            seasonNumber,
            episodeNumber,
            name,
            synopsis,
            runtimeMinutes: runtimeMinutes !== undefined && !Number.isNaN(Number(runtimeMinutes))
                ? Number(runtimeMinutes)
                : undefined,
        },
    });
    return res.status(201).json({
        episode: {
            id: ep.id.toString(),
            titleId: ep.titleId.toString(),
            seasonNumber: ep.seasonNumber,
            episodeNumber: ep.episodeNumber,
            name: ep.name,
            synopsis: ep.synopsis,
            runtimeMinutes: ep.runtimeMinutes,
        },
    });
    void auditLog({
        action: "EPISODE_CREATE",
        resource: ep.id.toString(),
        detail: { titleId: ep.titleId.toString(), seasonNumber, episodeNumber },
    });
};
export const updateEpisode = async (req, res) => {
    const episodeId = req.params.episodeId ? BigInt(req.params.episodeId) : null;
    if (!episodeId)
        return res.status(400).json({ message: "Missing episode id" });
    const { seasonNumber, episodeNumber, name, synopsis, runtimeMinutes } = req.body;
    const data = {};
    if (seasonNumber !== undefined)
        data.seasonNumber = seasonNumber;
    if (episodeNumber !== undefined)
        data.episodeNumber = episodeNumber;
    if (name !== undefined)
        data.name = name;
    if (synopsis !== undefined)
        data.synopsis = synopsis;
    if (runtimeMinutes !== undefined && !Number.isNaN(Number(runtimeMinutes))) {
        data.runtimeMinutes = Number(runtimeMinutes);
    }
    const ep = await prisma.episode.update({ where: { id: episodeId }, data });
    return res.json({
        episode: {
            id: ep.id.toString(),
            titleId: ep.titleId.toString(),
            seasonNumber: ep.seasonNumber,
            episodeNumber: ep.episodeNumber,
            name: ep.name,
            synopsis: ep.synopsis,
            runtimeMinutes: ep.runtimeMinutes,
        },
    });
    void auditLog({
        action: "EPISODE_UPDATE",
        resource: ep.id.toString(),
        detail: { fields: Object.keys(data) },
    });
};
export const presignAsset = async (req, res) => {
    const { contentType, kind } = req.body;
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
        const publicUrl = config.s3.bucket && config.s3.region
            ? `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`
            : undefined;
        const response = { key, url, publicUrl };
        void auditLog({
            action: "ASSET_PRESIGN",
            resource: key,
            detail: { kind, publicUrl },
        });
        return res.json(response);
    }
    catch (err) {
        console.error("presignAsset error", err);
        return res.status(500).json({ message: "Failed to presign asset upload", error: err?.message });
    }
};
export const presignAssetRead = async (req, res) => {
    const { key, expiresIn } = req.body;
    if (!key) {
        return res.status(400).json({ message: "key is required" });
    }
    const ttl = expiresIn && !Number.isNaN(Number(expiresIn)) ? Math.min(Number(expiresIn), 86400) : 3600;
    try {
        const url = await presignGetObject(key, ttl);
        return res.json({ url });
    }
    catch (err) {
        console.error("presignAssetRead error", err);
        return res.status(500).json({ message: "Failed to presign asset read", error: err?.message });
    }
};
export const deleteTitle = async (req, res) => {
    const id = req.params.id ? BigInt(req.params.id) : null;
    if (!id)
        return res.status(400).json({ message: "Missing title id" });
    await prisma.$transaction([
        prisma.episode.deleteMany({ where: { titleId: id } }),
        prisma.assetVersion.deleteMany({ where: { titleId: id } }),
        prisma.uploadJob.deleteMany({ where: { titleId: id } }),
        prisma.title.delete({ where: { id } }),
    ]);
    void auditLog({ action: "TITLE_DELETE", resource: id.toString() });
    return res.status(204).send();
};
