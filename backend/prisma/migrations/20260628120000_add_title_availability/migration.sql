-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('LIVE', 'COMING_SOON', 'LEAVING_SOON');

-- AlterTable
ALTER TABLE "Title"
  ADD COLUMN "availability" "AvailabilityStatus" NOT NULL DEFAULT 'LIVE',
  ADD COLUMN "availableFrom" TIMESTAMP(3),
  ADD COLUMN "leavingAt" TIMESTAMP(3);

-- Index to make the auto-flip cron scans cheap
CREATE INDEX "Title_availability_availableFrom_leavingAt_idx"
  ON "Title" ("availability", "availableFrom", "leavingAt");
