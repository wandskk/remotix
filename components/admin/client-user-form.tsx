"use client";

import { useActionState } from "react";

import { createClientUserAction, type FormState } from "@/app/admin/clients/actions";

export function ClientUserForm({ clientId }: { clientId: string }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createClientUserAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="user-name" className="text-sm font-medium">
          Nome
        </label>
        <input
          id="user-name"
          name="name"
          required
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="user-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="user-email"
          name="email"
          type="email"
          required
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="user-password" className="text-sm font-medium">
          Senha provisória
        </label>
        <input
          id="user-password"
          name="password"
          type="password"
          required
          minLength={8}
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isPending ? "Salvando..." : "Adicionar usuário"}
      </button>
    </form>
  );
}
