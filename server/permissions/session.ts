import { auth } from "@/lib/auth/auth";
import { forbidden, unauthorized } from "@/lib/api/errors";

export type AuthenticatedSessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "CLIENT";
  clientId: string | null;
};

// Nunca confiar em client_id vindo do frontend — sempre derivar da sessão
// autenticada (docs/security.md).
export async function requireSession(): Promise<AuthenticatedSessionUser> {
  const session = await auth();
  if (!session?.user) throw unauthorized();
  return session.user as AuthenticatedSessionUser;
}

export async function requireAdmin(): Promise<AuthenticatedSessionUser> {
  const user = await requireSession();
  if (user.role !== "ADMIN") throw forbidden("Somente administradores podem executar esta ação.");
  return user;
}
