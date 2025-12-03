-- CreateEnum
CREATE TYPE "PopularityWindow" AS ENUM ('DAILY', 'TRENDING');

-- CreateTable
CREATE TABLE "PopularitySnapshot" (
    "id" BIGSERIAL NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'unknown',
    "type" "TitleType" NOT NULL,
    "window" "PopularityWindow" NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "items" JSONB NOT NULL,

    CONSTRAINT "PopularitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PopularitySnapshot_type_window_idx" ON "PopularitySnapshot"("type", "window");

-- CreateIndex
CREATE UNIQUE INDEX "PopularitySnapshot_country_type_window_key" ON "PopularitySnapshot"("country", "type", "window");
