-- Add thumbnail and trailer urls to titles
ALTER TABLE "Title" ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
ALTER TABLE "Title" ADD COLUMN IF NOT EXISTS "trailerUrl" TEXT;
