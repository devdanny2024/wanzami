-- Add archived flag to Title
ALTER TABLE "Title" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN DEFAULT FALSE;
