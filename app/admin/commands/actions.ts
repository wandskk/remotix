"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/permissions/session";
import * as commandService from "@/server/services/command-service";

export async function createCommandAction(formData: FormData) {
  const deviceId = formData.get("deviceId") as string;
  const deviceCommandId = formData.get("deviceCommandId") as string;

  const actor = await requireSession();
  await commandService.createCommand({ deviceId, deviceCommandId }, actor);

  revalidatePath(`/admin/devices/${deviceId}`);
  revalidatePath("/admin/commands");
}

export async function cancelCommandAction(formData: FormData) {
  const id = formData.get("id") as string;
  const deviceId = formData.get("deviceId") as string;

  const actor = await requireSession();
  await commandService.cancelCommand(id, actor);

  revalidatePath(`/admin/devices/${deviceId}`);
  revalidatePath("/admin/commands");
}
