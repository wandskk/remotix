import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-black/10 p-6 dark:border-white/20">
        <h1 className="mb-6 text-lg font-semibold">Remotix</h1>
        <LoginForm />
      </div>
    </main>
  );
}
