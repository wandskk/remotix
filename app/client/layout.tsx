import { auth } from "@/lib/auth/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/20">
        <span className="font-semibold">Remotix</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">{session?.user?.name}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
