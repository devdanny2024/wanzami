-- CreateTable
CREATE TABLE "ProfileRecentViews" (
    "id" BIGSERIAL NOT NULL,
    "profileId" BIGINT NOT NULL,
    "titleIds" BIGINT[] DEFAULT ARRAY[]::BIGINT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileRecentViews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileRecentViews_profileId_key" ON "ProfileRecentViews"("profileId");

-- AddForeignKey
ALTER TABLE "ProfileRecentViews" ADD CONSTRAINT "ProfileRecentViews_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
