-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TitleType') THEN
    CREATE TYPE "TitleType" AS ENUM ('MOVIE', 'SERIES');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Rendition') THEN
    CREATE TYPE "Rendition" AS ENUM ('R4K', 'R2K', 'R1080', 'R720', 'R360');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetStatus') THEN
    CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UploadStatus') THEN
    CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');
  END IF;
END$$;

-- Title table
CREATE TABLE IF NOT EXISTS "Title" (
    "id" BIGSERIAL PRIMARY KEY,
    "type" "TitleType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "releaseDate" TIMESTAMP(3),
    "posterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Episode table
CREATE TABLE IF NOT EXISTS "Episode" (
    "id" BIGSERIAL PRIMARY KEY,
    "titleId" BIGINT NOT NULL,
    "seasonNumber" INTEGER NOT NULL,
    "episodeNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "synopsis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Episode_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Episode_title_season_episode_idx" ON "Episode"("titleId", "seasonNumber", "episodeNumber");

-- AssetVersion table
CREATE TABLE IF NOT EXISTS "AssetVersion" (
    "id" BIGSERIAL PRIMARY KEY,
    "titleId" BIGINT,
    "episodeId" BIGINT,
    "rendition" "Rendition" NOT NULL,
    "url" TEXT,
    "sizeBytes" BIGINT,
    "durationSec" INTEGER,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssetVersion_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssetVersion_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AssetVersion_title_episode_idx" ON "AssetVersion"("titleId", "episodeId");
CREATE UNIQUE INDEX IF NOT EXISTS "AssetVersion_title_episode_rendition_key" ON "AssetVersion"("titleId", "episodeId", "rendition");

-- UploadJob table
CREATE TABLE IF NOT EXISTS "UploadJob" (
    "id" BIGSERIAL PRIMARY KEY,
    "titleId" BIGINT,
    "episodeId" BIGINT,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "bytesUploaded" BIGINT NOT NULL DEFAULT 0,
    "bytesTotal" BIGINT,
    "error" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadJob_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UploadJob_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UploadJob_title_episode_status_idx" ON "UploadJob"("titleId", "episodeId", "status");
