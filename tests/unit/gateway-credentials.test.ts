import { describe, expect, it } from "vitest";

import {
  generateActivationCode,
  generateGatewaySecret,
  isActivationCodeExpired,
} from "@/lib/gateways/credentials";

describe("gateways/credentials", () => {
  it("activation codes follow XXXX-XXXX with no ambiguous characters", () => {
    const code = generateActivationCode();
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it("generates a reasonably long opaque secret", () => {
    expect(generateGatewaySecret().length).toBeGreaterThan(30);
  });

  it("treats a missing expiry as expired", () => {
    expect(isActivationCodeExpired(null)).toBe(true);
  });

  it("treats a future expiry as not expired", () => {
    expect(isActivationCodeExpired(new Date(Date.now() + 60_000))).toBe(false);
  });

  it("treats a past expiry as expired", () => {
    expect(isActivationCodeExpired(new Date(Date.now() - 60_000))).toBe(true);
  });
});
