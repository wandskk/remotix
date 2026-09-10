import { prisma } from "@/lib/db/prisma";
import { hashSecret } from "@/lib/security/hash";
import type { AuthenticatedSessionUser } from "@/server/permissions/session";
import type { GatewayStatus, DeviceType } from "@/generated/prisma/enums";

let counter = 0;
function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createTestClient(overrides: Partial<{ name: string; active: boolean }> = {}) {
  return prisma.client.create({
    data: {
      name: overrides.name ?? unique("Test Client"),
      active: overrides.active ?? true,
    },
  });
}

export async function createTestGateway(
  clientId: string,
  overrides: Partial<{ status: GatewayStatus }> = {},
) {
  const secret = unique("secret");
  const secretHash = await hashSecret(secret);

  const gateway = await prisma.gateway.create({
    data: {
      clientId,
      name: unique("Gateway"),
      deviceUid: unique("device"),
      secretHash,
      status: overrides.status ?? "OFFLINE",
    },
  });

  return { gateway, secret };
}

export async function createTestDevice(
  clientId: string,
  gatewayId: string,
  overrides: Partial<{ type: DeviceType; active: boolean }> = {},
) {
  return prisma.device.create({
    data: {
      clientId,
      gatewayId,
      name: unique("Device"),
      phoneNumber: "+5584900000000",
      type: overrides.type ?? "GATE",
      active: overrides.active ?? true,
    },
  });
}

// AuditLog.userId tem FK real pra User — os "atores" de teste precisam
// ser usuários de verdade, não IDs inventados, senão recordAudit()
// (chamado por praticamente todo service) quebra por violação de FK.
const createdAdminUserIds: string[] = [];

export async function createAdminActor(): Promise<AuthenticatedSessionUser> {
  const user = await prisma.user.create({
    data: {
      name: "Test Admin",
      email: `${unique("admin")}@test.local`,
      passwordHash: "x",
      role: "ADMIN",
    },
  });
  createdAdminUserIds.push(user.id);
  return { id: user.id, name: user.name, email: user.email, role: "ADMIN", clientId: null };
}

// Usuário CLIENT fica sob o próprio Client de teste — cascata na
// limpeza do cliente já cuida dele, não precisa de cleanup separado.
export async function createClientActor(clientId: string): Promise<AuthenticatedSessionUser> {
  const user = await prisma.user.create({
    data: {
      name: "Test Client User",
      email: `${unique("client")}@test.local`,
      passwordHash: "x",
      role: "CLIENT",
      clientId,
    },
  });
  return { id: user.id, name: user.name, email: user.email, role: "CLIENT", clientId };
}

// Cascade no schema cuida de users/gateways/devices/commands/sms/eventos.
export async function cleanupClient(clientId: string) {
  await prisma.client.delete({ where: { id: clientId } }).catch(() => {});
}

export async function cleanupAdminActors() {
  if (createdAdminUserIds.length === 0) return;
  await prisma.user.deleteMany({ where: { id: { in: createdAdminUserIds } } }).catch(() => {});
  createdAdminUserIds.length = 0;
}
