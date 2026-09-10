"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { ApiError } from "@/lib/api/errors";
import { createDeviceSchema, updateDeviceSchema } from "@/lib/validation/device";
import { requireAdmin } from "@/server/permissions/session";
import * as deviceService from "@/server/services/device-service";

export type FormState = { error?: string } | undefined;

function messageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Dados inválidos.";
  console.error(error);
  return "Erro inesperado.";
}

export async function createDeviceAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const clientId = formData.get("clientId") as string;
  let deviceId: string;
  try {
    const actor = await requireAdmin();
    const input = createDeviceSchema.parse({
      gatewayId: formData.get("gatewayId"),
      name: formData.get("name"),
      phoneNumber: formData.get("phoneNumber"),
      type: formData.get("type"),
    });
    const device = await deviceService.createDevice(clientId, input, actor);
    deviceId = device.id;
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/devices");
  redirect(`/admin/devices/${deviceId}`);
}

export async function updateDeviceAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const id = formData.get("id") as string;
  try {
    const actor = await requireAdmin();
    const input = updateDeviceSchema.parse({
      gatewayId: formData.get("gatewayId") || undefined,
      name: formData.get("name") || undefined,
      phoneNumber: formData.get("phoneNumber") || undefined,
      type: formData.get("type") || undefined,
      active: formData.get("active") === "on",
    });
    await deviceService.updateDevice(id, input, actor);
  } catch (error) {
    return { error: messageFor(error) };
  }

  revalidatePath(`/admin/devices/${id}`);
  revalidatePath("/admin/devices");
  return undefined;
}
