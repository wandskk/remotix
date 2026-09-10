import Link from "next/link";

import * as clientService from "@/server/services/client-service";

export default async function AdminClientsPage() {
  const clients = await clientService.listClients();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Clientes</h1>
        <Link
          href="/admin/clients/new"
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Novo cliente
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Nenhum cliente cadastrado.</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-zinc-600 dark:border-white/20 dark:text-zinc-400">
              <th className="py-2 font-medium">Nome</th>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-black/5 dark:border-white/10">
                <td className="py-2">
                  <Link href={`/admin/clients/${client.id}`} className="font-medium hover:underline">
                    {client.name}
                  </Link>
                </td>
                <td className="py-2 text-zinc-600 dark:text-zinc-400">{client.email ?? "—"}</td>
                <td className="py-2">
                  {client.active ? (
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
