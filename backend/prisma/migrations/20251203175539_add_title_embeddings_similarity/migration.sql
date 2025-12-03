-- CreateTable
CREATE TABLE "TitleEmbedding" (
    "id" BIGSERIAL NOT NULL,
    "titleId" BIGINT NOT NULL,
    "model" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TitleEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleSimilarity" (
    "id" BIGSERIAL NOT NULL,
    "sourceTitleId" BIGINT NOT NULL,
    "targetTitleId" BIGINT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT NOT NULL DEFAULT 'co_watch',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleSimilarity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TitleEmbedding_titleId_key" ON "TitleEmbedding"("titleId");

-- CreateIndex
CREATE INDEX "TitleEmbedding_model_idx" ON "TitleEmbedding"("model");

-- CreateIndex
CREATE INDEX "TitleSimilarity_sourceTitleId_score_idx" ON "TitleSimilarity"("sourceTitleId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "TitleSimilarity_sourceTitleId_targetTitleId_key" ON "TitleSimilarity"("sourceTitleId", "targetTitleId");

-- AddForeignKey
ALTER TABLE "TitleEmbedding" ADD CONSTRAINT "TitleEmbedding_titleId_fkey" FOREIGN KEY ("titleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleSimilarity" ADD CONSTRAINT "TitleSimilarity_sourceTitleId_fkey" FOREIGN KEY ("sourceTitleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleSimilarity" ADD CONSTRAINT "TitleSimilarity_targetTitleId_fkey" FOREIGN KEY ("targetTitleId") REFERENCES "Title"("id") ON DELETE CASCADE ON UPDATE CASCADE;
