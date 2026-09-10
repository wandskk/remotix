import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { ApiError } from "@/lib/api/errors";
import * as inviteService from "@/server/services/invite-service";

type PageProps = { params: Promise<{ token: string }> };

export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = await params;

  let isValid = true;
  try {
    await inviteService.validateInviteToken(token);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") {
      isValid = false;
    } else {
      throw error;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-black/10 p-6 dark:border-white/20">
        <h1 className="mb-6 text-lg font-semibold">Remotix</h1>
        {isValid ? (
          <>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Defina sua senha para acessar o painel.
            </p>
            <AcceptInviteForm token={token} />
          </>
        ) : (
          <p className="text-sm text-red-600">
            Este link de convite é inválido ou já expirou. Peça ao administrador para gerar um
            novo.
          </p>
        )}
      </div>
    </main>
  );
}
