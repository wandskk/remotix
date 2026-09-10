import Link from "next/link";

import { DEVICE_TYPE_LABELS } from "@/lib/devices/labels";
import * as deviceService from "@/server/services/device-service";

export default async function AdminDevicesPage() {
  const devices = await deviceService.listDevices();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Dispositivos</h1>

      {devices.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Nenhum dispositivo cadastrado. Crie um a partir da página de um cliente.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
              <th className="py-2 font-medium">Nome</th>
              <th className="py-2 font-medium">Tipo</th>
              <th className="py-2 font-medium">Cliente</th>
              <th className="py-2 font-medium">Gateway</th>
              <th className="py-2 font-medium">Status</th>
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
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{device.client.name}</td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{device.gateway.name}</td>
                <td className="py-2">
                  {device.active ? (
                    <span className="text-green-700 dark:text-green-500">Ativo</span>
                  ) : (
                    <span className="text-red-700 dark:text-red-500">Inativo</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
