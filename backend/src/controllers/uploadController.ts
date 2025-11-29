import crypto from "crypto";
import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { createMultipartUpload, presignPartUrls, completeMultipartUpload, partSizeBytes } from "../upload/s3.js";
import { config } from "../config.js";
import { UploadStatus, Rendition, TitleType, AssetStatus } from "@prisma/client";

const initSchema = z.object({
  kind: z.enum(["MOVIE", "SERIES", "EPISODE"]),
  titleId: z.coerce.bigint().optional(),
  episodeId: z.coerce.bigint().optional(),
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

    const { kind, titleId, episodeId, fileName, bytesTotal, contentType, renditions } = parsed.data;
    if (kind === "EPISODE" && !episodeId) {
      return res.status(400).json({ message: "episodeId required for EPISODE uploads" });
    }
    if (kind !== "EPISODE" && !titleId) {
      return res.status(400).json({ message: "titleId required for MOVIE/SERIES uploads" });
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
        titleId: kind === "EPISODE" ? null : titleId ?? null,
        episodeId: kind === "EPISODE" ? episodeId ?? null : null,
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
  return res.json({ job: { id: job.id.toString(), bytesUploaded: job.bytesUploaded, status: job.status } });
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

  // Stub: mark asset versions as READY and point to the uploaded key for now.
  const assetData = {
    titleId: job.titleId ?? undefined,
    episodeId: job.episodeId ?? undefined,
  };
  await Promise.all(
    targetRenditions.map((r) =>
      prisma.assetVersion.upsert({
        where: {
          titleId_episodeId_rendition: {
            titleId: job.titleId ?? null,
            episodeId: job.episodeId ?? null,
            rendition: r,
          },
        },
        update: { url: `s3://${config.s3.bucket ?? ""}/${key}`, status: AssetStatus.READY },
        create: {
          ...assetData,
          rendition: r,
          url: `s3://${config.s3.bucket ?? ""}/${key}`,
          status: AssetStatus.READY,
        },
      })
    )
  );

  const updated = await prisma.uploadJob.update({
    where: { id: jobId },
    data: { status: UploadStatus.COMPLETED, bytesUploaded: job.bytesTotal ?? job.bytesUploaded },
  });

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
