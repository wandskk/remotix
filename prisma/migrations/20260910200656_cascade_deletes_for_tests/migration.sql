-- DropForeignKey
ALTER TABLE "Command" DROP CONSTRAINT "Command_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Command" DROP CONSTRAINT "Command_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "Command" DROP CONSTRAINT "Command_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "Gateway" DROP CONSTRAINT "Gateway_clientId_fkey";

-- DropForeignKey
ALTER TABLE "GatewayEvent" DROP CONSTRAINT "GatewayEvent_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "SmsMessage" DROP CONSTRAINT "SmsMessage_gatewayId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_clientId_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gateway" ADD CONSTRAINT "Gateway_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "Gateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Command" ADD CONSTRAINT "Command_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Command" ADD CONSTRAINT "Command_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "Gateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Command" ADD CONSTRAINT "Command_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmsMessage" ADD CONSTRAINT "SmsMessage_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "Gateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatewayEvent" ADD CONSTRAINT "GatewayEvent_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "Gateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
