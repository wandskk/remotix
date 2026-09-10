import Link from "next/link";

import { CommandStatusBadge } from "@/components/admin/command-status-badge";
import { requireSession } from "@/server/permissions/session";
import * as commandService from "@/server/services/command-service";

export default async function AdminCommandsPage() {
  const actor = await requireSession();
  const commands = await commandService.listCommandsForActor(actor);

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Comandos</h1>

      {commands.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum comando criado ainda.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
              <th className="py-2 font-medium">Dispositivo</th>
              <th className="py-2 font-medium">Ação</th>
              <th className="py-2 font-medium">Cliente</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Tentativas</th>
              <th className="py-2 font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {commands.map((command) => (
              <tr key={command.id} className="border-b border-black/5 dark:border-white/10">
                <td className="py-2">
                  <Link href={`/admin/devices/${command.device.id}`} className="font-medium hover:underline">
                    {command.device.name}
                  </Link>
                </td>
                <td className="py-2 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                  {command.action}
                </td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{command.client.name}</td>
                <td className="py-2">
                  <CommandStatusBadge status={command.status} />
                </td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{command.attempts}</td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">
                  {command.createdAt.toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
