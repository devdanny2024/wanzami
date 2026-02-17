-- Live engagement: chat, reactions, moderation

CREATE TABLE "LiveChatMessage" (
  "id" BIGSERIAL PRIMARY KEY,
  "liveEventId" BIGINT NOT NULL,
  "userId" BIGINT NOT NULL,
  "message" TEXT NOT NULL,
  "isHidden" BOOLEAN NOT NULL DEFAULT false,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "moderatedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LiveReactionEvent" (
  "id" BIGSERIAL PRIMARY KEY,
  "liveEventId" BIGINT NOT NULL,
  "userId" BIGINT NOT NULL,
  "reactionType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LiveReactionAggregate" (
  "id" BIGSERIAL PRIMARY KEY,
  "liveEventId" BIGINT NOT NULL,
  "reactionType" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LiveChatModeration" (
  "id" BIGSERIAL PRIMARY KEY,
  "liveEventId" BIGINT NOT NULL,
  "userId" BIGINT NOT NULL,
  "reason" TEXT,
  "mutedUntil" TIMESTAMP(3) NOT NULL,
  "moderatedBy" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "LiveChatMessage_liveEventId_createdAt_idx" ON "LiveChatMessage"("liveEventId", "createdAt");
CREATE INDEX "LiveChatMessage_userId_createdAt_idx" ON "LiveChatMessage"("userId", "createdAt");
CREATE INDEX "LiveReactionEvent_liveEventId_createdAt_idx" ON "LiveReactionEvent"("liveEventId", "createdAt");
CREATE INDEX "LiveReactionEvent_reactionType_createdAt_idx" ON "LiveReactionEvent"("reactionType", "createdAt");
CREATE UNIQUE INDEX "LiveReactionAggregate_liveEventId_reactionType_key" ON "LiveReactionAggregate"("liveEventId", "reactionType");
CREATE INDEX "LiveReactionAggregate_liveEventId_count_idx" ON "LiveReactionAggregate"("liveEventId", "count");
CREATE INDEX "LiveChatModeration_liveEventId_userId_mutedUntil_idx" ON "LiveChatModeration"("liveEventId", "userId", "mutedUntil");
CREATE INDEX "LiveChatModeration_moderatedBy_createdAt_idx" ON "LiveChatModeration"("moderatedBy", "createdAt");

ALTER TABLE "LiveChatMessage"
  ADD CONSTRAINT "LiveChatMessage_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LiveChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LiveReactionEvent"
  ADD CONSTRAINT "LiveReactionEvent_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LiveReactionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LiveReactionAggregate"
  ADD CONSTRAINT "LiveReactionAggregate_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LiveChatModeration"
  ADD CONSTRAINT "LiveChatModeration_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LiveChatModeration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "LiveChatModeration_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
