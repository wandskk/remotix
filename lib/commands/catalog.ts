import crypto from "node:crypto";

// Correlaciona a resposta do equipamento ao comando (docs/sms-protocol.md).
// Ex.: PORTAO_ABRIR#A81F92 → resposta esperada PORTAO_OK#A81F92.
export function generateCommandNonce(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export function buildSmsMessage(sms: string, nonce: string): string {
  return `${sms}#${nonce}`;
}

// Extrai o nonce de uma resposta recebida (ex. "PORTAO_OK#A81F92" -> "A81F92").
export function extractNonce(message: string): string | null {
  const parts = message.trim().split("#");
  if (parts.length < 2) return null;
  const nonce = parts[parts.length - 1].trim().toUpperCase();
  return nonce || null;
}
