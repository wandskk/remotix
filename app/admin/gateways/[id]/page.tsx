import Link from "next/link";
import { notFound } from "next/navigation";

import {
  regenerateActivationCodeAction,
  toggleGatewayEnabledAction,
} from "@/app/admin/gateways/actions";
import { GatewayEditForm } from "@/components/admin/gateway-edit-form";
import { GatewayStatusBadge } from "@/components/admin/gateway-status-badge";
import { ApiError } from "@/lib/api/errors";
import { isActivationCodeExpired } from "@/lib/gateways/credentials";
import { computeGatewayStatus } from "@/lib/gateways/status";
import * as gatewayService from "@/server/services/gateway-service";

type PageProps = { params: Promise<{ id: string }> };

export default async function GatewayDetailPage({ params }: PageProps) {
  const { id } = await params;

  let gateway;
  try {
    gateway = await gatewayService.getGatewayOrThrow(id);
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  const status = computeGatewayStatus(gateway.status, gateway.lastSeenAt);
  const isActivated = Boolean(gateway.deviceUid);
  const isDisabled = gateway.status === "DISABLED";
  const codeExpired = isActivationCodeExpired(gateway.activationCodeExpiresAt);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
          <Link href={`/admin/clients/${gateway.client.id}`} className="hover:underline">
            {gateway.client.name}
          </Link>
        </p>
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-lg font-semibold">{gateway.name}</h1>
          <GatewayStatusBadge status={status} />
        </div>
        <GatewayEditForm gateway={gateway} />
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold">Ativação</h2>
        {isActivated ? (
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <p>Aparelho vinculado: {gateway.deviceUid}</p>
            <p>Versão do app: {gateway.appVersion ?? "—"}</p>
          </div>
        ) : gateway.activationCode && !codeExpired ? (
          <div className="text-sm">
            <p className="text-zinc-600 dark:text-zinc-400">
              Informe este código no aplicativo Android para vincular o aparelho:
            </p>
            <p className="my-2 font-mono text-2xl tracking-widest">{gateway.activationCode}</p>
            <p className="text-zinc-600 dark:text-zinc-400">
              Válido até {gateway.activationCodeExpiresAt?.toLocaleString("pt-BR")}.
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Não há código de ativação válido.
          </p>
        )}

        <form action={regenerateActivationCodeAction} className="mt-4">
          <input type="hidden" name="id" value={gateway.id} />
          <button type="submit" className="text-sm underline">
            {isActivated ? "Gerar novo código (desvincula o aparelho atual)" : "Gerar novo código"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold">Status administrativo</h2>
        <form action={toggleGatewayEnabledAction}>
          <input type="hidden" name="id" value={gateway.id} />
          <input type="hidden" name="nextEnabled" value={isDisabled.toString()} />
          <button
            type="submit"
            className="rounded-md border border-black/10 px-3 py-1.5 text-sm dark:border-white/20"
          >
            {isDisabled ? "Reativar gateway" : "Desativar gateway"}
          </button>
        </form>
      </div>
    </div>
  );
}
