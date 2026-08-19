-- CreateEnum
CREATE TYPE "FilmmakerLeadContact" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "FilmmakerLeadConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable: prospect list from the filmmaker-scraper project. Kept separate
-- from User on purpose — the email audience import creates real user rows, and
-- cold prospects there would skew every user metric on the platform.
CREATE TABLE "FilmmakerLead" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "siteUrl" TEXT,
    "contactType" "FilmmakerLeadContact" NOT NULL,
    "contactValue" TEXT NOT NULL,
    "contactSource" TEXT NOT NULL,
    "verification" TEXT NOT NULL,
    "confidence" "FilmmakerLeadConfidence" NOT NULL,
    "country" TEXT,
    "sourceUrl" TEXT,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilmmakerLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: re-running the scraper re-sends the same contacts, so the
-- import upserts on this pair rather than duplicating rows.
CREATE UNIQUE INDEX "FilmmakerLead_contactType_contactValue_key"
    ON "FilmmakerLead"("contactType", "contactValue");

-- CreateIndex
CREATE INDEX "FilmmakerLead_confidence_contactType_idx"
    ON "FilmmakerLead"("confidence", "contactType");

-- CreateIndex
CREATE INDEX "FilmmakerLead_country_idx" ON "FilmmakerLead"("country");
