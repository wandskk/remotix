import { forbidden, notFound, unauthorized, validationError, ApiError } from "@/lib/api/errors";
import {
  activationCodeExpiry,
  generateActivationCode,
  generateGatewaySecret,
  isActivationCodeExpired,
} from "@/lib/gateways/credentials";
import { enforceRateLimit } from "@/lib/rate-limit/limiter";
import { GATEWAY_REGISTER_RATE_LIMIT, GATEWAY_REQUEST_RATE_LIMIT } from "@/lib/rate-limit/policy";
import { hashSecret, verifySecret } from "@/lib/security/hash";
import type {
  CreateGatewayInput,
  GatewayCredentialsInput,
  HeartbeatInput,
  RegisterGatewayInput,
  UpdateGatewayInput,
} from "@/lib/validation/gateway";
import * as gatewayRepository from "@/server/repositories/gateway-repository";
import type { AuthenticatedSessionUser } from "@/server/permissions/session";
import { recordAudit } from "@/server/services/audit-service";
import { recordGatewayEvent } from "@/server/services/gateway-event-service";

export function listGateways() {
  return gatewayRepository.findAllGateways();
}

export function listClientGateways(clientId: string) {
  return gatewayRepository.findGatewaysByClient(clientId);
}

export async function getGatewayOrThrow(id: string) {
  const gateway = await gatewayRepository.findGatewayById(id);
  if (!gateway) throw notFound("Gateway não encontrado.");
  return gateway;
}

export async function createGateway(
  clientId: string,
  input: CreateGatewayInput,
  actor: AuthenticatedSessionUser,
) {
  const gateway = await gatewayRepository.createGateway({
    clientId,
    name: input.name,
    simPhone: input.simPhone,
    activationCode: generateActivationCode(),
    activationCodeExpiresAt: activationCodeExpiry(),
  });

  await recordAudit({
    userId: actor.id,
    action: "GATEWAY_CREATED",
    entityType: "Gateway",
    entityId: gateway.id,
    metadata: { name: gateway.name, clientId },
  });

  return gateway;
}

export async function regenerateActivationCode(id: string, actor: AuthenticatedSessionUser) {
  await getGatewayOrThrow(id);

  const gateway = await gatewayRepository.updateGateway(id, {
    activationCode: generateActivationCode(),
    activationCodeExpiresAt: activationCodeExpiry(),
    deviceUid: null,
    secretHash: null,
    status: "OFFLINE",
  });

  await recordAudit({
    userId: actor.id,
    action: "GATEWAY_ACTIVATION_CODE_REGENERATED",
    entityType: "Gateway",
    entityId: gateway.id,
  });

  return gateway;
}

export async function updateGateway(
  id: string,
  input: UpdateGatewayInput,
  actor: AuthenticatedSessionUser,
) {
  await getGatewayOrThrow(id);
  const gateway = await gatewayRepository.updateGateway(id, input);

  await recordAudit({
    userId: actor.id,
    action: "GATEWAY_UPDATED",
    entityType: "Gateway",
    entityId: gateway.id,
    metadata: input,
  });

  return gateway;
}

export async function setGatewayEnabled(
  id: string,
  enabled: boolean,
  actor: AuthenticatedSessionUser,
) {
  await getGatewayOrThrow(id);
  const gateway = await gatewayRepository.updateGateway(id, {
    status: enabled ? "OFFLINE" : "DISABLED",
  });

  await recordAudit({
    userId: actor.id,
    action: enabled ? "GATEWAY_ENABLED" : "GATEWAY_DISABLED",
    entityType: "Gateway",
    entityId: gateway.id,
  });

  return gateway;
}

// --- API do gateway (Android) — sem sessão de usuário, autenticação
// própria por deviceUid+secret (docs/security.md). ---

export async function registerGateway(input: RegisterGatewayInput) {
  await enforceRateLimit(
    `gateway-register:${input.activationCode}`,
    GATEWAY_REGISTER_RATE_LIMIT.limit,
    GATEWAY_REGISTER_RATE_LIMIT.windowMs,
  );

  const gateway = await gatewayRepository.findGatewayByActivationCode(input.activationCode);

  if (!gateway || isActivationCodeExpired(gateway.activationCodeExpiresAt)) {
    throw validationError("Código de ativação inválido ou expirado.");
  }

  const secret = generateGatewaySecret();
  const secretHash = await hashSecret(secret);

  let updated;
  try {
    updated = await gatewayRepository.updateGateway(gateway.id, {
      deviceUid: input.deviceUid,
      secretHash,
      appVersion: input.appVersion,
      activationCode: null,
      activationCodeExpiresAt: null,
    });
  } catch {
    throw validationError("Este aparelho já está vinculado a outro gateway.");
  }

  await recordGatewayEvent(updated.id, "CONNECTED", { deviceUid: input.deviceUid });

  return {
    gatewayId: updated.id,
    gatewaySecret: secret,
    name: updated.name,
    clientId: updated.clientId,
  };
}

export async function authenticateGateway(input: GatewayCredentialsInput) {
  // Único ponto de entrada para toda a API do gateway (auth, heartbeat,
  // claim, start, sent, failed) — um limite aqui cobre /api/gateway/*
  // inteiro (docs/security.md#rate-limiting).
  await enforceRateLimit(
    `gateway:${input.deviceUid}`,
    GATEWAY_REQUEST_RATE_LIMIT.limit,
    GATEWAY_REQUEST_RATE_LIMIT.windowMs,
  );

  const gateway = await gatewayRepository.findGatewayByDeviceUid(input.deviceUid);
  if (!gateway || !gateway.secretHash) throw unauthorized("Credenciais de gateway inválidas.");

  const isValid = await verifySecret(input.secret, gateway.secretHash);
  if (!isValid) throw unauthorized("Credenciais de gateway inválidas.");

  if (gateway.status === "DISABLED") {
    throw new ApiError("GATEWAY_DISABLED", "Este gateway foi desativado.");
  }
  if (!gateway.client.active) {
    throw forbidden("Cliente inativo.");
  }

  return gateway;
}

export async function recordHeartbeat(input: HeartbeatInput) {
  const gateway = await authenticateGateway(input);

  const updated = await gatewayRepository.updateGateway(gateway.id, {
    status: "ONLINE",
    lastSeenAt: new Date(),
    batteryLevel: input.batteryLevel,
    networkType: input.networkType,
    appVersion: input.appVersion,
  });

  await recordGatewayEvent(updated.id, "HEARTBEAT", {
    batteryLevel: input.batteryLevel,
    networkType: input.networkType,
    appVersion: input.appVersion,
  });

  return updated;
}
