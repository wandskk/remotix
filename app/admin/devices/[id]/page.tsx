import Link from "next/link";
import { notFound } from "next/navigation";

import { DeviceEditForm } from "@/components/admin/device-edit-form";
import { ApiError } from "@/lib/api/errors";
import { getCommandCatalogForDevice } from "@/lib/commands/catalog";
import { DEVICE_TYPE_LABELS } from "@/lib/devices/labels";
import * as deviceService from "@/server/services/device-service";
import * as gatewayService from "@/server/services/gateway-service";

type PageProps = { params: Promise<{ id: string }> };

export default async function DeviceDetailPage({ params }: PageProps) {
  const { id } = await params;

  let device;
  try {
    device = await deviceService.getDeviceOrThrow(id);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const gateways = await gatewayService.listClientGateways(device.clientId);
  const catalog = getCommandCatalogForDevice(device.type);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href={`/admin/clients/${device.client.id}`} className="hover:underline">
            {device.client.name}
          </Link>
        </p>
        <h1 className="mb-6 text-lg font-semibold">{device.name}</h1>
        <DeviceEditForm device={device} gateways={gateways} />
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold">
          Comandos disponíveis ({DEVICE_TYPE_LABELS[device.type]})
        </h2>
        {catalog.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum comando pré-definido para este tipo de dispositivo.
          </p>
        ) : (
          <ul className="flex max-w-md flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            {catalog.map((entry) => (
              <li key={entry.action}>
                {entry.label} <span className="font-mono">({entry.sms})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
