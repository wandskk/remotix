import { ApiError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

// Janela fixa contada no Postgres (docs/security.md#rate-limiting) — sem
// Redis no MVP. O upsert com incremento é uma única instrução
// (INSERT ... ON CONFLICT DO UPDATE), atômica no Postgres.
export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });

  if (bucket.count > limit) {
    throw new ApiError("RATE_LIMITED", "Muitas tentativas. Tente novamente em instantes.");
  }
}
