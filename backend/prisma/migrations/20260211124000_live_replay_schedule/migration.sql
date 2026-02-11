-- Create replay status enum
CREATE TYPE "LiveReplayStatus" AS ENUM ('NONE', 'PENDING_INFRA', 'PROCESSING', 'READY', 'FAILED');

-- Extend LiveEvent for scheduling and replay contract
ALTER TABLE "LiveEvent"
  ADD COLUMN "scheduledStartAt" TIMESTAMP(3),
  ADD COLUMN "viewerCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "replayStatus" "LiveReplayStatus" NOT NULL DEFAULT 'NONE',
  ADD COLUMN "replayPlaybackUrl" TEXT,
  ADD COLUMN "replayAssetId" TEXT,
  ADD COLUMN "replayReadyAt" TIMESTAMP(3),
  ADD COLUMN "replayNote" TEXT;

CREATE INDEX "LiveEvent_scheduledStartAt_idx" ON "LiveEvent"("scheduledStartAt");
