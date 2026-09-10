"use client";

import { useActionState } from "react";

import { updateDeviceAction, type FormState } from "@/app/admin/devices/actions";
import type { DeviceType } from "@/generated/prisma/enums";
import { DEVICE_TYPES, DEVICE_TYPE_LABELS } from "@/lib/devices/labels";

type Gateway = { id: string; name: string };

type Device = {
  id: string;
  name: string;
  phoneNumber: string;
  type: DeviceType;
  active: boolean;
  gateway: { id: string };
};

export function DeviceEditForm({ device, gateways }: { device: Device; gateways: Gateway[] }) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(updateDeviceAction, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <input type="hidden" name="id" value={device.id} />

      <div className="flex flex-col gap-1">
        <label htmlFor="device-name" className="text-sm font-medium">
          Nome
        </label>
        <input
          id="device-name"
          name="name"
          defaultValue={device.name}
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
          defaultValue={device.phoneNumber}
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
          defaultValue={device.type}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        >
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
          defaultValue={device.gateway.id}
          className="rounded-md border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/20 dark:focus:border-white/40"
        >
          {gateways.map((gateway) => (
            <option key={gateway.id} value={gateway.id}>
              {gateway.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={device.active} />
        Ativo
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-fit rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        {isPending ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
