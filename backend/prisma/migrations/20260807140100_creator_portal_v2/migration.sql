-- AlterTable: CreatorAccount gains a public profile, socials, and payout
-- details on file (statement view only, no real transfer wiring yet).
ALTER TABLE "CreatorAccount"
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "instagram" TEXT,
  ADD COLUMN "youtube" TEXT,
  ADD COLUMN "twitter" TEXT,
  ADD COLUMN "website" TEXT,
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "bankAccountName" TEXT,
  ADD COLUMN "bankAccountNumber" TEXT;

-- AlterTable: CreatorSubmission becomes a full draft-first wizard record —
-- catalogue metadata, trailer, poster, rights declaration.
ALTER TABLE "CreatorSubmission"
  ADD COLUMN "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "cast" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "crew" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "language" TEXT,
  ADD COLUMN "maturityRating" TEXT,
  ADD COLUMN "runtimeMinutes" INTEGER,
  ADD COLUMN "releaseDate" TIMESTAMP(3),
  ADD COLUMN "suggestedPpvPriceNaira" INTEGER,
  ADD COLUMN "trailerKey" TEXT,
  ADD COLUMN "trailerUploadId" TEXT,
  ADD COLUMN "posterUrl" TEXT,
  ADD COLUMN "rightsDeclared" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "rightsDeclaredName" TEXT,
  ADD COLUMN "rightsDeclaredAt" TIMESTAMP(3),
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "CreatorDocument" (
    "id" BIGSERIAL NOT NULL,
    "submissionId" BIGINT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorDocument_submissionId_idx" ON "CreatorDocument"("submissionId");

-- AddForeignKey
ALTER TABLE "CreatorDocument" ADD CONSTRAINT "CreatorDocument_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "CreatorSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "CreatorNotificationType" AS ENUM ('SUBMISSION_RECEIVED', 'SUBMISSION_IN_REVIEW', 'SUBMISSION_APPROVED', 'SUBMISSION_REJECTED', 'PAYOUT_LOGGED');

-- CreateTable
CREATE TABLE "CreatorNotification" (
    "id" BIGSERIAL NOT NULL,
    "creatorId" BIGINT NOT NULL,
    "type" "CreatorNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "submissionId" BIGINT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorNotification_creatorId_isRead_createdAt_idx" ON "CreatorNotification"("creatorId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "CreatorNotification" ADD CONSTRAINT "CreatorNotification_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "CreatorPayout" (
    "id" BIGSERIAL NOT NULL,
    "creatorId" BIGINT NOT NULL,
    "amountNaira" INTEGER NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorPayout_creatorId_paidAt_idx" ON "CreatorPayout"("creatorId", "paidAt");

-- AddForeignKey
ALTER TABLE "CreatorPayout" ADD CONSTRAINT "CreatorPayout_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
