-- CreateTable
CREATE TABLE "ProfilePreferenceSnapshot" (
    "id" BIGSERIAL NOT NULL,
    "profileId" BIGINT NOT NULL,
    "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePreferenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePreferenceSnapshot_profileId_key" ON "ProfilePreferenceSnapshot"("profileId");

-- AddForeignKey
ALTER TABLE "ProfilePreferenceSnapshot" ADD CONSTRAINT "ProfilePreferenceSnapshot_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
