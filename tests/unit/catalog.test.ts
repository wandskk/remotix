import { describe, expect, it } from "vitest";

import { buildSmsMessage, extractNonce, findCatalogEntry, generateCommandNonce } from "@/lib/commands/catalog";

describe("commands/catalog", () => {
  it("resolves GATE_OPEN to PORTAO_ABRIR for a GATE device", () => {
    expect(findCatalogEntry("GATE", "GATE_OPEN")?.sms).toBe("PORTAO_ABRIR");
  });

  it("does not resolve an action that belongs to a different device type", () => {
    expect(findCatalogEntry("LIGHT", "GATE_OPEN")).toBeUndefined();
  });

  it("has no predefined actions for OTHER", () => {
    expect(findCatalogEntry("OTHER", "ANYTHING")).toBeUndefined();
  });

  it("builds the SMS text embedding the nonce", () => {
    expect(buildSmsMessage("PORTAO_ABRIR", "ABC123")).toBe("PORTAO_ABRIR#ABC123");
  });

  it("extracts the nonce from an equipment reply", () => {
    expect(extractNonce("PORTAO_OK#ABC123")).toBe("ABC123");
  });

  it("returns null when the reply has no nonce separator", () => {
    expect(extractNonce("PORTAO_OK")).toBeNull();
  });

  it("generates distinct 8-char hex nonces", () => {
    const a = generateCommandNonce();
    const b = generateCommandNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9A-F]{8}$/);
  });
});
