import { isInviteTokenExpired } from "@/lib/invites/tokens";

type InviteToken = { usedAt: Date | null; expiresAt: Date } | null | undefined;

function statusFor(invite: InviteToken): "none" | "accepted" | "expired" | "pending" {
  if (!invite) return "none";
  if (invite.usedAt) return "accepted";
  if (isInviteTokenExpired(invite.expiresAt)) return "expired";
  return "pending";
}

export function InviteStatusBadge({ invite }: { invite: InviteToken }) {
  const status = statusFor(invite);

  if (status === "none") return <span className="text-zinc-600 dark:text-zinc-400">Sem convite</span>;
  if (status === "accepted") {
    return <span className="text-green-700 dark:text-green-500">Acesso configurado</span>;
  }
  if (status === "expired") return <span className="text-red-700 dark:text-red-500">Convite expirado</span>;
  return <span className="text-yellow-700 dark:text-yellow-500">Convite pendente</span>;
}
