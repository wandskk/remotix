"use client";

import { useActionState } from "react";

import { createGatewayAction, type FormState } from "@/app/admin/gateways/actions";

export function GatewayForm({ clientId }: { clientId: string }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createGatewayAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="gateway-name" className="text-sm font-medium">
          Nome
        </label>
        <input
          id="gateway-name"
          name="name"
          required
          placeholder="Gateway #001"
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="gateway-sim" className="text-sm font-medium">
          Telefone do chip (SIM)
        </label>
        <input
          id="gateway-sim"
          name="simPhone"
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isPending ? "Salvando..." : "Criar gateway"}
      </button>
    </form>
  );
}
