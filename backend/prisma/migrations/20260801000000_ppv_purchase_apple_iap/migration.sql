-- Apple In-App Purchase support for PpvPurchase.
-- paystackRef becomes nullable because IAP rows have no Paystack reference;
-- appleTransactionId is their equivalent unique handle.

-- AlterTable
ALTER TABLE "PpvPurchase" ALTER COLUMN "paystackRef" DROP NOT NULL;
ALTER TABLE "PpvPurchase" ADD COLUMN "appleTransactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PpvPurchase_appleTransactionId_key" ON "PpvPurchase"("appleTransactionId");
