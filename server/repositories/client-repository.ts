import { prisma } from "@/lib/db/prisma";

export function findAllClients() {
  return prisma.client.findMany({ orderBy: { createdAt: "desc" } });
}

export function findClientById(id: string) {
  return prisma.client.findUnique({ where: { id } });
}

export function createClient(data: {
  name: string;
  document?: string;
  phone?: string;
  email?: string;
}) {
  return prisma.client.create({ data });
}

export function updateClient(
  id: string,
  data: Partial<{ name: string; document: string; phone: string; email: string; active: boolean }>,
) {
  return prisma.client.update({ where: { id }, data });
}
