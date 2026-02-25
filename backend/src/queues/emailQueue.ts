import { Queue } from "bullmq";
import { config } from "../config.js";
import { createRedisConnection, resilientEnqueue } from "./redisClient.js";

const connection = createRedisConnection("emailQueue");

// Use a hashtagged prefix so BullMQ keys hash to the same slot in Redis Cluster/Valkey.
const prefix = "{bullmq}";

export type EmailQueueJobData = {
  subject: string;
  html: string;
  recipients: Array<{ email: string; name?: string }>;
  startIndex?: number;
  batchSize?: number;
};

export const emailQueue = new Queue<EmailQueueJobData>("email", {
  connection,
  prefix,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});

emailQueue.on("error", (err) => {
  console.error("[emailQueue] Queue error", {
    message: err?.message,
  });
});

export const enqueueEmailJob = async (
  name: string,
  data: EmailQueueJobData,
  opts?: Parameters<typeof emailQueue.add>[2]
) => resilientEnqueue("emailQueue", () => emailQueue.add(name, data, opts));

export const getEmailQueueHealth = () => ({
  redisUrl: config.redis.url,
  lazyConnect: config.redis.lazyConnect,
  tls: config.redis.tls,
});
