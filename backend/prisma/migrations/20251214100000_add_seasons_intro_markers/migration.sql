-- Add intro markers to Title
ALTER TABLE "Title" ADD COLUMN "introStartSec" INTEGER;
ALTER TABLE "Title" ADD COLUMN "introEndSec" INTEGER;

-- Add intro markers and optional season relation to Episode
ALTER TABLE "Episode" ADD COLUMN "introStartSec" INTEGER;
ALTER TABLE "Episode" ADD COLUMN "introEndSec" INTEGER;
ALTER TABLE "Episode" ADD COLUMN "seasonId" BIGINT;

-- Create Season table
CREATE TABLE "Season" (
    "id" BIGSERIAL PRIMARY KEY,
    "titleId" BIGINT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "releaseDate" TIMESTAMP(3),
    "status" TEXT,
    "posterUrl" TEXT,
    "thumbnailUrl" TEXT,
    "previewSpriteUrl" TEXT,
    "previewVttUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes and constraints for Season
CREATE UNIQUE INDEX "Season_titleId_seasonNumber_key" ON "Season" ("titleId", "seasonNumber");
CREATE INDEX "Season_titleId_idx" ON "Season" ("titleId");

-- Foreign key constraints
ALTER TABLE "Season"
ADD CONSTRAINT "Season_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Episode"
ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
