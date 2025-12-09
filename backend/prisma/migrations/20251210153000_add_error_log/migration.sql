-- ErrorLog table for capturing server errors
CREATE TABLE IF NOT EXISTS "ErrorLog" (
  "id" BIGSERIAL PRIMARY KEY,
  "level" TEXT NOT NULL DEFAULT 'ERROR',
  "message" TEXT NOT NULL,
  "stack" TEXT,
  "path" TEXT,
  "context" JSONB,
  "userId" BIGINT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ErrorLog_createdAt_idx" ON "ErrorLog"("createdAt");
