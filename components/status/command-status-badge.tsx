import type { CommandStatus } from "@/generated/prisma/enums";

const LABELS: Record<CommandStatus, { text: string; className: string }> = {
  PENDING: { text: "🔵 Pendente", className: "text-blue-700 dark:text-blue-400" },
  CLAIMED: { text: "🟡 Recebido pelo gateway", className: "text-yellow-700 dark:text-yellow-500" },
  SENDING: { text: "🟡 Enviando", className: "text-yellow-700 dark:text-yellow-500" },
  SENT: { text: "🔵 SMS enviado", className: "text-blue-700 dark:text-blue-400" },
  CONFIRMED: { text: "🟢 Confirmado", className: "text-green-700 dark:text-green-500" },
  FAILED: { text: "🔴 Falhou", className: "text-red-700 dark:text-red-500" },
  EXPIRED: { text: "⚫ Expirado", className: "text-zinc-600 dark:text-zinc-400" },
  CANCELLED: { text: "⚫ Cancelado", className: "text-zinc-600 dark:text-zinc-400" },
};

export function CommandStatusBadge({ status }: { status: CommandStatus }) {
  const { text, className } = LABELS[status];
  return <span className={className}>{text}</span>;
}
