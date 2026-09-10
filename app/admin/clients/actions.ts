"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { ApiError } from "@/lib/api/errors";
import { createClientSchema, updateClientSchema } from "@/lib/validation/client";
import { createClientUserSchema } from "@/lib/validation/user";
import { requireAdmin } from "@/server/permissions/session";
import * as clientService from "@/server/services/client-service";
import * as userService from "@/server/services/user-service";

export type FormState = { error?: string; inviteUrl?: string } | undefined;

function messageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Dados inválidos.";
  console.error(error);
  return "Erro inesperado.";
}

export async function createClientAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  let clientId: string;
  try {
    const actor = await requireAdmin();
    const input = createClientSchema.parse({
      name: formData.get("name"),
      document: formData.get("document") || undefined,
      phone: formData.get("phone") || undefined,
      email: formData.get("email") || undefined,
    });
    const client = await clientService.createClient(input, actor);
    clientId = client.id;
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath("/admin/clients");
  redirect(`/admin/clients/${clientId}`);
}

export async function updateClientAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id") as string;
  try {
    const actor = await requireAdmin();
    const input = updateClientSchema.parse({
      name: formData.get("name") || undefined,
      document: formData.get("document") || undefined,
      phone: formData.get("phone") || undefined,
      email: formData.get("email") || undefined,
      active: formData.get("active") === "on",
    });
    await clientService.updateClient(id, input, actor);
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath(`/admin/clients/${id}`);
  revalidatePath("/admin/clients");
  return undefined;
}

export async function createClientUserAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const clientId = formData.get("clientId") as string;
  let inviteUrl: string;
  try {
    const actor = await requireAdmin();
    const input = createClientUserSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
    });
    const { inviteToken } = await userService.createClientUser(clientId, input, actor);
    inviteUrl = `/convite/${inviteToken}`;
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { inviteUrl };
}

export async function toggleClientUserActiveAction(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const userId = formData.get("userId") as string;
  const nextActive = formData.get("nextActive") === "true";

  const actor = await requireAdmin();
  await userService.updateClientUser(clientId, userId, { active: nextActive }, actor);

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function regenerateInviteAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const clientId = formData.get("clientId") as string;
  const userId = formData.get("userId") as string;

  let inviteUrl: string;
  try {
    const actor = await requireAdmin();
    const { inviteToken } = await userService.regenerateInvite(clientId, userId, actor);
    inviteUrl = `/convite/${inviteToken}`;
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { inviteUrl };
}
