import { describe, expect, it } from "vitest";

import { loginSchema } from "@/lib/validation/auth";
import { createClientSchema } from "@/lib/validation/client";
import { createCommandSchema } from "@/lib/validation/command";
import { createDeviceCommandSchema } from "@/lib/validation/device-command";
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

  it("createCommandSchema requires both deviceId and deviceCommandId", () => {
    expect(createCommandSchema.safeParse({ deviceId: "d" }).success).toBe(false);
    expect(createCommandSchema.safeParse({ deviceId: "d", deviceCommandId: "dc1" }).success).toBe(true);
  });

  it("createDeviceCommandSchema rejects an sms text containing '#'", () => {
    expect(createDeviceCommandSchema.safeParse({ label: "Abrir", sms: "PORTAO#ABRIR" }).success).toBe(
      false,
    );
  });

  it("createDeviceCommandSchema accepts a valid label+sms pair", () => {
    expect(createDeviceCommandSchema.safeParse({ label: "Abrir portão", sms: "PORTAO_ABRIR" }).success).toBe(
      true,
    );
  });
});
