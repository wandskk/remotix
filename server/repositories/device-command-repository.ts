import { prisma } from "@/lib/db/prisma";

export function findByDevice(deviceId: string) {
  return prisma.deviceCommand.findMany({ where: { deviceId }, orderBy: { createdAt: "asc" } });
}

export function findById(id: string) {
  return prisma.deviceCommand.findUnique({ where: { id } });
}

export function create(data: { deviceId: string; label: string; sms: string }) {
  return prisma.deviceCommand.create({ data });
}

export function update(id: string, data: Partial<{ label: string; sms: string; active: boolean }>) {
  return prisma.deviceCommand.update({ where: { id }, data });
}
