import { auth } from "@/lib/auth/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function ClientDashboardPage() {
  const session = await auth();

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Meu painel</h1>
        <LogoutButton />
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Olá, {session?.user?.name}
      </p>
    </main>
  );
}
