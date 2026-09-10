import type { GatewayStatus } from "@/generated/prisma/enums";

// Limites configuráveis (docs/gateway-protocol.md#status-calculado).
export const GATEWAY_ONLINE_THRESHOLD_MS = 90 * 1000;
export const GATEWAY_INACTIVE_THRESHOLD_MS = 5 * 60 * 1000;

// O status não deve ser lido direto do banco como um booleano parado —
// é sempre recalculado a partir de last_seen_at, exceto quando o gateway
// foi explicitamente desativado pelo admin.
export function computeGatewayStatus(
  storedStatus: GatewayStatus,
  lastSeenAt: Date | null,
): GatewayStatus {
  if (storedStatus === "DISABLED") return "DISABLED";
  if (!lastSeenAt) return "OFFLINE";

  const elapsedMs = Date.now() - lastSeenAt.getTime();
  if (elapsedMs < GATEWAY_ONLINE_THRESHOLD_MS) return "ONLINE";
  if (elapsedMs < GATEWAY_INACTIVE_THRESHOLD_MS) return "INACTIVE";
  return "OFFLINE";
}
