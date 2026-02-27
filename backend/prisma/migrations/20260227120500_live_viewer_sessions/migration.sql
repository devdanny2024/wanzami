-- CreateTable
CREATE TABLE "LiveViewerSession" (
    "id" BIGSERIAL NOT NULL,
    "liveEventId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveViewerSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveViewerSession_liveEventId_userId_key" ON "LiveViewerSession"("liveEventId", "userId");

-- CreateIndex
CREATE INDEX "LiveViewerSession_liveEventId_lastSeenAt_idx" ON "LiveViewerSession"("liveEventId", "lastSeenAt");

-- CreateIndex
CREATE INDEX "LiveViewerSession_userId_lastSeenAt_idx" ON "LiveViewerSession"("userId", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "LiveViewerSession" ADD CONSTRAINT "LiveViewerSession_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveViewerSession" ADD CONSTRAINT "LiveViewerSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
