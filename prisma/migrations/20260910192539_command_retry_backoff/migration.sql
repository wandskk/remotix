-- DropIndex
DROP INDEX "Command_gatewayId_status_idx";

-- AlterTable
ALTER TABLE "Command" ADD COLUMN     "nextAttemptAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Command_gatewayId_status_nextAttemptAt_idx" ON "Command"("gatewayId", "status", "nextAttemptAt");
