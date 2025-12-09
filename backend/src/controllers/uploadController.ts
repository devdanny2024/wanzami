import crypto from "crypto";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { createMultipartUpload, presignPartUrls, completeMultipartUpload, partSizeBytes } from "../upload/s3.js";
import { config } from "../config.js";
import { UploadStatus, Rendition, TitleType, AssetStatus } from "@prisma/client";
import { transcodeQueue } from "../queues/transcodeQueue.js";

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
  parts: z.array(
    z.object({
      ETag: z.string(),
      PartNumber: z.number(),
    })
  ),
  renditions: z.array(z.nativeEnum(Rendition)).optional(),
});

const defaultRenditions: Rendition[] = [
  Rendition.R4K,
  Rendition.R2K,
  Rendition.R1080,
  Rendition.R720,
  Rendition.R360,
];

export const initUpload = async (req: Request, res: Response) => {
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

    const {
      kind,
      titleId,
      titleName,
      episodeId,
      episodeName,
      seasonNumber,
      episodeNumber,
      fileName,
      bytesTotal,
      contentType,
      renditions,
    } = parsed.data;

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
  } catch (err: any) {
    console.error("initUpload error", err);
    return res.status(500).json({ message: "Failed to init upload", error: err?.message });
  }
};

export const updateUploadProgress = async (req: Request, res: Response) => {
  const jobId = req.params.id ? BigInt(req.params.id) : null;
  if (!jobId) return res.status(400).json({ message: "Missing job id" });
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

export const completeUpload = async (req: Request, res: Response) => {
  const jobId = req.params.id ? BigInt(req.params.id) : null;
  if (!jobId) return res.status(400).json({ message: "Missing job id" });
  const parsed = completeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  const { uploadId, key, parts, renditions } = parsed.data;
  try {
    await completeMultipartUpload(
      key,
      uploadId,
      parts.map((p) => ({ ETag: p.ETag, PartNumber: p.PartNumber }))
    );
  } catch (err: any) {
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
  await Promise.all(
    targetRenditions.map((r) =>
      prisma.assetVersion.upsert({
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
      })
    )
  );

  const updated = await prisma.uploadJob.update({
    where: { id: jobId },
    data: {
      status: UploadStatus.PROCESSING,
      bytesUploaded: job.bytesTotal ?? job.bytesUploaded ?? BigInt(0),
      error: null,
    },
  });

  try {
    await transcodeQueue.add("transcode", {
      uploadJobId: updated.id,
      key,
      renditions: targetRenditions,
      titleId: job.titleId,
      episodeId: job.episodeId,
    });
  } catch (err: any) {
    await prisma.uploadJob.update({
      where: { id: jobId },
      data: { status: UploadStatus.FAILED, error: err?.message ?? "Failed to enqueue transcode" },
    });
    return res.status(500).json({ message: "Failed to enqueue transcode", error: err?.message });
  }

  return res.json({
    job: {
      id: updated.id.toString(),
      status: updated.status,
    },
  });
};

export const listUploads = async (_req: Request, res: Response) => {
  const jobs = await prisma.uploadJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return res.json({
    uploads: jobs.map((j) => ({
      id: j.id.toString(),
      status: j.status,
      bytesUploaded: j.bytesUploaded,
      bytesTotal: j.bytesTotal,
      error: j.error,
      createdAt: j.createdAt,
      updatedAt: j.updatedAt,
    })),
  });
};
