-- AlterTable
ALTER TABLE "Command" ADD COLUMN     "deviceCommandId" TEXT;

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceCommand" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sms" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceCommand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_userId_key" ON "InviteToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_tokenHash_key" ON "InviteToken"("tokenHash");

-- CreateIndex
CREATE INDEX "DeviceCommand_deviceId_idx" ON "DeviceCommand"("deviceId");

-- AddForeignKey
ALTER TABLE "InviteToken" ADD CONSTRAINT "InviteToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceCommand" ADD CONSTRAINT "DeviceCommand_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Command" ADD CONSTRAINT "Command_deviceCommandId_fkey" FOREIGN KEY ("deviceCommandId") REFERENCES "DeviceCommand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
