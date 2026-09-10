import { prisma } from "@/lib/db/prisma";
import type { DeviceType } from "@/generated/prisma/enums";

export function findAllDevices() {
  return prisma.device.findMany({
    include: {
      client: { select: { id: true, name: true } },
      gateway: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function findDevicesByClient(clientId: string) {
  return prisma.device.findMany({
    where: { clientId },
    include: { gateway: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function findDeviceById(id: string) {
  return prisma.device.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      gateway: { select: { id: true, name: true, clientId: true } },
    },
  });
}

export function createDevice(data: {
  clientId: string;
  gatewayId: string;
  name: string;
  phoneNumber: string;
  type: DeviceType;
}) {
  return prisma.device.create({ data });
}

export function updateDevice(
  id: string,
  data: Partial<{
    gatewayId: string;
    name: string;
    phoneNumber: string;
    type: DeviceType;
    active: boolean;
  }>,
) {
  return prisma.device.update({ where: { id }, data });
}
