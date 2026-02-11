-- AlterTable
ALTER TABLE "LiveEvent"
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "LiveEvent_isPublished_status_idx" ON "LiveEvent"("isPublished", "status");
