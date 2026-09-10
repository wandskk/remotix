import { prisma } from "@/lib/db/prisma";

export function findByTokenHash(tokenHash: string) {
  return prisma.inviteToken.findUnique({ where: { tokenHash }, include: { user: true } });
}

export function findByUserId(userId: string) {
  return prisma.inviteToken.findUnique({ where: { userId } });
}

export function upsertForUser(userId: string, tokenHash: string, expiresAt: Date) {
  return prisma.inviteToken.upsert({
    where: { userId },
    create: { userId, tokenHash, expiresAt },
    update: { tokenHash, expiresAt, usedAt: null },
  });
}

export function markUsed(id: string) {
  return prisma.inviteToken.update({ where: { id }, data: { usedAt: new Date() } });
}
