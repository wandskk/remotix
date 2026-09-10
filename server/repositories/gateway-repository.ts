import { prisma } from "@/lib/db/prisma";
import type { GatewayStatus } from "@/generated/prisma/enums";

export function findAllGateways() {
  return prisma.gateway.findMany({
    include: { client: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function findGatewaysByClient(clientId: string) {
  return prisma.gateway.findMany({ where: { clientId }, orderBy: { createdAt: "desc" } });
}

export function findGatewayById(id: string) {
  return prisma.gateway.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true } } },
  });
}

export function findGatewayByDeviceUid(deviceUid: string) {
  return prisma.gateway.findUnique({
    where: { deviceUid },
    include: { client: { select: { id: true, active: true } } },
  });
}

export function findGatewayByActivationCode(activationCode: string) {
  return prisma.gateway.findUnique({ where: { activationCode } });
}

export function createGateway(data: {
  clientId: string;
  name: string;
  simPhone?: string;
  activationCode: string;
  activationCodeExpiresAt: Date;
}) {
  return prisma.gateway.create({ data });
}

export function updateGateway(
  id: string,
  data: Partial<{
    name: string;
    simPhone: string;
    status: GatewayStatus;
    deviceUid: string | null;
    secretHash: string | null;
    activationCode: string | null;
    activationCodeExpiresAt: Date | null;
    lastSeenAt: Date;
    appVersion: string;
    batteryLevel: number;
    networkType: string;
  }>,
) {
  return prisma.gateway.update({ where: { id }, data });
}
