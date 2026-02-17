-- Live engagement: chat, reactions, moderation
-- Idempotent migration for environments where some objects may already exist.

CREATE TABLE IF NOT EXISTS "LiveChatMessage" (
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

CREATE TABLE IF NOT EXISTS "LiveReactionEvent" (
  "id" BIGSERIAL PRIMARY KEY,
  "liveEventId" BIGINT NOT NULL,
  "userId" BIGINT NOT NULL,
  "reactionType" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LiveReactionAggregate" (
  "id" BIGSERIAL PRIMARY KEY,
  "liveEventId" BIGINT NOT NULL,
  "reactionType" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "LiveChatModeration" (
  "id" BIGSERIAL PRIMARY KEY,
  "liveEventId" BIGINT NOT NULL,
  "userId" BIGINT NOT NULL,
  "reason" TEXT,
  "mutedUntil" TIMESTAMP(3) NOT NULL,
  "moderatedBy" BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "LiveChatMessage_liveEventId_createdAt_idx" ON "LiveChatMessage"("liveEventId", "createdAt");
CREATE INDEX IF NOT EXISTS "LiveChatMessage_userId_createdAt_idx" ON "LiveChatMessage"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "LiveReactionEvent_liveEventId_createdAt_idx" ON "LiveReactionEvent"("liveEventId", "createdAt");
CREATE INDEX IF NOT EXISTS "LiveReactionEvent_reactionType_createdAt_idx" ON "LiveReactionEvent"("reactionType", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "LiveReactionAggregate_liveEventId_reactionType_key" ON "LiveReactionAggregate"("liveEventId", "reactionType");
CREATE INDEX IF NOT EXISTS "LiveReactionAggregate_liveEventId_count_idx" ON "LiveReactionAggregate"("liveEventId", "count");
CREATE INDEX IF NOT EXISTS "LiveChatModeration_liveEventId_userId_mutedUntil_idx" ON "LiveChatModeration"("liveEventId", "userId", "mutedUntil");
CREATE INDEX IF NOT EXISTS "LiveChatModeration_moderatedBy_createdAt_idx" ON "LiveChatModeration"("moderatedBy", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LiveChatMessage_liveEventId_fkey') THEN
    ALTER TABLE "LiveChatMessage"
      ADD CONSTRAINT "LiveChatMessage_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LiveChatMessage_userId_fkey') THEN
    ALTER TABLE "LiveChatMessage"
      ADD CONSTRAINT "LiveChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LiveReactionEvent_liveEventId_fkey') THEN
    ALTER TABLE "LiveReactionEvent"
      ADD CONSTRAINT "LiveReactionEvent_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LiveReactionEvent_userId_fkey') THEN
    ALTER TABLE "LiveReactionEvent"
      ADD CONSTRAINT "LiveReactionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LiveReactionAggregate_liveEventId_fkey') THEN
    ALTER TABLE "LiveReactionAggregate"
      ADD CONSTRAINT "LiveReactionAggregate_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LiveChatModeration_liveEventId_fkey') THEN
    ALTER TABLE "LiveChatModeration"
      ADD CONSTRAINT "LiveChatModeration_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LiveChatModeration_userId_fkey') THEN
    ALTER TABLE "LiveChatModeration"
      ADD CONSTRAINT "LiveChatModeration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LiveChatModeration_moderatedBy_fkey') THEN
    ALTER TABLE "LiveChatModeration"
      ADD CONSTRAINT "LiveChatModeration_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
