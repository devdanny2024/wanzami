import { Worker, Job } from "bullmq";
import ffmpeg from "fluent-ffmpeg";
import { createRequire } from "module";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { AssetStatus, UploadStatus, Rendition } from "@prisma/client";
import { downloadToFile, uploadFile } from "../upload/s3.js";
import { createRedisConnection } from "../queues/redisClient.js";
import { mkdtemp, rm, readdir, stat, writeFile } from "fs/promises";
import path from "path";
import os from "os";

const require = createRequire(import.meta.url);
let ffmpegStaticPath: string | null = null;
try {
  // ffmpeg-static is optional; if it failed to install, skip.
  const mod = require("ffmpeg-static") as string | undefined;
  ffmpegStaticPath = mod ?? null;
} catch (err) {
  ffmpegStaticPath = null;
}

if (config.ffmpegPath) {
  ffmpeg.setFfmpegPath(config.ffmpegPath);
} else if (ffmpegStaticPath) {
  ffmpeg.setFfmpegPath(ffmpegStaticPath);
}

type TranscodeJob = {
  uploadJobId: string | number;
  key: string;
  renditions: Rendition[];
  titleId: string | number | null;
  episodeId: string | number | null;
};

const connection = createRedisConnection("transcodeWorker");

// Use a hashtagged prefix so BullMQ keys hash to the same slot in Redis Cluster/Valkey.
const prefix = "{bullmq}";

const renditionToHeight = (r: Rendition) => {
  switch (r) {
    case "R4K":
      return 2160;
    case "R2K":
      return 1440;
    case "R1080":
      return 1080;
    case "R720":
      return 720;
    case "R360":
    default:
      return 360;
  }
};

const renditionInfo = (r: Rendition) => {
  switch (r) {
    case "R4K":
      return { height: 2160, width: 3840, bandwidth: 12000000 };
    case "R2K":
      return { height: 1440, width: 2560, bandwidth: 8000000 };
    case "R1080":
      return { height: 1080, width: 1920, bandwidth: 5000000 };
    case "R720":
      return { height: 720, width: 1280, bandwidth: 3000000 };
    case "R360":
    default:
      return { height: 360, width: 640, bandwidth: 800000 };
  }
};

async function safeUpdateUploadJob(
  uploadJobId: bigint,
  data: { status: UploadStatus; error?: string | null }
) {
  const result = await prisma.uploadJob.updateMany({
    where: { id: uploadJobId },
    data,
  });
  if (result.count === 0) {
    console.warn("uploadJob missing for update", { uploadJobId, status: data.status });
  }
}

async function transcodeToHlsRendition(
  src: string,
  tmpDir: string,
  uploadJobId: string | number,
  rendition: Rendition,
  height: number,
  durationSec: number,
   audioChannels: number,
  titleId: bigint | null,
  episodeId: bigint | null
) {
  const playlistPath = path.join(tmpDir, `${rendition}.m3u8`);
  const segmentPattern = path.join(tmpDir, `${rendition}_%03d.ts`);

  const isSurround = audioChannels >= 6;
  const audioOptions = isSurround
    ? ["-ac 6", "-b:a 384k"]
    : ["-ac 2", "-b:a 160k"];

  await new Promise<void>((resolve, reject) => {
    ffmpeg(src)
      .outputOptions([
        "-c:v libx264",
        `-vf scale=-2:${height}`,
        "-preset veryfast",
        "-c:a aac",
        ...audioOptions,
        "-f hls",
        "-hls_time 6",
        "-hls_playlist_type vod",
        "-hls_segment_type mpegts",
        `-hls_segment_filename ${segmentPattern}`,
      ])
      .output(playlistPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });

  // Upload playlist + segments to S3 under vod/{uploadJobId}/
  const files = await readdir(tmpDir);
  let totalSize = 0;
  for (const file of files) {
    if (!file.startsWith(rendition)) continue;
    const fullPath = path.join(tmpDir, file);
    const key = `vod/${uploadJobId}/${file}`;
    const contentType = file.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : "video/MP2T";
    const uploaded = await uploadFile(key, fullPath, contentType);
    totalSize += uploaded.size ?? (await stat(fullPath)).size;
  }

  const playlistKey = `vod/${uploadJobId}/${rendition}.m3u8`;

  const where: any = { rendition };
  if (titleId != null) where.titleId = titleId;
  if (episodeId != null) where.episodeId = episodeId;

  await prisma.assetVersion.updateMany({
    where,
    data: {
      status: AssetStatus.READY,
      url: `s3://${config.s3.bucket ?? ""}/${playlistKey}`,
      sizeBytes: BigInt(totalSize),
      durationSec,
    },
  });
}

async function writeAndUploadMasterPlaylist(
  tmpDir: string,
  uploadJobId: string | number,
  renditions: Rendition[],
  titleId: bigint | null,
  episodeId: bigint | null
) {
  if (!config.s3.bucket) return;
  if (!renditions.length) return;

  const sorted = renditions.slice().sort((a, b) => renditionToHeight(a) - renditionToHeight(b));
  const lines: string[] = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const r of sorted) {
    const { height, width, bandwidth } = renditionInfo(r);
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}`);
    lines.push(`${r}.m3u8`);
  }

  const masterPath = path.join(tmpDir, "master.m3u8");
  await writeFile(masterPath, lines.join("\n"), "utf8");
  const key = `vod/${uploadJobId}/master.m3u8`;
  await uploadFile(key, masterPath, "application/vnd.apple.mpegurl");

  const where: any = { rendition: { in: renditions } };
  if (titleId != null) where.titleId = titleId;
  if (episodeId != null) where.episodeId = episodeId;

  await prisma.assetVersion.updateMany({
    where,
    data: {
      url: `s3://${config.s3.bucket}/${key}`,
    },
  });
}

