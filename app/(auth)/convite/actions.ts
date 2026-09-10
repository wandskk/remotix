"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";

import { signIn } from "@/lib/auth/auth";
import { ApiError } from "@/lib/api/errors";
import { acceptInviteSchema } from "@/lib/validation/user";
import * as inviteService from "@/server/services/invite-service";

export type AcceptInviteState = { error?: string } | undefined;

export async function acceptInviteAction(
  _prevState: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const token = formData.get("token") as string;

  const parsed = acceptInviteSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  let email: string;
  try {
    const user = await inviteService.acceptInvite(token, parsed.data.password);
    email = user.email;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    if (error instanceof ZodError) return { error: "Dados inválidos." };
    console.error(error);
    return { error: "Erro inesperado." };
  }

  try {
    await signIn("credentials", { email, password: parsed.data.password, redirect: false });
  } catch {
    redirect("/login");
  }

  redirect("/");
}
