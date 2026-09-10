"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/server/permissions/session";
import * as commandService from "@/server/services/command-service";

export async function triggerCommandAction(formData: FormData) {
  const deviceId = formData.get("deviceId") as string;
  const action = formData.get("action") as string;

  const actor = await requireSession();
  await commandService.createCommand({ deviceId, action }, actor);

  revalidatePath("/client/dashboard");
}
