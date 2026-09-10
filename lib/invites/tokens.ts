import crypto from "node:crypto";

// Convite de acesso único (docs/product-overview.md#onboarding) — o admin
// nunca define a senha do cliente; o cliente abre este link uma vez e
// define a própria senha.
export const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

// SHA-256 (não bcrypt): precisa ser buscável por igualdade a partir do
// token cru que chega na URL — bcrypt não permite isso sem varrer todos
// os hashes salvos.
export function hashInviteToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function inviteTokenExpiry(): Date {
  return new Date(Date.now() + INVITE_TOKEN_TTL_MS);
}

export function isInviteTokenExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now();
}
