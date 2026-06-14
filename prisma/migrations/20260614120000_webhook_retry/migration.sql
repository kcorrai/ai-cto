-- AlterEnum
ALTER TYPE "WebhookDeliveryStatus" ADD VALUE 'dead';

-- AlterTable
ALTER TABLE "webhook_deliveries" ADD COLUMN "nextRetryAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_nextRetryAt_idx" ON "webhook_deliveries"("status", "nextRetryAt");
