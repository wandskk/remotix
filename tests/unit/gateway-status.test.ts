import { describe, expect, it } from "vitest";

import { computeGatewayStatus } from "@/lib/gateways/status";

describe("gateways/status", () => {
  it("is OFFLINE when never seen", () => {
    expect(computeGatewayStatus("OFFLINE", null)).toBe("OFFLINE");
  });

  it("is ONLINE within the online threshold", () => {
    expect(computeGatewayStatus("ONLINE", new Date())).toBe("ONLINE");
  });

  it("is INACTIVE past the online threshold but within the inactive one", () => {
    const seen = new Date(Date.now() - 2 * 60 * 1000);
    expect(computeGatewayStatus("ONLINE", seen)).toBe("INACTIVE");
  });

  it("is OFFLINE past the inactive threshold", () => {
    const seen = new Date(Date.now() - 10 * 60 * 1000);
    expect(computeGatewayStatus("ONLINE", seen)).toBe("OFFLINE");
  });

  it("stays DISABLED regardless of last_seen_at", () => {
    expect(computeGatewayStatus("DISABLED", new Date())).toBe("DISABLED");
  });
});
