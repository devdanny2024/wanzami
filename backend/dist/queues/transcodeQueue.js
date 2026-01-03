import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config.js";
const connection = new IORedis(config.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
});
// Use a hashtagged prefix so BullMQ keys hash to the same slot in Redis Cluster/Valkey.
const prefix = "{bullmq}";
export const transcodeQueue = new Queue("transcode", {
    connection,
    prefix,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
    },
});
