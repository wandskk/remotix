import crypto from "node:crypto";

import { notFound, validationError } from "@/lib/api/errors";
import { hashPassword } from "@/lib/auth/password";
import type { CreateClientUserInput, UpdateClientUserInput } from "@/lib/validation/user";
import * as userRepository from "@/server/repositories/user-repository";
import { recordAudit } from "@/server/services/audit-service";
import * as inviteService from "@/server/services/invite-service";
import type { AuthenticatedSessionUser } from "@/server/permissions/session";

export function listClientUsers(clientId: string) {
  return userRepository.findUsersByClient(clientId);
}

export async function getClientUserOrThrow(clientId: string, userId: string) {
  const user = await userRepository.findUserById(userId);
  if (!user || user.clientId !== clientId) throw notFound("Usuário não encontrado.");
  return user;
}

// O admin nunca define a senha do cliente — cria o usuário com um hash
// aleatório inutilizável e gera um convite de acesso único
// (docs/product-overview.md#onboarding). O token só é retornado aqui,
// uma única vez.
export async function createClientUser(
  clientId: string,
  input: CreateClientUserInput,
  actor: AuthenticatedSessionUser,
) {
  const existing = await userRepository.findUserByEmail(input.email);
  if (existing) throw validationError("Já existe um usuário com este email.");

  const unusablePassword = crypto.randomBytes(32).toString("hex");
  const passwordHash = await hashPassword(unusablePassword);

  const user = await userRepository.createClientUser({
    name: input.name,
    email: input.email,
    passwordHash,
    clientId,
  });

  const inviteToken = await inviteService.createInviteForUser(user.id);

  await recordAudit({
    userId: actor.id,
    action: "USER_CREATED",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, clientId },
  });

  return { user, inviteToken };
}

export async function updateClientUser(
  clientId: string,
  userId: string,
  input: UpdateClientUserInput,
  actor: AuthenticatedSessionUser,
) {
  await getClientUserOrThrow(clientId, userId);

  const user = await userRepository.updateUser(userId, {
    name: input.name,
    active: input.active,
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

// Gera (ou substitui) o link de convite — equivale a "resetar senha" na
// prática, já que o cliente sempre define a própria senha pelo link.
export async function regenerateInvite(
  clientId: string,
  userId: string,
  actor: AuthenticatedSessionUser,
) {
  const user = await getClientUserOrThrow(clientId, userId);
  const inviteToken = await inviteService.createInviteForUser(user.id);

  await recordAudit({
    userId: actor.id,
    action: "USER_INVITE_REGENERATED",
    entityType: "User",
    entityId: user.id,
  });

  return { user, inviteToken };
}
