import { describe, expect, it } from "vitest";

import { hashSecret, verifySecret } from "@/lib/security/hash";

describe("security/hash", () => {
  it("verifies a correct value against its hash", async () => {
    const hash = await hashSecret("correct-horse");
    expect(await verifySecret("correct-horse", hash)).toBe(true);
  });

  it("rejects an incorrect value", async () => {
    const hash = await hashSecret("correct-horse");
    expect(await verifySecret("wrong", hash)).toBe(false);
  });

  it("never stores the plaintext in the hash", async () => {
    const hash = await hashSecret("correct-horse");
    expect(hash).not.toContain("correct-horse");
  });
});
