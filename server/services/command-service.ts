import { ApiError, notFound } from "@/lib/api/errors";
import { buildSmsMessage, extractNonce, generateCommandNonce } from "@/lib/commands/catalog";
import { DUPLICATE_COMMAND_WINDOW_MS, MAX_ATTEMPTS, backoffMsForAttempts } from "@/lib/commands/policy";
import { enforceRateLimit } from "@/lib/rate-limit/limiter";
import { COMMAND_CREATE_RATE_LIMIT } from "@/lib/rate-limit/policy";
import type {
  CreateCommandInput,
  InboundSmsInput,
  ReportCommandFailureInput,
} from "@/lib/validation/command";
import type { GatewayCredentialsInput } from "@/lib/validation/gateway";
import * as commandRepository from "@/server/repositories/command-repository";
import * as deviceCommandRepository from "@/server/repositories/device-command-repository";
import * as deviceRepository from "@/server/repositories/device-repository";
import * as gatewayRepository from "@/server/repositories/gateway-repository";
import * as smsMessageRepository from "@/server/repositories/sms-message-repository";
import type { AuthenticatedSessionUser } from "@/server/permissions/session";
import { recordAudit } from "@/server/services/audit-service";
import { authenticateGateway } from "@/server/services/gateway-service";
import { recordGatewayEvent } from "@/server/services/gateway-event-service";

const IN_FLIGHT_STATUSES = ["CLAIMED", "SENDING"];
const CONFIRMABLE_STATUSES = ["CLAIMED", "SENDING", "SENT"];

export async function listCommandsForActor(actor: AuthenticatedSessionUser) {
  await commandRepository.expireStalePending();
  if (actor.role === "ADMIN") return commandRepository.findAllCommands();
  return commandRepository.findCommandsByClient(actor.clientId!);
}

export function listCommandsForDevice(deviceId: string) {
  return commandRepository.findCommandsByDevice(deviceId);
}

export async function getCommandForActor(id: string, actor: AuthenticatedSessionUser) {
  const command = await commandRepository.findCommandById(id);
  if (!command) throw notFound("Comando não encontrado.");
  if (actor.role === "CLIENT" && command.clientId !== actor.clientId) {
    throw notFound("Comando não encontrado.");
  }
  return command;
}

export async function createCommand(input: CreateCommandInput, actor: AuthenticatedSessionUser) {
  const device = await deviceRepository.findDeviceById(input.deviceId);
  if (!device) throw notFound("Dispositivo não encontrado.");

  await enforceRateLimit(
    `command:${device.clientId}`,
    COMMAND_CREATE_RATE_LIMIT.limit,
    COMMAND_CREATE_RATE_LIMIT.windowMs,
  );

  if (actor.role === "CLIENT" && device.clientId !== actor.clientId) {
    throw notFound("Dispositivo não encontrado.");
  }
  if (!device.active) throw new ApiError("DEVICE_DISABLED", "Este dispositivo está desativado.");

  const gateway = await gatewayRepository.findGatewayById(device.gatewayId);
  if (!gateway) throw notFound("Gateway não encontrado.");
  if (gateway.status === "DISABLED") {
    throw new ApiError("GATEWAY_DISABLED", "O gateway deste dispositivo está desativado.");
  }

  const deviceCommand = await deviceCommandRepository.findById(input.deviceCommandId);
  if (!deviceCommand || deviceCommand.deviceId !== device.id || !deviceCommand.active) {
    throw notFound("Comando não encontrado para este dispositivo.");
  }

  const dedupeSince = new Date(Date.now() - DUPLICATE_COMMAND_WINDOW_MS);
  const inFlight = await commandRepository.findRecentInFlightCommand(
    device.id,
    deviceCommand.id,
    dedupeSince,
  );
  if (inFlight) return inFlight;

  const nonce = generateCommandNonce();
  const command = await commandRepository.createCommand({
    clientId: device.clientId,
    gatewayId: device.gatewayId,
    deviceId: device.id,
    deviceCommandId: deviceCommand.id,
    action: deviceCommand.label,
    destination: device.phoneNumber,
    message: buildSmsMessage(deviceCommand.sms, nonce),
    nonce,
  });

  await recordAudit({
    userId: actor.id,
    action: "COMMAND_CREATED",
    entityType: "Command",
    entityId: command.id,
    metadata: { deviceId: device.id, deviceCommandId: deviceCommand.id, label: deviceCommand.label },
  });

  return command;
}

