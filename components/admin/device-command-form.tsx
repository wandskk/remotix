"use client";

import { useActionState } from "react";

import { createDeviceCommandAction } from "@/app/admin/devices/actions";
import type { FormState } from "@/app/admin/devices/actions";

export function DeviceCommandForm({ deviceId }: { deviceId: string }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    createDeviceCommandAction,
    undefined,
  );

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="deviceId" value={deviceId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="dc-label" className="text-sm font-medium">
          Label (o que o cliente vê)
        </label>
        <input
          id="dc-label"
          name="label"
          required
          placeholder="Abrir portão"
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="dc-sms" className="text-sm font-medium">
          Texto do SMS (exato, sem o nonce)
        </label>
        <input
          id="dc-sms"
          name="sms"
          required
          placeholder="PORTAO_ABRIR"
          className="rounded-md border border-black/10 px-3 py-2 text-sm font-mono outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isPending ? "Salvando..." : "Adicionar comando"}
      </button>
    </form>
  );
}
