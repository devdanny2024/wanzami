import { Queue } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config.js";
const connection = new IORedis(config.redisUrl);
export const transcodeQueue = new Queue("transcode", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
    },
});
