import { afterEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import { activationCodeExpiry, generateActivationCode } from "@/lib/gateways/credentials";
import * as gatewayService from "@/server/services/gateway-service";
import { cleanupClient, createTestClient, createTestGateway } from "../helpers/fixtures";

describe("gateway-service", () => {
  let clientId: string | undefined;

  afterEach(async () => {
    if (clientId) await cleanupClient(clientId);
    clientId = undefined;
  });

  it("registers a gateway with a valid activation code and returns a one-time secret", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const activationCode = generateActivationCode();
    const gateway = await prisma.gateway.create({
      data: { clientId: client.id, name: "GW", activationCode, activationCodeExpiresAt: activationCodeExpiry() },
    });

    const result = await gatewayService.registerGateway({
      activationCode,
      deviceUid: "device-under-test",
    });

    expect(result.gatewayId).toBe(gateway.id);
    expect(result.gatewaySecret).toBeTruthy();

    const updated = await prisma.gateway.findUniqueOrThrow({ where: { id: gateway.id } });
    expect(updated.deviceUid).toBe("device-under-test");
    expect(updated.activationCode).toBeNull();
    expect(updated.secretHash).not.toBe(result.gatewaySecret); // nunca guarda em texto puro
  });

  it("rejects an expired activation code", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const activationCode = generateActivationCode();
    await prisma.gateway.create({
      data: {
        clientId: client.id,
        name: "GW",
        activationCode,
        activationCodeExpiresAt: new Date(Date.now() - 1000),
      },
    });

    await expect(
      gatewayService.registerGateway({ activationCode, deviceUid: "device-under-test" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("authenticates with correct deviceUid+secret", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway, secret } = await createTestGateway(client.id);

    const result = await gatewayService.authenticateGateway({ deviceUid: gateway.deviceUid!, secret });
    expect(result.id).toBe(gateway.id);
  });

  it("rejects a wrong secret", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway } = await createTestGateway(client.id);

    await expect(
      gatewayService.authenticateGateway({ deviceUid: gateway.deviceUid!, secret: "wrong" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects a gateway the admin has disabled", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway, secret } = await createTestGateway(client.id, { status: "DISABLED" });

    await expect(
      gatewayService.authenticateGateway({ deviceUid: gateway.deviceUid!, secret }),
    ).rejects.toMatchObject({ code: "GATEWAY_DISABLED" });
  });

  it("rejects a gateway whose client is inactive", async () => {
    const client = await createTestClient({ active: false });
    clientId = client.id;
    const { gateway, secret } = await createTestGateway(client.id);

    await expect(
      gatewayService.authenticateGateway({ deviceUid: gateway.deviceUid!, secret }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("heartbeat updates lastSeenAt and flips status to ONLINE", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway, secret } = await createTestGateway(client.id);

    const updated = await gatewayService.recordHeartbeat({
      deviceUid: gateway.deviceUid!,
      secret,
      batteryLevel: 87,
      networkType: "4G",
    });

    expect(updated.status).toBe("ONLINE");
    expect(updated.lastSeenAt).not.toBeNull();
    expect(updated.batteryLevel).toBe(87);
  });
});
