-- AlterTable
ALTER TABLE "LiveEvent" ADD COLUMN "unlistedSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "LiveEvent_unlistedSlug_key" ON "LiveEvent"("unlistedSlug");
