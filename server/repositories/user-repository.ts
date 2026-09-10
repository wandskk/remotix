import { prisma } from "@/lib/db/prisma";

export function findUsersByClient(clientId: string) {
  return prisma.user.findMany({
    where: { clientId },
    include: { inviteToken: true },
    orderBy: { createdAt: "desc" },
  });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function createClientUser(data: {
  name: string;
  email: string;
  passwordHash: string;
  clientId: string;
}) {
  return prisma.user.create({
    data: { ...data, role: "CLIENT" },
  });
}

export function updateUser(
  id: string,
  data: Partial<{ name: string; passwordHash: string; active: boolean }>,
) {
  return prisma.user.update({ where: { id }, data });
}
