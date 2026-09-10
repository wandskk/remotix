import { describe, expect, it } from "vitest";

import { enforceRateLimit } from "@/lib/rate-limit/limiter";

describe("rate-limit/limiter (Postgres-backed)", () => {
  it("allows requests up to the limit and blocks once exceeded", async () => {
    const key = `test:${crypto.randomUUID()}`;
    for (let i = 0; i < 3; i++) {
      await enforceRateLimit(key, 3, 60_000);
    }
    await expect(enforceRateLimit(key, 3, 60_000)).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("resets once a new window starts", async () => {
    const key = `test:${crypto.randomUUID()}`;
    await enforceRateLimit(key, 1, 50);
    await new Promise((resolve) => setTimeout(resolve, 60));
    await expect(enforceRateLimit(key, 1, 50)).resolves.not.toThrow();
  });
});
