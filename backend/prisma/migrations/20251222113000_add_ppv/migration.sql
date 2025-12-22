-- Add PPV purchase status enum
CREATE TYPE "PpvPurchaseStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- Extend users with PPV violation tracking
ALTER TABLE "User"
    ADD COLUMN "ppvStrikeCount" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "ppvLastStrikeAt" TIMESTAMP(3),
    ADD COLUMN "ppvBanned" BOOLEAN NOT NULL DEFAULT FALSE;

-- Extend titles with PPV metadata
ALTER TABLE "Title"
    ADD COLUMN "isPpv" BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN "ppvPriceNaira" INTEGER,
    ADD COLUMN "ppvCurrency" TEXT NOT NULL DEFAULT 'NGN',
    ADD COLUMN "ppvDescription" TEXT;

-- Create PPV purchases
CREATE TABLE "PpvPurchase" (
    "id" BIGSERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "titleId" BIGINT NOT NULL REFERENCES "Title"("id") ON DELETE CASCADE,
    "amountNaira" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "gateway" TEXT NOT NULL DEFAULT 'PAYSTACK',
    "paystackRef" TEXT NOT NULL UNIQUE,
    "paystackTrxId" TEXT,
    "status" "PpvPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "rawPayload" JSONB,
    "accessExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX "ppv_purchase_user_title_status_idx"
    ON "PpvPurchase" ("userId", "titleId", "status");

CREATE INDEX "ppv_purchase_title_idx"
    ON "PpvPurchase" ("titleId");

CREATE INDEX "ppv_purchase_user_idx"
    ON "PpvPurchase" ("userId");

-- Track PPV access violations
CREATE TABLE "PpvViolation" (
    "id" BIGSERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "titleId" BIGINT NOT NULL REFERENCES "Title"("id") ON DELETE CASCADE,
    "path" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX "ppv_violation_user_title_idx"
    ON "PpvViolation" ("userId", "titleId");
