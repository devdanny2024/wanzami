-- CreateTable: admin-set FX rate that overrides the live exchange-rate API
-- for a currency. rate = units of `currency` per 1 NGN.
CREATE TABLE "FxRateOverride" (
    "id" BIGSERIAL NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FxRateOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FxRateOverride_currency_key" ON "FxRateOverride"("currency");
