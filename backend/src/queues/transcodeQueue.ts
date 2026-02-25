import { Queue } from "bullmq";
import { Rendition } from "@prisma/client";
import { createRedisConnection, resilientEnqueue } from "./redisClient.js";

const connection = createRedisConnection("transcodeQueue");

// Use a hashtagged prefix so BullMQ keys hash to the same slot in Redis Cluster/Valkey.
const prefix = "{bullmq}";

export type TranscodeQueueJobData = {
  uploadJobId: string;
  key: string;
  renditions: Rendition[];
  titleId: string | null;
  episodeId: string | null;
};

export const transcodeQueue = new Queue<TranscodeQueueJobData>("transcode", {
  connection,
  prefix,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

transcodeQueue.on("error", (err) => {
  console.error("[transcodeQueue] Queue error", {
    message: err?.message,
  });
});

export const enqueueTranscodeJob = async (
  data: TranscodeQueueJobData,
  opts?: Parameters<typeof transcodeQueue.add>[2]
) => resilientEnqueue("transcodeQueue", () => transcodeQueue.add("transcode", data, opts));
