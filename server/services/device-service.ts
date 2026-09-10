import { notFound, validationError } from "@/lib/api/errors";
import type { CreateDeviceInput, UpdateDeviceInput } from "@/lib/validation/device";
import * as deviceRepository from "@/server/repositories/device-repository";
import * as gatewayRepository from "@/server/repositories/gateway-repository";
import type { AuthenticatedSessionUser } from "@/server/permissions/session";
import { recordAudit } from "@/server/services/audit-service";

export function listDevices() {
  return deviceRepository.findAllDevices();
}

export function listClientDevices(clientId: string) {
  return deviceRepository.findDevicesByClient(clientId);
}

export async function getDeviceOrThrow(id: string) {
  const device = await deviceRepository.findDeviceById(id);
  if (!device) throw notFound("Dispositivo não encontrado.");
  return device;
}

async function assertGatewayBelongsToClient(gatewayId: string, clientId: string) {
  const gateway = await gatewayRepository.findGatewayById(gatewayId);
  if (!gateway || gateway.clientId !== clientId) {
    throw validationError("Gateway inválido para este cliente.");
  }
}

export async function createDevice(
  clientId: string,
  input: CreateDeviceInput,
  actor: AuthenticatedSessionUser,
) {
  await assertGatewayBelongsToClient(input.gatewayId, clientId);

  const device = await deviceRepository.createDevice({
    clientId,
    gatewayId: input.gatewayId,
    name: input.name,
    phoneNumber: input.phoneNumber,
    type: input.type,
  });

  await recordAudit({
    userId: actor.id,
    action: "DEVICE_CREATED",
    entityType: "Device",
    entityId: device.id,
    metadata: { name: device.name, type: device.type, clientId },
  });

  return device;
}

export async function updateDevice(
  id: string,
  input: UpdateDeviceInput,
  actor: AuthenticatedSessionUser,
) {
  const device = await getDeviceOrThrow(id);

  if (input.gatewayId) {
    await assertGatewayBelongsToClient(input.gatewayId, device.clientId);
  }

  const updated = await deviceRepository.updateDevice(id, input);

  await recordAudit({
    userId: actor.id,
    action: "DEVICE_UPDATED",
    entityType: "Device",
    entityId: updated.id,
    metadata: input,
  });

  return updated;
}
