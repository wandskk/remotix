import { describe, expect, it } from "vitest";

import { loginSchema } from "@/lib/validation/auth";
import { createClientSchema } from "@/lib/validation/client";
import { createCommandSchema } from "@/lib/validation/command";
import { heartbeatSchema } from "@/lib/validation/gateway";

describe("validation schemas", () => {
  it("loginSchema rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("loginSchema accepts valid credentials", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("createClientSchema requires a name", () => {
    expect(createClientSchema.safeParse({}).success).toBe(false);
  });

  it("heartbeatSchema rejects a battery level outside 0-100", () => {
    expect(
      heartbeatSchema.safeParse({ deviceUid: "d", secret: "s", batteryLevel: 150 }).success,
    ).toBe(false);
  });

  it("createCommandSchema requires both deviceId and action", () => {
    expect(createCommandSchema.safeParse({ deviceId: "d" }).success).toBe(false);
    expect(createCommandSchema.safeParse({ deviceId: "d", action: "GATE_OPEN" }).success).toBe(true);
  });
});
