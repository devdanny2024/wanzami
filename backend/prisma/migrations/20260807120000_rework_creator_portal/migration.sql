-- Creator accounts are now created directly at signup instead of gated
-- behind a CreatorApplication review + email invite. Per-movie submissions
-- (CreatorSubmission, unchanged) become the only review step.

-- DropForeignKey
ALTER TABLE "CreatorAccount" DROP CONSTRAINT "CreatorAccount_applicationId_fkey";

-- DropIndex
DROP INDEX "CreatorAccount_applicationId_key";

-- DropIndex
DROP INDEX "CreatorAccount_inviteToken_key";

-- DropTable
DROP TABLE "CreatorApplication";

-- DropEnum
DROP TYPE "CreatorApplicationStatus";

-- AlterTable
ALTER TABLE "CreatorAccount"
  DROP COLUMN "applicationId",
  DROP COLUMN "inviteToken",
  DROP COLUMN "inviteExpiresAt",
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "reelUrl" TEXT,
  ALTER COLUMN "password" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable: link an approved submission to the real catalogue Title once
-- it has been ingested, so the dashboard can show real PPV metrics for it.
ALTER TABLE "CreatorSubmission" ADD COLUMN "linkedTitleId" BIGINT;

-- AddForeignKey
ALTER TABLE "CreatorSubmission" ADD CONSTRAINT "CreatorSubmission_linkedTitleId_fkey" FOREIGN KEY ("linkedTitleId") REFERENCES "Title"("id") ON DELETE SET NULL ON UPDATE CASCADE;
