import { notFound } from "@/lib/api/errors";
import type { CreateDeviceCommandInput, UpdateDeviceCommandInput } from "@/lib/validation/device-command";
import * as deviceCommandRepository from "@/server/repositories/device-command-repository";
import * as deviceRepository from "@/server/repositories/device-repository";
import type { AuthenticatedSessionUser } from "@/server/permissions/session";
import { recordAudit } from "@/server/services/audit-service";

export function listDeviceCommands(deviceId: string) {
  return deviceCommandRepository.findByDevice(deviceId);
}

export async function getDeviceCommandOrThrow(id: string) {
  const deviceCommand = await deviceCommandRepository.findById(id);
  if (!deviceCommand) throw notFound("Comando não encontrado.");
  return deviceCommand;
}

export async function createDeviceCommand(
  deviceId: string,
  input: CreateDeviceCommandInput,
  actor: AuthenticatedSessionUser,
) {
  const device = await deviceRepository.findDeviceById(deviceId);
  if (!device) throw notFound("Dispositivo não encontrado.");

  const deviceCommand = await deviceCommandRepository.create({
    deviceId,
    label: input.label,
    sms: input.sms,
  });

  await recordAudit({
    userId: actor.id,
    action: "DEVICE_COMMAND_CREATED",
    entityType: "DeviceCommand",
    entityId: deviceCommand.id,
    metadata: { deviceId, label: input.label, sms: input.sms },
  });

  return deviceCommand;
}

export async function updateDeviceCommand(
  id: string,
  input: UpdateDeviceCommandInput,
  actor: AuthenticatedSessionUser,
) {
  await getDeviceCommandOrThrow(id);
  const updated = await deviceCommandRepository.update(id, input);

  await recordAudit({
    userId: actor.id,
    action: "DEVICE_COMMAND_UPDATED",
    entityType: "DeviceCommand",
    entityId: id,
    metadata: input,
  });

  return updated;
}
