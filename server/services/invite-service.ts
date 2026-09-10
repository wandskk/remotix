import { notFound } from "@/lib/api/errors";
import { hashPassword } from "@/lib/auth/password";
import { generateInviteToken, hashInviteToken, inviteTokenExpiry, isInviteTokenExpired } from "@/lib/invites/tokens";
import * as inviteRepository from "@/server/repositories/invite-repository";
import * as userRepository from "@/server/repositories/user-repository";
import { recordAudit } from "@/server/services/audit-service";

export type InviteStatus = "none" | "pending" | "expired" | "accepted";

export function inviteStatusFor(invite: { usedAt: Date | null; expiresAt: Date } | null): InviteStatus {
  if (!invite) return "none";
  if (invite.usedAt) return "accepted";
  if (isInviteTokenExpired(invite.expiresAt)) return "expired";
  return "pending";
}

// Retorna o token em texto puro — só existe neste instante, nunca mais é
// recuperável depois (só o hash fica salvo).
export async function createInviteForUser(userId: string): Promise<string> {
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  await inviteRepository.upsertForUser(userId, tokenHash, inviteTokenExpiry());
  return token;
}

export async function validateInviteToken(token: string) {
  const tokenHash = hashInviteToken(token);
  const invite = await inviteRepository.findByTokenHash(tokenHash);

  if (!invite || invite.usedAt || isInviteTokenExpired(invite.expiresAt)) {
    throw notFound("Link de convite inválido ou expirado.");
  }

  return invite;
}

export async function acceptInvite(token: string, password: string) {
  const invite = await validateInviteToken(token);

  const passwordHash = await hashPassword(password);
  await userRepository.updateUser(invite.userId, { passwordHash });
  await inviteRepository.markUsed(invite.id);

  await recordAudit({
    userId: invite.userId,
    action: "USER_INVITE_ACCEPTED",
    entityType: "User",
    entityId: invite.userId,
  });

  return invite.user;
}
