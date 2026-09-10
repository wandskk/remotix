import type { GatewayStatus } from "@/generated/prisma/enums";

const LABELS: Record<GatewayStatus, { text: string; className: string }> = {
  ONLINE: { text: "🟢 Online", className: "text-green-700 dark:text-green-500" },
  INACTIVE: { text: "🟡 Inativo recente", className: "text-yellow-700 dark:text-yellow-500" },
  OFFLINE: { text: "⚫ Offline", className: "text-zinc-600 dark:text-zinc-400" },
  DISABLED: { text: "🔴 Desativado", className: "text-red-700 dark:text-red-500" },
};

export function GatewayStatusBadge({ status }: { status: GatewayStatus }) {
  const { text, className } = LABELS[status];
  return <span className={className}>{text}</span>;
}
