-- CreateEnum
CREATE TYPE "CreatorApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CreatorAccountStatus" AS ENUM ('PENDING_SETUP', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CreatorSubmissionStatus" AS ENUM ('UPLOADING', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CreatorApplication" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "bio" TEXT NOT NULL,
    "reelUrl" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "status" "CreatorApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" BIGINT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorAccount" (
    "id" BIGSERIAL NOT NULL,
    "applicationId" BIGINT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "status" "CreatorAccountStatus" NOT NULL DEFAULT 'PENDING_SETUP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorSession" (
    "id" BIGSERIAL NOT NULL,
    "creatorId" BIGINT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreatorSubmission" (
    "id" BIGSERIAL NOT NULL,
    "creatorId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT,
    "fileKey" TEXT,
    "uploadId" TEXT,
    "status" "CreatorSubmissionStatus" NOT NULL DEFAULT 'UPLOADING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorApplication_status_createdAt_idx" ON "CreatorApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CreatorApplication_email_idx" ON "CreatorApplication"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorAccount_applicationId_key" ON "CreatorAccount"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorAccount_email_key" ON "CreatorAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorAccount_inviteToken_key" ON "CreatorAccount"("inviteToken");

-- CreateIndex
CREATE INDEX "CreatorSession_creatorId_idx" ON "CreatorSession"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorSubmission_creatorId_status_idx" ON "CreatorSubmission"("creatorId", "status");

-- AddForeignKey
ALTER TABLE "CreatorAccount" ADD CONSTRAINT "CreatorAccount_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CreatorApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorSession" ADD CONSTRAINT "CreatorSession_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorSubmission" ADD CONSTRAINT "CreatorSubmission_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
