/*
  Warnings:

  - Made the column `archived` on table `Title` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('PLAY_START', 'PLAY_END', 'SCRUB', 'SKIP', 'SEARCH', 'ADD_TO_LIST', 'THUMBS_UP', 'THUMBS_DOWN', 'IMPRESSION');

-- AlterTable
ALTER TABLE "AssetVersion" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "runtimeMinutes" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Title" ADD COLUMN     "cast" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "countryAvailability" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "crew" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "isOriginal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT DEFAULT 'en',
ADD COLUMN     "maturityRating" TEXT,
ADD COLUMN     "runtimeMinutes" INTEGER,
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "archived" SET NOT NULL;

-- AlterTable
ALTER TABLE "UploadJob" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "EngagementEvent" (
    "id" BIGSERIAL NOT NULL,
    "profileId" BIGINT,
    "titleId" BIGINT,
    "episodeId" BIGINT,
    "sessionId" BIGINT,
    "eventType" "EventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT,
    "deviceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagementEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EngagementEvent_profileId_occurredAt_idx" ON "EngagementEvent"("profileId", "occurredAt");

-- CreateIndex
CREATE INDEX "EngagementEvent_titleId_occurredAt_idx" ON "EngagementEvent"("titleId", "occurredAt");

-- CreateIndex
CREATE INDEX "EngagementEvent_eventType_occurredAt_idx" ON "EngagementEvent"("eventType", "occurredAt");

-- AddForeignKey
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagementEvent" ADD CONSTRAINT "EngagementEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "AssetVersion_title_episode_idx" RENAME TO "AssetVersion_titleId_episodeId_idx";

-- RenameIndex
ALTER INDEX "AssetVersion_title_episode_rendition_key" RENAME TO "AssetVersion_titleId_episodeId_rendition_key";

-- RenameIndex
ALTER INDEX "Episode_title_season_episode_idx" RENAME TO "Episode_titleId_seasonNumber_episodeNumber_idx";

-- RenameIndex
ALTER INDEX "UploadJob_title_episode_status_idx" RENAME TO "UploadJob_titleId_episodeId_status_idx";
