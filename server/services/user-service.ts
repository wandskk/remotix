import { notFound, validationError } from "@/lib/api/errors";
import { hashPassword } from "@/lib/auth/password";
import type { CreateClientUserInput, UpdateClientUserInput } from "@/lib/validation/user";
import * as userRepository from "@/server/repositories/user-repository";
import { recordAudit } from "@/server/services/audit-service";
import type { AuthenticatedSessionUser } from "@/server/permissions/session";

export function listClientUsers(clientId: string) {
  return userRepository.findUsersByClient(clientId);
}

export async function getClientUserOrThrow(clientId: string, userId: string) {
  const user = await userRepository.findUserById(userId);
  if (!user || user.clientId !== clientId) throw notFound("Usuário não encontrado.");
  return user;
}

export async function createClientUser(
  clientId: string,
  input: CreateClientUserInput,
  actor: AuthenticatedSessionUser,
) {
  const existing = await userRepository.findUserByEmail(input.email);
  if (existing) throw validationError("Já existe um usuário com este email.");

  const passwordHash = await hashPassword(input.password);
  const user = await userRepository.createClientUser({
    name: input.name,
    email: input.email,
    passwordHash,
    clientId,
  });

  await recordAudit({
    userId: actor.id,
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, clientId },
  });

  return user;
}

export async function updateClientUser(
  clientId: string,
  userId: string,
  input: UpdateClientUserInput,
  actor: AuthenticatedSessionUser,
) {
  await getClientUserOrThrow(clientId, userId);

  const passwordHash = input.password ? await hashPassword(input.password) : undefined;
  const user = await userRepository.updateUser(userId, {
    name: input.name,
    active: input.active,
    passwordHash,
  });

  await recordAudit({
    userId: actor.id,
    action: "USER_UPDATED",
    entityType: "User",
    entityId: user.id,
    metadata: { active: input.active },
  });

  return user;
}
