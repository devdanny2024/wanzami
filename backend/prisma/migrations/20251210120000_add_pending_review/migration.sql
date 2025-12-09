-- Add pendingReview flag to Title and Episode for preview/publish workflow
ALTER TABLE "Title" ADD COLUMN IF NOT EXISTS "pendingReview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Episode" ADD COLUMN IF NOT EXISTS "pendingReview" BOOLEAN NOT NULL DEFAULT false;
