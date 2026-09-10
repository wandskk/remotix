import { prisma } from "@/lib/db/prisma";
import { COMMAND_TTL_MS } from "@/lib/commands/policy";
import type { CommandStatus } from "@/generated/prisma/enums";

const commandListInclude = {
  device: { select: { id: true, name: true, type: true } },
  gateway: { select: { id: true, name: true } },
  client: { select: { id: true, name: true } },
} as const;

export function findAllCommands() {
  return prisma.command.findMany({
    include: commandListInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export function findCommandsByClient(clientId: string) {
  return prisma.command.findMany({
    where: { clientId },
    include: commandListInclude,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export function findCommandsByDevice(deviceId: string) {
  return prisma.command.findMany({
    where: { deviceId },
    include: commandListInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export function findCommandById(id: string) {
  return prisma.command.findUnique({ where: { id }, include: commandListInclude });
}

export function findCommandByNonce(nonce: string) {
  return prisma.command.findUnique({ where: { nonce } });
}

// Usado para deduplicar criação (docs — proteção contra comando
// duplicado): mesmo dispositivo+ação, ainda em andamento, criado há
// pouco tempo.
export function findRecentInFlightCommand(deviceId: string, action: string, since: Date) {
  return prisma.command.findFirst({
    where: {
      deviceId,
      action,
      status: { in: ["PENDING", "CLAIMED", "SENDING"] },
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });
}

export function createCommand(data: {
  clientId: string;
  gatewayId: string;
  deviceId: string;
  action: string;
  destination: string;
  message: string;
  nonce: string;
}) {
  return prisma.command.create({ data });
}

export function updateCommand(
  id: string,
  data: Partial<{
    status: CommandStatus;
    attempts: number;
    nextAttemptAt: Date | null;
    claimedAt: Date;
    sentAt: Date;
    confirmedAt: Date;
    failedAt: Date;
    errorCode: string | null;
    errorMessage: string | null;
  }>,
) {
  return prisma.command.update({ where: { id }, data });
}

// Marca como EXPIRED qualquer PENDING mais velho que o TTL — não há cron
// no MVP serverless, então isso roda oportunisticamente antes de listar
// ou de tentar um claim (docs/security.md#expiração).
export async function expireStalePending(where?: { gatewayId?: string }) {
  const cutoff = new Date(Date.now() - COMMAND_TTL_MS);
  await prisma.command.updateMany({
    where: { status: "PENDING", createdAt: { lt: cutoff }, ...where },
    data: { status: "EXPIRED" },
  });
}

// Claim atômico: usa UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP
// LOCKED) para garantir que dois requests concorrentes nunca peguem o
// mesmo comando (docs/gateway-protocol.md#claim-de-comandos).
export async function claimNextCommand(gatewayId: string) {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    UPDATE "Command"
    SET status = 'CLAIMED', "claimedAt" = now()
    WHERE id = (
      SELECT id FROM "Command"
      WHERE "gatewayId" = ${gatewayId}
        AND status = 'PENDING'
        AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= now())
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id
  `;

  const claimedId = rows[0]?.id;
  if (!claimedId) return null;

  return findCommandById(claimedId);
}
