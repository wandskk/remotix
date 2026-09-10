// Política de fila (docs/security.md#retry, #expiração).

export const MAX_ATTEMPTS = 3;

// Índice = attempts após o incremento na falha; valor = espera antes da
// PRÓXIMA tentativa. tentativa 1 → imediata, 2 → +10s, 3 → +30s.
const RETRY_BACKOFF_MS: Record<number, number> = {
  1: 10_000,
  2: 30_000,
};

export function backoffMsForAttempts(attempts: number): number {
  return RETRY_BACKOFF_MS[attempts] ?? 30_000;
}

export const COMMAND_TTL_MS = 5 * 60 * 1000;

// Janela de deduplicação na criação (docs — "Proteção contra duplicação
// de comandos"): um duplo clique, resubmissão de formulário ou retry de
// rede não deve gerar dois SMS para a mesma ação no mesmo dispositivo
// enquanto o comando anterior ainda está em andamento.
export const DUPLICATE_COMMAND_WINDOW_MS = 10_000;

export function isPendingExpired(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > COMMAND_TTL_MS;
}
