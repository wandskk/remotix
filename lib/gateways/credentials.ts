import crypto from "node:crypto";

// Sem 0/O/1/I para evitar confusão ao digitar o código de ativação
// (docs/gateway-protocol.md).
const ACTIVATION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ACTIVATION_CODE_TTL_MS = 15 * 60 * 1000;

function randomFromAlphabet(alphabet: string, length: number): string {
  return Array.from({ length }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
}

export function generateActivationCode(): string {
  return `${randomFromAlphabet(ACTIVATION_CODE_ALPHABET, 4)}-${randomFromAlphabet(ACTIVATION_CODE_ALPHABET, 4)}`;
}

export function generateGatewaySecret(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function activationCodeExpiry(): Date {
  return new Date(Date.now() + ACTIVATION_CODE_TTL_MS);
}

export function isActivationCodeExpired(expiresAt: Date | null): boolean {
  return !expiresAt || expiresAt.getTime() < Date.now();
}