const worker = new Worker<TranscodeJob>(
  "transcode",
  async (job: Job<TranscodeJob>) => {
    const data = job.data;
    const uploadJobId = BigInt(data.uploadJobId);
    const titleId = data.titleId != null ? BigInt(data.titleId) : null;
    const episodeId = data.episodeId != null ? BigInt(data.episodeId) : null;
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "wanzami-"));
    const srcPath = path.join(tmpDir, "source");
    try {
      await downloadToFile(data.key, srcPath);
      let durationSec = 0;
      let audioChannels = 2;
      try {
        const probe = await new Promise<any>((resolve, reject) =>
          ffmpeg.ffprobe(srcPath, (err: any, meta: any) => (err ? reject(err) : resolve(meta)))
        );
        durationSec = Math.round(probe.format?.duration ?? 0);
        const audioStream = (probe.streams ?? []).find(
          (s: any) => s.codec_type === "audio"
        );
        if (audioStream?.channels && typeof audioStream.channels === "number") {
          audioChannels = audioStream.channels;
        }
      } catch {
        // If ffprobe is unavailable, continue without duration to avoid failing the whole job.
        durationSec = 0;
      }

      for (const rendition of data.renditions) {
        const height = renditionToHeight(rendition);
        await transcodeToHlsRendition(
          srcPath,
          tmpDir,
          data.uploadJobId,
          rendition,
          height,
          durationSec,
          audioChannels,
          titleId,
          episodeId
        );
      }

      // After all renditions are created, generate a master HLS
      // playlist so the client player can use adaptive streaming.
      await writeAndUploadMasterPlaylist(tmpDir, data.uploadJobId, data.renditions, titleId, episodeId);

      await safeUpdateUploadJob(uploadJobId, { status: UploadStatus.COMPLETED });
    } catch (err: any) {
      await safeUpdateUploadJob(uploadJobId, {
        status: UploadStatus.FAILED,
        error: err?.message ?? "Transcode failed",
      });
      throw err;
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  },
  {
    connection,
    // Allow multiple ffmpeg jobs per worker, controlled via env.
    concurrency: Math.max(config.transcodeConcurrency || 1, 1),
    prefix,
    // Transcodes for large files can legitimately run for a long time.
    // Increase the lock duration and stalled threshold so BullMQ
    // does not mark long-running jobs as "stalled" and fail them.
    lockDuration: 1000 * 60 * 60, // 1 hour lock per job
    maxStalledCount: 5,
  }
);

worker.on("failed", async (job, err) => {
  if (!job?.data) return;
  const data = job.data as TranscodeJob;
  await safeUpdateUploadJob(BigInt(data.uploadJobId), {
    status: UploadStatus.FAILED,
    error: err?.message ?? "Transcode failed",
  });
});

worker.on("completed", () => {
  // no-op
});

worker.on("error", (err) => {
  console.error("[transcodeWorker] Worker non-fatal error", {
    message: err?.message,
    code: (err as { code?: string })?.code,
  });
});
