import Link from "next/link";
import { notFound } from "next/navigation";

import { cancelCommandAction, createCommandAction } from "@/app/admin/commands/actions";
import { CommandStatusBadge } from "@/components/status/command-status-badge";
import { DeviceEditForm } from "@/components/admin/device-edit-form";
import { ApiError } from "@/lib/api/errors";
import { getCommandCatalogForDevice } from "@/lib/commands/catalog";
import { DEVICE_TYPE_LABELS } from "@/lib/devices/labels";
import * as commandService from "@/server/services/command-service";
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
  const commands = await commandService.listDeviceCommands(device.id);

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
          <div className="flex flex-wrap gap-2">
            {catalog.map((entry) => (
              <form key={entry.action} action={createCommandAction}>
                <input type="hidden" name="deviceId" value={device.id} />
                <input type="hidden" name="action" value={entry.action} />
                <button
                  type="submit"
                  className="rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20"
                >
                  {entry.label}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold">Histórico de comandos</h2>
        {commands.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum comando executado ainda.</p>
        ) : (
          <table className="w-full max-w-2xl text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
                <th className="py-2 font-medium">Ação</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Tentativas</th>
                <th className="py-2 font-medium">Criado em</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {commands.map((command) => (
                <tr key={command.id} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2 font-mono text-xs">{command.action}</td>
                  <td className="py-2">
                    <CommandStatusBadge status={command.status} />
                  </td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">{command.attempts}</td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">
                    {command.createdAt.toLocaleString("pt-BR")}
                  </td>
                  <td className="py-2">
                    {(command.status === "PENDING" || command.status === "CLAIMED") && (
                      <form action={cancelCommandAction}>
                        <input type="hidden" name="id" value={command.id} />
                        <input type="hidden" name="deviceId" value={device.id} />
                        <button type="submit" className="text-sm underline">
                          Cancelar
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
