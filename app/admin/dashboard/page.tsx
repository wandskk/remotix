import { auth } from "@/lib/auth/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <main className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Painel administrativo</h1>
        <LogoutButton />
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Olá, {session?.user?.name} ({session?.user?.role})
      </p>
    </main>
  );
}
