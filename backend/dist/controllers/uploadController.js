import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { createMultipartUpload, presignPartUrls, presignPartUrlsForNumbers, completeMultipartUpload, partSizeBytes, listMultipartParts, } from "../upload/s3.js";
import { config } from "../config.js";
import { UploadStatus, Rendition, TitleType, AssetStatus } from "@prisma/client";
import { enqueueTranscodeJob } from "../queues/transcodeQueue.js";
const initSchema = z.object({
    kind: z.enum(["MOVIE", "SERIES", "EPISODE"]),
    titleId: z.coerce.bigint().optional(),
    titleName: z.string().optional(),
    episodeId: z.coerce.bigint().optional(),
    episodeName: z.string().optional(),
    seasonNumber: z.coerce.number().int().optional(),
    episodeNumber: z.coerce.number().int().optional(),
    fileName: z.string().min(1),
    bytesTotal: z.coerce.bigint(),
    contentType: z.string().optional(),
    renditions: z.array(z.nativeEnum(Rendition)).optional(),
});
const progressSchema = z.object({
    bytesUploaded: z.coerce.bigint(),
});
const completeSchema = z.object({
    uploadId: z.string(),
    key: z.string(),
    parts: z.array(z.object({
        ETag: z.string(),
        PartNumber: z.number(),
    })),
    renditions: z.array(z.nativeEnum(Rendition)).optional(),
});
const defaultRenditions = [
    Rendition.R4K,
    Rendition.R1080,
    Rendition.R720,
    Rendition.R360,
];
export const initUpload = async (req, res) => {
    try {
        const parsed = initSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ errors: parsed.error.flatten() });
        }
        if (!config.s3.bucket) {
            return res.status(500).json({ message: "S3 is not configured" });
        }
        console.log("initUpload s3 config", {
            region: config.s3.region,
            bucket: config.s3.bucket,
            endpoint: config.s3.endpoint,
            awsRegion: process.env.AWS_REGION,
        });
        const { kind, titleId, titleName, episodeId, episodeName, seasonNumber, episodeNumber, fileName, bytesTotal, contentType, renditions, } = parsed.data;
        let resolvedTitleId = titleId ?? null;
        let resolvedEpisodeId = episodeId ?? null;
        if (kind === "MOVIE" || kind === "SERIES") {
            if (!resolvedTitleId) {
                const createdTitle = await prisma.title.create({
                    data: {
                        type: kind === "MOVIE" ? TitleType.MOVIE : TitleType.SERIES,
                        name: titleName || fileName,
                        // New uploads start hidden until explicitly published.
                        archived: true,
                        pendingReview: true,
                    },
                });
                resolvedTitleId = createdTitle.id;
            }
        }
        if (kind === "EPISODE") {
            if (!resolvedTitleId && titleName) {
                const createdSeries = await prisma.title.create({
                    data: { type: TitleType.SERIES, name: titleName },
                });
                resolvedTitleId = createdSeries.id;
            }
            if (!resolvedEpisodeId) {
                if (!resolvedTitleId) {
                    return res.status(400).json({ message: "titleId or titleName required for EPISODE uploads" });
                }
                const createdEpisode = await prisma.episode.create({
                    data: {
                        titleId: resolvedTitleId,
                        seasonNumber: seasonNumber ?? 1,
                        episodeNumber: episodeNumber ?? 1,
                        name: episodeName || fileName,
                        pendingReview: true,
                    },
                });
                resolvedEpisodeId = createdEpisode.id;
            }
        }
        const key = `uploads/${Date.now()}-${crypto.randomUUID()}/${fileName}`;
        const uploadId = await createMultipartUpload(key, contentType ?? "application/octet-stream");
        const partCount = Math.max(1, Math.ceil(Number(bytesTotal) / partSizeBytes));
        const presigned = await presignPartUrls(key, uploadId, partCount);
        const job = await prisma.uploadJob.create({
            data: {
                status: UploadStatus.UPLOADING,
                bytesUploaded: BigInt(0),
                bytesTotal,
                titleId: kind === "EPISODE" ? null : resolvedTitleId,
                episodeId: kind === "EPISODE" ? resolvedEpisodeId : null,
                payload: {
                    key,
                    uploadId,
                    fileName,
                    partSize: partSizeBytes,
                    renditions: renditions && renditions.length ? renditions : defaultRenditions,
                },
            },
        });
        return res.json({
            jobId: job.id.toString(),
            uploadId,
            key,
            partSize: partSizeBytes,
            partCount,
            presignedParts: presigned,
        });
    }
    catch (err) {
        console.error("initUpload error", err);
        return res.status(500).json({ message: "Failed to init upload", error: err?.message });
    }
};
export const updateUploadProgress = async (req, res) => {
    const jobId = req.params.id ? BigInt(req.params.id) : null;
    if (!jobId)
        return res.status(400).json({ message: "Missing job id" });
    const parsed = progressSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const job = await prisma.uploadJob.update({
        where: { id: jobId },
        data: { bytesUploaded: parsed.data.bytesUploaded, status: UploadStatus.UPLOADING },
    });
    // Convert BigInt fields to numbers/strings to avoid JSON serialization errors
    return res.json({
        job: {
            id: job.id.toString(),
            bytesUploaded: Number(job.bytesUploaded),
            status: job.status,
        },
    });
};
export const completeUpload = async (req, res) => {
    const jobId = req.params.id ? BigInt(req.params.id) : null;
    if (!jobId)
        return res.status(400).json({ message: "Missing job id" });
    const parsed = completeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.flatten() });
    }
    const { uploadId, key, parts, renditions } = parsed.data;
    try {
        await completeMultipartUpload(key, uploadId, parts.map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber })));
    }
    catch (err) {
        await prisma.uploadJob.update({
            where: { id: jobId },
            data: { status: UploadStatus.FAILED, error: err?.message ?? "complete failed" },
        });
        return res.status(500).json({ message: "Failed to complete multipart upload", error: err?.message });
    }
    const job = await prisma.uploadJob.findUnique({ where: { id: jobId } });
    if (!job) {
        return res.status(404).json({ message: "Job not found after completion" });
    }
    const targetRenditions = renditions && renditions.length ? renditions : defaultRenditions;
    const titleKey = job.titleId ?? BigInt(0);
    const episodeKey = job.episodeId ?? BigInt(0);
    // Mark asset versions as PROCESSING ahead of transcode; worker will update to READY.
    const assetData = {
        titleId: job.titleId ?? null,
        episodeId: job.episodeId ?? null,
    };
    await Promise.all(targetRenditions.map((r) => prisma.assetVersion.upsert({
        where: {
            titleId_episodeId_rendition: {
                titleId: titleKey,
                episodeId: episodeKey,
                rendition: r,
            },
        },
        update: { url: `s3://${config.s3.bucket ?? ""}/${key}`, status: AssetStatus.PROCESSING },
        create: {
            ...assetData,
            rendition: r,
            url: `s3://${config.s3.bucket ?? ""}/${key}`,
            status: AssetStatus.PROCESSING,
        },
    })));
    const updated = await prisma.uploadJob.update({
        where: { id: jobId },
        data: {
            status: UploadStatus.PROCESSING,
            bytesUploaded: job.bytesTotal ?? job.bytesUploaded ?? BigInt(0),
            error: null,
        },
    });
    const enqueueResult = await enqueueTranscodeJob({
        uploadJobId: updated.id.toString(),
        key,
        renditions: targetRenditions,
        titleId: job.titleId ? job.titleId.toString() : null,
        episodeId: job.episodeId ? job.episodeId.toString() : null,
    });
    if (!enqueueResult.ok) {
        await prisma.uploadJob.update({
            where: { id: jobId },
            data: {
                status: UploadStatus.PROCESSING,
                error: `Transcode queue unavailable: ${enqueueResult.reason}`,
            },
        });
        return res.status(202).json({
            message: "Upload completed, but transcode queue is temporarily unavailable. Retry transcode when Redis recovers.",
            queued: false,
            reason: enqueueResult.reason,
            job: {
                id: updated.id.toString(),
                status: UploadStatus.PROCESSING,
            },
        });
    }
    return res.json({
        job: {
            id: updated.id.toString(),
            status: updated.status,
        },
    });
};
export const listUploads = async (_req, res) => {
    const jobs = await prisma.uploadJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    const jobsWithProgress = await Promise.all(jobs.map(async (j) => {
        const payload = j.payload || {};
        const renditions = Array.isArray(payload.renditions) ? payload.renditions : [];
        let processingPercent = null;
        if (renditions.length > 0 && (j.titleId || j.episodeId)) {
            const versions = await prisma.assetVersion.findMany({
                where: {
                    ...(j.titleId ? { titleId: j.titleId } : {}),
                    ...(j.episodeId ? { episodeId: j.episodeId } : {}),
                    rendition: { in: renditions },
                },
                select: { status: true },
            });
            const total = versions.length;
            const ready = versions.filter((v) => v.status === AssetStatus.READY).length;
            processingPercent = total > 0 ? Math.round((ready / total) * 100) : null;
        }
        return { job: j, processingPercent };
    }));
    return res.json({
        uploads: jobsWithProgress.map(({ job: j, processingPercent }) => ({
            id: j.id.toString(),
            status: j.status,
            bytesUploaded: Number(j.bytesUploaded ?? 0),
            bytesTotal: j.bytesTotal ? Number(j.bytesTotal) : null,
            fileName: j.payload?.fileName ?? null,
            kind: j.payload?.kind ?? null,
            error: j.error,
            createdAt: j.createdAt,
            updatedAt: j.updatedAt,
            processingPercent,
        })),
    });
};
export const retryTranscode = async (req, res) => {
    const jobId = req.params.id ? BigInt(req.params.id) : null;
    if (!jobId)
        return res.status(400).json({ message: "Missing job id" });
    const job = await prisma.uploadJob.findUnique({ where: { id: jobId } });
    if (!job)
        return res.status(404).json({ message: "Job not found" });
    if (job.status !== UploadStatus.FAILED && job.status !== UploadStatus.PROCESSING) {
        return res.status(400).json({ message: "Only failed or processing jobs can be retried" });
    }
    const payload = job.payload;
    const key = payload?.key;
    const renditions = payload?.renditions ?? defaultRenditions;
    if (!key) {
        return res.status(400).json({ message: "Job payload missing key; cannot retry" });
    }
    const updated = await prisma.uploadJob.update({
        where: { id: jobId },
        data: {
            status: UploadStatus.PROCESSING,
            error: null,
        },
    });
    const enqueueResult = await enqueueTranscodeJob({
        uploadJobId: updated.id.toString(),
        key,
        renditions,
        titleId: job.titleId ? job.titleId.toString() : null,
        episodeId: job.episodeId ? job.episodeId.toString() : null,
    });
    if (!enqueueResult.ok) {
        await prisma.uploadJob.update({
            where: { id: jobId },
            data: { status: UploadStatus.FAILED, error: `Retry enqueue failed: ${enqueueResult.reason}` },
        });
        return res.status(503).json({ message: "Redis queue unavailable", error: enqueueResult.reason });
    }
    return res.json({ message: "Transcode requeued", jobId: updated.id.toString(), queueJobId: enqueueResult.id });
};
export const backfillTranscodes = async (req, res) => {
    const rawLimit = req.body?.limit ?? req.query.limit;
    const parsedLimit = Number(rawLimit);
    const take = Number.isFinite(parsedLimit) && parsedLimit > 0 && parsedLimit <= 50 ? parsedLimit : 10;
    const candidates = await prisma.uploadJob.findMany({
        where: { status: UploadStatus.COMPLETED },
        orderBy: { updatedAt: "asc" },
        take,
    });
    const queued = [];
    for (const job of candidates) {
        const payload = job.payload || {};
        const key = payload?.key;
        const renditions = payload?.renditions ?? defaultRenditions;
        if (!key || !renditions.length) {
            continue;
        }
        const versionWhere = {
            ...(job.titleId ? { titleId: job.titleId } : {}),
            ...(job.episodeId ? { episodeId: job.episodeId } : {}),
            rendition: { in: renditions },
        };
        // Skip jobs that already have a master playlist wired.
        const versions = await prisma.assetVersion.findMany({
            where: versionWhere,
            select: { url: true },
        });
        const hasMaster = versions.some((v) => (v.url ?? "").includes("/master.m3u8"));
        if (hasMaster) {
            continue;
        }
        // Reset asset versions for this title/episode back to PROCESSING so
        // dashboard progress reflects the new backfill run (0% -> 100%).
        await prisma.assetVersion.updateMany({
            where: versionWhere,
            data: { status: AssetStatus.PROCESSING },
        });
        const updated = await prisma.uploadJob.update({
            where: { id: job.id },
            data: {
                status: UploadStatus.PROCESSING,
                error: null,
            },
        });
        const enqueueResult = await enqueueTranscodeJob({
            uploadJobId: updated.id.toString(),
            key,
            renditions,
            titleId: job.titleId ? job.titleId.toString() : null,
            episodeId: job.episodeId ? job.episodeId.toString() : null,
        });
        if (!enqueueResult.ok) {
            await prisma.uploadJob.update({
                where: { id: job.id },
                data: { status: UploadStatus.FAILED, error: `Backfill enqueue failed: ${enqueueResult.reason}` },
            });
            continue;
        }
        queued.push(updated.id.toString());
    }
    return res.json({
        message: "Backfill transcodes enqueued",
        queuedCount: queued.length,
        jobIds: queued,
    });
};
export const resumeUpload = async (req, res) => {
    const jobId = req.params.id ? BigInt(req.params.id) : null;
    if (!jobId)
        return res.status(400).json({ message: "Missing job id" });
    const job = await prisma.uploadJob.findUnique({ where: { id: jobId } });
    if (!job)
        return res.status(404).json({ message: "Job not found" });
    if (job.status === UploadStatus.COMPLETED) {
        return res.status(409).json({ message: "Upload already completed" });
    }
    const payload = job.payload;
    const uploadId = payload?.uploadId;
    const key = payload?.key;
    const partSize = Number(payload?.partSize) || partSizeBytes;
    if (!uploadId || !key) {
        return res.status(400).json({ message: "Upload cannot be resumed" });
    }
    try {
        const parts = await listMultipartParts(key, uploadId);
        const uploadedParts = parts.map((p) => p.partNumber);
        const uploadedBytes = parts.reduce((sum, p) => sum + p.size, 0);
        const partCount = Math.max(1, Math.ceil(Number(job.bytesTotal ?? 0) / partSize));
        const remaining = [];
        for (let i = 1; i <= partCount; i += 1) {
            if (!uploadedParts.includes(i))
                remaining.push(i);
        }
        const presignedParts = await presignPartUrlsForNumbers(key, uploadId, remaining);
        return res.json({
            jobId: job.id.toString(),
            uploadId,
            key,
            partSize,
            partCount,
            uploadedParts: parts,
            uploadedBytes,
            presignedParts,
        });
    }
    catch (err) {
        const code = err?.name === "NoSuchUpload" ? 410 : 500;
        return res.status(code).json({ message: "Failed to resume upload", error: err?.message });
    }
};
