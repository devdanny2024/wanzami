-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "previewSpriteUrl" TEXT,
ADD COLUMN     "previewVttUrl" TEXT;

-- AlterTable
ALTER TABLE "ErrorLog" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Title" ADD COLUMN     "previewSpriteUrl" TEXT,
ADD COLUMN     "previewVttUrl" TEXT;
