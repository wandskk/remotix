import { describe, expect, it } from "vitest";

import { MAX_ATTEMPTS, backoffMsForAttempts, isPendingExpired } from "@/lib/commands/policy";

describe("commands/policy", () => {
  it("allows at most 3 attempts", () => {
    expect(MAX_ATTEMPTS).toBe(3);
  });

  it("backs off 10s after the 1st failure and 30s after the 2nd", () => {
    expect(backoffMsForAttempts(1)).toBe(10_000);
    expect(backoffMsForAttempts(2)).toBe(30_000);
  });

  it("treats a fresh command as not expired", () => {
    expect(isPendingExpired(new Date())).toBe(false);
  });

  it("treats a command older than the TTL as expired", () => {
    const old = new Date(Date.now() - 6 * 60 * 1000);
    expect(isPendingExpired(old)).toBe(true);
  });
});
