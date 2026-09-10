import { notFound } from "@/lib/api/errors";
import type { CreateClientInput, UpdateClientInput } from "@/lib/validation/client";
import * as clientRepository from "@/server/repositories/client-repository";
import { recordAudit } from "@/server/services/audit-service";
import type { AuthenticatedSessionUser } from "@/server/permissions/session";

export function listClients() {
  return clientRepository.findAllClients();
}

export async function getClientOrThrow(id: string) {
  const client = await clientRepository.findClientById(id);
  if (!client) throw notFound("Cliente não encontrado.");
  return client;
}

export async function createClient(input: CreateClientInput, actor: AuthenticatedSessionUser) {
  const client = await clientRepository.createClient(input);
  await recordAudit({
    userId: actor.id,
    action: "CLIENT_CREATED",
    entityType: "Client",
    entityId: client.id,
    metadata: { name: client.name },
  });
  return client;
}

export async function updateClient(
  id: string,
  input: UpdateClientInput,
  actor: AuthenticatedSessionUser,
) {
  await getClientOrThrow(id);
  const client = await clientRepository.updateClient(id, input);
  await recordAudit({
    userId: actor.id,
    action: "CLIENT_UPDATED",
    entityType: "Client",
    entityId: client.id,
    metadata: input,
  });
  return client;
}
