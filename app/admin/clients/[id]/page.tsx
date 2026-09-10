import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientEditForm } from "@/components/admin/client-edit-form";
import { ClientUserForm } from "@/components/admin/client-user-form";
import { DeviceForm } from "@/components/admin/device-form";
import { GatewayForm } from "@/components/admin/gateway-form";
import { GatewayStatusBadge } from "@/components/status/gateway-status-badge";
import { toggleClientUserActiveAction } from "@/app/admin/clients/actions";
import * as clientService from "@/server/services/client-service";
import * as deviceService from "@/server/services/device-service";
import * as gatewayService from "@/server/services/gateway-service";
import * as userService from "@/server/services/user-service";
import { ApiError } from "@/lib/api/errors";
import { DEVICE_TYPE_LABELS } from "@/lib/devices/labels";
import { computeGatewayStatus } from "@/lib/gateways/status";

type PageProps = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;

  let client;
  try {
    client = await clientService.getClientOrThrow(id);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const users = await userService.listClientUsers(id);
  const gateways = await gatewayService.listClientGateways(id);
  const devices = await deviceService.listClientDevices(id);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-6 text-lg font-semibold">{client.name}</h1>
        <ClientEditForm client={client} />
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold">Usuários</h2>
        {users.length === 0 ? (
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Nenhum usuário cadastrado.</p>
        ) : (
          <table className="mb-6 w-full max-w-md text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
                <th className="py-2 font-medium">Nome</th>
                <th className="py-2 font-medium">Email</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2">{user.name}</td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                  <td className="py-2">
                    {user.active ? (
                      <span className="text-green-700 dark:text-green-500">Ativo</span>
                    ) : (
                      <span className="text-red-700 dark:text-red-500">Inativo</span>
                    )}
                  </td>
                  <td className="py-2">
                    <form action={toggleClientUserActiveAction}>
                      <input type="hidden" name="clientId" value={id} />
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="nextActive" value={(!user.active).toString()} />
                      <button type="submit" className="text-sm underline">
                        {user.active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <ClientUserForm clientId={id} />
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold">Gateways</h2>
        {gateways.length === 0 ? (
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Nenhum gateway cadastrado.</p>
        ) : (
          <table className="mb-6 w-full max-w-md text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
                <th className="py-2 font-medium">Nome</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {gateways.map((gateway) => (
                <tr key={gateway.id} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2">
                    <Link href={`/admin/gateways/${gateway.id}`} className="font-medium hover:underline">
                      {gateway.name}
                    </Link>
                  </td>
                  <td className="py-2">
                    <GatewayStatusBadge status={computeGatewayStatus(gateway.status, gateway.lastSeenAt)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <GatewayForm clientId={id} />
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold">Dispositivos</h2>
        {devices.length === 0 ? (
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Nenhum dispositivo cadastrado.</p>
        ) : (
          <table className="mb-6 w-full max-w-md text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
                <th className="py-2 font-medium">Nome</th>
                <th className="py-2 font-medium">Tipo</th>
                <th className="py-2 font-medium">Gateway</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-b border-black/5 dark:border-white/10">
                  <td className="py-2">
                    <Link href={`/admin/devices/${device.id}`} className="font-medium hover:underline">
                      {device.name}
                    </Link>
                  </td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">
                    {DEVICE_TYPE_LABELS[device.type]}
                  </td>
                  <td className="py-2 text-zinc-600 dark:text-zinc-400">{device.gateway.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <DeviceForm clientId={id} gateways={gateways} />
      </div>
    </div>
  );
}
