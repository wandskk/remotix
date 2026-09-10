import { auth } from "@/lib/auth/auth";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Painel administrativo</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Olá, {session?.user?.name} ({session?.user?.role})
      </p>
    </div>
  );
}
