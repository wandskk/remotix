"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { ApiError } from "@/lib/api/errors";
import { createGatewaySchema, updateGatewaySchema } from "@/lib/validation/gateway";
import { requireAdmin } from "@/server/permissions/session";
import * as gatewayService from "@/server/services/gateway-service";

export type FormState = { error?: string } | undefined;

function messageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Dados inválidos.";
  console.error(error);
  return "Erro inesperado.";
}

export async function createGatewayAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const clientId = formData.get("clientId") as string;
  let gatewayId: string;
  try {
    const actor = await requireAdmin();
    const input = createGatewaySchema.parse({
      name: formData.get("name"),
      simPhone: formData.get("simPhone") || undefined,
    });
    const gateway = await gatewayService.createGateway(clientId, input, actor);
    gatewayId = gateway.id;
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/gateways");
  redirect(`/admin/gateways/${gatewayId}`);
}

export async function updateGatewayAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id") as string;
  try {
    const actor = await requireAdmin();
    const input = updateGatewaySchema.parse({
      name: formData.get("name") || undefined,
      simPhone: formData.get("simPhone") || undefined,
    });
    await gatewayService.updateGateway(id, input, actor);
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath(`/admin/gateways/${id}`);
  revalidatePath("/admin/gateways");
  return undefined;
}

export async function regenerateActivationCodeAction(formData: FormData) {
  const id = formData.get("id") as string;
  const actor = await requireAdmin();
  await gatewayService.regenerateActivationCode(id, actor);
  revalidatePath(`/admin/gateways/${id}`);
}

export async function toggleGatewayEnabledAction(formData: FormData) {
  const id = formData.get("id") as string;
  const nextEnabled = formData.get("nextEnabled") === "true";
  const actor = await requireAdmin();
  await gatewayService.setGatewayEnabled(id, nextEnabled, actor);
  revalidatePath(`/admin/gateways/${id}`);
  revalidatePath("/admin/gateways");
}
