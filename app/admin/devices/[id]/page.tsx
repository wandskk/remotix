import Link from "next/link";
import { notFound } from "next/navigation";

import { cancelCommandAction, createCommandAction } from "@/app/admin/commands/actions";
import { toggleDeviceCommandActiveAction } from "@/app/admin/devices/actions";
import { CommandStatusBadge } from "@/components/status/command-status-badge";
import { DeviceCommandForm } from "@/components/admin/device-command-form";
import { DeviceEditForm } from "@/components/admin/device-edit-form";
import { ApiError } from "@/lib/api/errors";
import { DEVICE_TYPE_LABELS } from "@/lib/devices/labels";
import * as commandService from "@/server/services/command-service";
import * as deviceCommandService from "@/server/services/device-command-service";
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
  const deviceCommands = await deviceCommandService.listDeviceCommands(device.id);
  const commands = await commandService.listCommandsForDevice(device.id);

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
        <h2 className="mb-1 text-base font-semibold">Comandos deste dispositivo</h2>
        <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
          {DEVICE_TYPE_LABELS[device.type]} — cada comando tem um texto de SMS exato que o
          hardware deste cliente espera receber.
        </p>

        {deviceCommands.length === 0 ? (
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Nenhum comando cadastrado ainda.
          </p>
        ) : (
          <table className="mb-6 w-full max-w-xl text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
                <th className="py-2 font-medium">Label</th>
                <th className="py-2 font-medium">SMS</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2" />
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {deviceCommands.map((dc) => (
                <tr key={dc.id} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2">{dc.label}</td>
                  <td className="py-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">{dc.sms}</td>
                  <td className="py-2">
                    {dc.active ? (
                      <span className="text-green-700 dark:text-green-500">Ativo</span>
                    ) : (
                      <span className="text-red-700 dark:text-red-500">Inativo</span>
                    )}
                  </td>
                  <td className="py-2">
                    {dc.active && (
                      <form action={createCommandAction}>
                        <input type="hidden" name="deviceId" value={device.id} />
                        <input type="hidden" name="deviceCommandId" value={dc.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-black/10 px-2.5 py-1 text-xs dark:border-white/20"
                        >
                          Disparar
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="py-2">
                    <form action={toggleDeviceCommandActiveAction}>
                      <input type="hidden" name="deviceId" value={device.id} />
                      <input type="hidden" name="deviceCommandId" value={dc.id} />
                      <input type="hidden" name="nextActive" value={(!dc.active).toString()} />
                      <button type="submit" className="text-xs underline">
                        {dc.active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <DeviceCommandForm deviceId={device.id} />
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
