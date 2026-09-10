import Link from "next/link";

import { GatewayStatusBadge } from "@/components/status/gateway-status-badge";
import { computeGatewayStatus } from "@/lib/gateways/status";
import * as gatewayService from "@/server/services/gateway-service";

export default async function AdminGatewaysPage() {
  const gateways = await gatewayService.listGateways();

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Gateways</h1>

      {gateways.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Nenhum gateway cadastrado. Crie um a partir da página de um cliente.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
              <th className="py-2 font-medium">Nome</th>
              <th className="py-2 font-medium">Cliente</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Último sinal</th>
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
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{gateway.client.name}</td>
                <td className="py-2">
                  <GatewayStatusBadge status={computeGatewayStatus(gateway.status, gateway.lastSeenAt)} />
                </td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">
                  {gateway.lastSeenAt ? gateway.lastSeenAt.toLocaleString("pt-BR") : "Nunca"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
