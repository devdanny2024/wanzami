import { Worker, Job } from "bullmq";
import { sendEmail } from "../utils/mailer.js";
import { createRedisConnection } from "../queues/redisClient.js";

const connection = createRedisConnection("emailWorker");

const prefix = "{bullmq}";

type EmailJobData = {
  subject: string;
  html: string;
  recipients: Array<{ email: string; name?: string }>;
  startIndex?: number;
  batchSize?: number;
};

const worker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    const { subject, html, recipients } = job.data;
    const failedRecipients: Array<{ email: string; error: string }> = [];
    const queuedRecipients: string[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      try {
        await sendEmail({
          to: r.email,
          subject,
          html: html.replace(/{{\s*name\s*}}/gi, r.name ?? "Subscriber").replace(/{{\s*email\s*}}/gi, r.email),
        });
        queuedRecipients.push(r.email);
      } catch (err: any) {
        failedRecipients.push({ email: r.email, error: err?.message ?? "Unknown error" });
      }
      if (i % 5 === 0) {
        await job.updateProgress(Math.round(((i + 1) / recipients.length) * 100));
      }
    }

    return {
      queued: queuedRecipients.length,
      failed: failedRecipients.length,
      queuedRecipients,
      failedRecipients,
    };
  },
  {
    connection,
    prefix,
  }
);

worker.on("completed", async (job) => {
  const state = await job.getState().catch(() => "unknown");
  const value = job.returnvalue as
    | {
        queued?: number;
        failed?: number;
        queuedRecipients?: string[];
        failedRecipients?: Array<{ email: string; error: string }>;
      }
    | undefined;
  console.log(`[emailWorker] Job completed ${job.id}`, {
    state,
    queued: value?.queued ?? 0,
    failed: value?.failed ?? 0,
    queuedRecipients: value?.queuedRecipients ?? [],
    failedRecipients: value?.failedRecipients ?? [],
  });
});

worker.on("failed", (job, err) => {
  console.error(`[emailWorker] Job failed ${job?.id}`, {
    message: err?.message,
    stack: err?.stack,
  });
});

worker.on("error", (err) => {
  console.error("[emailWorker] Worker non-fatal error", {
    message: err?.message,
    code: (err as { code?: string })?.code,
  });
});

