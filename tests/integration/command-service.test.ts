import { afterEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import * as commandService from "@/server/services/command-service";
import {
  cleanupAdminActors,
  cleanupClient,
  createAdminActor,
  createClientActor,
  createTestClient,
  createTestDevice,
  createTestGateway,
} from "../helpers/fixtures";

describe("command-service", () => {
  let clientId: string | undefined;

  afterEach(async () => {
    if (clientId) await cleanupClient(clientId);
    clientId = undefined;
    await cleanupAdminActors();
  });

  it("creates a PENDING command resolving the action to the device's catalog SMS", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id, { type: "GATE" });

    const command = await commandService.createCommand(
      { deviceId: device.id, action: "GATE_OPEN" },
      await createAdminActor(),
    );

    expect(command.status).toBe("PENDING");
    expect(command.message).toMatch(/^PORTAO_ABRIR#/);
    expect(command.destination).toBe(device.phoneNumber);
  });

  it("rejects an action invalid for the device type", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id, { type: "LIGHT" });

    await expect(
      commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor()),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects creating a command for a disabled device", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id, { active: false });

    await expect(
      commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor()),
    ).rejects.toMatchObject({ code: "DEVICE_DISABLED" });
  });

  it("prevents a CLIENT user from targeting another client's device", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id);

    const otherClient = await createTestClient();
    try {
      await expect(
        commandService.createCommand(
          { deviceId: device.id, action: "GATE_OPEN" },
          await createClientActor(otherClient.id),
        ),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    } finally {
      await cleanupClient(otherClient.id);
    }
  });

  it("deduplicates a second identical request while the first is still in flight", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id);

    const first = await commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor());
    const second = await commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor());

    expect(second.id).toBe(first.id);
  });

  it("claim is atomic: two concurrent claims for one pending command only give it to one caller", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway, secret } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id);
    await commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor());

    const creds = { deviceUid: gateway.deviceUid!, secret };
    const [a, b] = await Promise.all([
      commandService.claimNextCommand(creds),
      commandService.claimNextCommand(creds),
    ]);

    const claimed = [a, b].filter(Boolean);
    expect(claimed).toHaveLength(1);
  });

  it("marking a command sent twice does not create a duplicate SmsMessage", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway, secret } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id);
    const command = await commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor());
    const creds = { deviceUid: gateway.deviceUid!, secret };

    await commandService.claimNextCommand(creds);
    await commandService.markCommandSent(command.id, creds);
    const result = await commandService.markCommandSent(command.id, creds);

    expect(result.status).toBe("SENT");
    const messages = await prisma.smsMessage.findMany({
      where: { commandId: command.id, direction: "OUTBOUND" },
    });
    expect(messages).toHaveLength(1);
  });

  it("retries with the correct backoff and terminates as FAILED after MAX_ATTEMPTS", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway, secret } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id);
    const command = await commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor());
    const creds = { deviceUid: gateway.deviceUid!, secret };

    await commandService.claimNextCommand(creds);
    let result = await commandService.markCommandFailed(command.id, creds);
    expect(result.status).toBe("PENDING");
    expect(result.attempts).toBe(1);
    expect(result.nextAttemptAt).not.toBeNull();

    // Sem esperar o backoff de verdade: adianta nextAttemptAt pra já ter passado.
    await prisma.command.update({
      where: { id: command.id },
      data: { nextAttemptAt: new Date(Date.now() - 1000) },
    });
    await commandService.claimNextCommand(creds);
    result = await commandService.markCommandFailed(command.id, creds);
    expect(result.status).toBe("PENDING");
    expect(result.attempts).toBe(2);

    await prisma.command.update({
      where: { id: command.id },
      data: { nextAttemptAt: new Date(Date.now() - 1000) },
    });
    await commandService.claimNextCommand(creds);
    result = await commandService.markCommandFailed(command.id, creds);
    expect(result.status).toBe("FAILED");
    expect(result.attempts).toBe(3);

    // Idempotente: reportar falha de novo não incrementa mais tentativas.
    const again = await commandService.markCommandFailed(command.id, creds);
    expect(again.attempts).toBe(3);
    expect(again.status).toBe("FAILED");
  });

  it("expires a PENDING command older than the TTL", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id);
    const command = await commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor());

    await prisma.command.update({
      where: { id: command.id },
      data: { createdAt: new Date(Date.now() - 6 * 60 * 1000) },
    });

    await commandService.listCommandsForActor(await createAdminActor()); // dispara expireStalePending()

    const updated = await prisma.command.findUniqueOrThrow({ where: { id: command.id } });
    expect(updated.status).toBe("EXPIRED");
  });

  it("confirms a command when the equipment replies with the matching nonce", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway, secret } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id);
    const command = await commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor());
    const creds = { deviceUid: gateway.deviceUid!, secret };

    await commandService.claimNextCommand(creds);
    await commandService.markCommandSent(command.id, creds);

    const result = await commandService.processInboundSms({
      ...creds,
      from: device.phoneNumber,
      message: `PORTAO_OK#${command.nonce}`,
    });

    expect(result.matched).toBe(true);
    expect(result.commandId).toBe(command.id);

    const updated = await prisma.command.findUniqueOrThrow({ where: { id: command.id } });
    expect(updated.status).toBe("CONFIRMED");
  });

  it("does not resurrect an already-expired command from a stray reply", async () => {
    const client = await createTestClient();
    clientId = client.id;
    const { gateway, secret } = await createTestGateway(client.id);
    const device = await createTestDevice(client.id, gateway.id);
    const command = await commandService.createCommand({ deviceId: device.id, action: "GATE_OPEN" }, await createAdminActor());
    await prisma.command.update({ where: { id: command.id }, data: { status: "EXPIRED" } });

    const result = await commandService.processInboundSms({
      deviceUid: gateway.deviceUid!,
      secret,
      from: device.phoneNumber,
      message: `PORTAO_OK#${command.nonce}`,
    });

    expect(result.matched).toBe(false);
    const updated = await prisma.command.findUniqueOrThrow({ where: { id: command.id } });
    expect(updated.status).toBe("EXPIRED");
  });
});
