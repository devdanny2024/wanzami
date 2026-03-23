import { Queue } from "bullmq";
import { createRedisConnection, resilientEnqueue } from "./redisClient.js";
const connection = createRedisConnection("transcodeQueue");
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
transcodeQueue.on("error", (err) => {
    console.error("[transcodeQueue] Queue error", {
        message: err?.message,
    });
});
export const enqueueTranscodeJob = async (data, opts) => resilientEnqueue("transcodeQueue", () => transcodeQueue.add("transcode", data, opts));
