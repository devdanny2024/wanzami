-- Create live event status enum
CREATE TYPE "LiveEventStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED');

-- Create live events table
CREATE TABLE "LiveEvent" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT,
    "status" "LiveEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "ivsChannelArn" TEXT,
    "ivsStreamKeyArn" TEXT,
    "ivsStreamKeyValue" TEXT,
    "ingestEndpoint" TEXT,
    "playbackUrl" TEXT,
    "createdByUserId" BIGINT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "startedAt" TIMESTAMPTZ,
    "endedAt" TIMESTAMPTZ,
    CONSTRAINT "LiveEvent_pkey" PRIMARY KEY ("id")
);

-- Foreign key to user
ALTER TABLE "LiveEvent"
ADD CONSTRAINT "LiveEvent_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL;

-- Indexes
CREATE INDEX "LiveEvent_status_idx" ON "LiveEvent"("status");
