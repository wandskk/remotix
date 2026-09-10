"use client";

import { useActionState } from "react";

import { regenerateInviteAction, type FormState } from "@/app/admin/clients/actions";
import { InviteLinkDisplay } from "@/components/admin/invite-link-display";

export function ResendInviteButton({ clientId, userId }: { clientId: string; userId: string }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    regenerateInviteAction,
    undefined,
  );

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <input type="hidden" name="clientId" value={clientId} />
        <input type="hidden" name="userId" value={userId} />
        <button type="submit" disabled={isPending} className="text-xs underline disabled:opacity-60">
          {isPending ? "Gerando..." : "Gerar link de acesso"}
        </button>
      </form>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.inviteUrl && <InviteLinkDisplay path={state.inviteUrl} />}
    </div>
  );
}
