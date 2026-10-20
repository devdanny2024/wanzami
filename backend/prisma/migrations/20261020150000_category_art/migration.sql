-- Discover category art overrides (additive: one new table).
-- CreateTable
CREATE TABLE "CategoryArt" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryArt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CategoryArt_kind_slug_key" ON "CategoryArt"("kind", "slug");
