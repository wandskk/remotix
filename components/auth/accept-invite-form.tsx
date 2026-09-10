"use client";

import { useActionState } from "react";

import { acceptInviteAction, type AcceptInviteState } from "@/app/(auth)/convite/actions";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState<AcceptInviteState, FormData>(
    acceptInviteAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirme a senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isPending ? "Salvando..." : "Definir senha e entrar"}
      </button>
    </form>
  );
}
