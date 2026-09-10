"use client";

import { useActionState } from "react";

import { createDeviceAction, type FormState } from "@/app/admin/devices/actions";
import { DEVICE_TYPES, DEVICE_TYPE_LABELS } from "@/lib/devices/labels";

type Gateway = { id: string; name: string };

export function DeviceForm({ clientId, gateways }: { clientId: string; gateways: Gateway[] }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(createDeviceAction, undefined);

  if (gateways.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Cadastre um gateway para este cliente antes de adicionar dispositivos.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="flex flex-col gap-1">
        <label htmlFor="device-name" className="text-sm font-medium">
          Nome
        </label>
        <input
          id="device-name"
          name="name"
          required
          placeholder="Portão principal"
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="device-phone" className="text-sm font-medium">
          Telefone do equipamento
        </label>
        <input
          id="device-phone"
          name="phoneNumber"
          required
          className="rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="device-type" className="text-sm font-medium">
          Tipo
        </label>
        <select
          id="device-type"
          name="type"
          required
          defaultValue=""
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        >
          <option value="" disabled>
            Selecione
          </option>
          {DEVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {DEVICE_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="device-gateway" className="text-sm font-medium">
          Gateway
        </label>
        <select
          id="device-gateway"
          name="gatewayId"
          required
          defaultValue=""
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        >
          <option value="" disabled>
            Selecione
          </option>
          {gateways.map((gateway) => (
            <option key={gateway.id} value={gateway.id}>
              {gateway.name}
            </option>
          ))}
        </select>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isPending ? "Salvando..." : "Criar dispositivo"}
      </button>
    </form>
  );
}