export async function cancelCommand(id: string, actor: AuthenticatedSessionUser) {
  const command = await getCommandForActor(id, actor);
  if (command.status !== "PENDING" && command.status !== "CLAIMED") {
    throw new ApiError("COMMAND_ALREADY_PROCESSED", "Este comando já foi processado.");
  }

  const updated = await commandRepository.updateCommand(id, { status: "CANCELLED" });

  await recordAudit({
    userId: actor.id,
    action: "COMMAND_CANCELLED",
    entityType: "Command",
    entityId: id,
  });

  return updated;
}

// --- API do gateway (Android) ---

async function findGatewayCommandOrThrow(id: string, gatewayId: string) {
  const command = await commandRepository.findCommandById(id);
  if (!command || command.gatewayId !== gatewayId) {
    throw new ApiError("COMMAND_NOT_FOUND", "Comando não encontrado para este gateway.");
  }
  return command;
}

export async function claimNextCommand(input: GatewayCredentialsInput) {
  const gateway = await authenticateGateway(input);
  await commandRepository.expireStalePending({ gatewayId: gateway.id });

  const command = await commandRepository.claimNextCommand(gateway.id);
  if (command) {
    await recordGatewayEvent(gateway.id, "COMMAND_RECEIVED", { commandId: command.id });
  }
  return command;
}

export async function startCommand(id: string, input: GatewayCredentialsInput) {
  const gateway = await authenticateGateway(input);
  const command = await findGatewayCommandOrThrow(id, gateway.id);

  if (command.status === "SENDING") return command; // idempotente
  if (command.status !== "CLAIMED") {
    throw new ApiError("COMMAND_ALREADY_PROCESSED", "Este comando já foi processado.");
  }

  return commandRepository.updateCommand(id, { status: "SENDING" });
}

export async function markCommandSent(id: string, input: GatewayCredentialsInput) {
  const gateway = await authenticateGateway(input);
  const command = await findGatewayCommandOrThrow(id, gateway.id);

  if (command.status === "SENT" || command.status === "CONFIRMED") return command; // idempotente
  if (!IN_FLIGHT_STATUSES.includes(command.status)) {
    throw new ApiError("COMMAND_ALREADY_PROCESSED", "Este comando já foi processado.");
  }

  const updated = await commandRepository.updateCommand(id, { status: "SENT", sentAt: new Date() });

  const existing = await smsMessageRepository.findOutboundByCommand(id);
  if (!existing) {
    await smsMessageRepository.createOutboundSms({
      commandId: id,
      gatewayId: gateway.id,
      phoneNumber: command.destination,
      message: command.message,
    });
  }

  await recordGatewayEvent(gateway.id, "SMS_SENT", { commandId: id });

  return updated;
}

export async function markCommandFailed(id: string, input: ReportCommandFailureInput) {
  const gateway = await authenticateGateway(input);
  const command = await findGatewayCommandOrThrow(id, gateway.id);

  if (command.status === "PENDING" || command.status === "FAILED") return command; // idempotente
  if (!IN_FLIGHT_STATUSES.includes(command.status)) {
    throw new ApiError("COMMAND_ALREADY_PROCESSED", "Este comando já foi processado.");
  }

  const attempts = command.attempts + 1;
  const willRetry = attempts < MAX_ATTEMPTS;

  const updated = await commandRepository.updateCommand(id, {
    attempts,
    status: willRetry ? "PENDING" : "FAILED",
    nextAttemptAt: willRetry ? new Date(Date.now() + backoffMsForAttempts(attempts)) : null,
    failedAt: willRetry ? undefined : new Date(),
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
  });

  await recordGatewayEvent(gateway.id, "SMS_FAILED", { commandId: id, errorCode: input.errorCode });

  return updated;
}

// SMS enviado não significa equipamento confirmado — só a resposta do
// equipamento, correlacionada pelo nonce, confirma o comando
// (docs/sms-protocol.md#três-estados-diferentes-de-enviado).
export async function processInboundSms(input: InboundSmsInput) {
  const gateway = await authenticateGateway(input);

  const nonce = extractNonce(input.message);
  let matchedCommand = null;

  if (nonce) {
    const candidate = await commandRepository.findCommandByNonce(nonce);
    if (candidate && candidate.gatewayId === gateway.id && CONFIRMABLE_STATUSES.includes(candidate.status)) {
      matchedCommand = await commandRepository.updateCommand(candidate.id, {
        status: "CONFIRMED",
        confirmedAt: new Date(),
      });
    }
  }

  await smsMessageRepository.createInboundSms({
    gatewayId: gateway.id,
    phoneNumber: input.from,
    message: input.message,
    commandId: matchedCommand?.id ?? null,
  });

  await recordGatewayEvent(gateway.id, "SMS_RECEIVED", {
    from: input.from,
    matched: Boolean(matchedCommand),
  });

  return { matched: Boolean(matchedCommand), commandId: matchedCommand?.id };
}
