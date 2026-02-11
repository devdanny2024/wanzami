-- CreateEnum
CREATE TYPE "LiveSourceType" AS ENUM ('CAMERA', 'SCREEN', 'RTMP', 'CONTROL_DECK');

-- CreateEnum
CREATE TYPE "LiveSourceStatus" AS ENUM ('READY', 'OFFLINE', 'ERROR');

-- CreateTable
CREATE TABLE "LiveEventSource" (
    "id" BIGSERIAL NOT NULL,
    "liveEventId" BIGINT NOT NULL,
    "type" "LiveSourceType" NOT NULL,
    "label" TEXT NOT NULL,
    "status" "LiveSourceStatus" NOT NULL DEFAULT 'READY',
    "playbackUrl" TEXT,
    "previewUrl" TEXT,
    "metadata" JSONB,
    "isActiveOutput" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LiveEventSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveEventSource_liveEventId_createdAt_idx" ON "LiveEventSource"("liveEventId", "createdAt");

-- CreateIndex
CREATE INDEX "LiveEventSource_liveEventId_isActiveOutput_idx" ON "LiveEventSource"("liveEventId", "isActiveOutput");

-- Enforce one active output per event
CREATE UNIQUE INDEX "LiveEventSource_liveEventId_active_output_unique" ON "LiveEventSource"("liveEventId") WHERE "isActiveOutput" = true;

-- AddForeignKey
ALTER TABLE "LiveEventSource" ADD CONSTRAINT "LiveEventSource_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
