import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config.js";

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// Use a hashtagged prefix so BullMQ keys hash to the same slot in Redis Cluster/Valkey.
const prefix = "{bullmq}";

export const emailQueue = new Queue("email", {
  connection,
  prefix,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 500,
    removeOnFail: 1000,
  },
});
