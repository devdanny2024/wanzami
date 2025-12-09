import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { prisma } from "../prisma.js";
import { config } from "../config.js";
import { AssetStatus, UploadStatus, Rendition } from "@prisma/client";
import { downloadToFile, uploadFile } from "../upload/s3.js";
import { mkdtemp, rm, stat } from "fs/promises";
import path from "path";
import os from "os";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

type TranscodeJob = {
  uploadJobId: string | number;
  key: string;
  renditions: Rendition[];
  titleId: string | number | null;
  episodeId: string | number | null;
};

const connection = new IORedis(config.redisUrl);

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

async function transcodeToHeight(src: string, dest: string, height: number) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(src)
      .outputOptions([
        "-c:v libx264",
        `-vf scale=-2:${height}`,
        "-preset veryfast",
        "-c:a aac",
        "-b:a 128k",
      ])
      .output(dest)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
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
      const probe = await new Promise<any>((resolve, reject) =>
        ffmpeg.ffprobe(srcPath, (err: any, meta: any) => (err ? reject(err) : resolve(meta)))
      );
      const durationSec = Math.round(probe.format?.duration ?? 0);

      for (const rendition of data.renditions) {
        const outPath = path.join(tmpDir, `${rendition}.mp4`);
        const height = renditionToHeight(rendition);
        await transcodeToHeight(srcPath, outPath, height);
        const s3Key = `vod/${data.uploadJobId}/${rendition}.mp4`;
        const uploaded = await uploadFile(s3Key, outPath, "video/mp4");
        const size = uploaded.size ?? (await stat(outPath)).size;

        await prisma.assetVersion.updateMany({
          where: {
            titleId,
            episodeId,
            rendition,
          },
          data: {
            status: AssetStatus.READY,
            url: `s3://${config.s3.bucket ?? ""}/${s3Key}`,
            sizeBytes: BigInt(size),
            durationSec,
          },
        });
      }

      await prisma.uploadJob.update({
        where: { id: uploadJobId },
        data: { status: UploadStatus.COMPLETED },
      });
    } catch (err: any) {
      await prisma.uploadJob.update({
        where: { id: uploadJobId },
        data: { status: UploadStatus.FAILED, error: err?.message ?? "Transcode failed" },
      });
      throw err;
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  },
  { connection }
);

worker.on("failed", async (job, err) => {
  if (!job?.data) return;
  const data = job.data as TranscodeJob;
  await prisma.uploadJob.update({
    where: { id: data.uploadJobId },
    data: { status: UploadStatus.FAILED, error: err?.message ?? "Transcode failed" },
  });
});

worker.on("completed", () => {
  // no-op
});
