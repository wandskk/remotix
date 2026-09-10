"use client";

import { useState } from "react";

export function InviteLinkDisplay({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — o link ainda está visível para cópia manual
    }
  }

  return (
    <div className="rounded-md border border-black/10 p-3 text-sm dark:border-white/20">
      <p className="mb-2 text-zinc-600 dark:text-zinc-400">
        Envie este link ao cliente — ele define a própria senha ao abri-lo. Válido por 7 dias.
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all rounded bg-black/[.04] px-2 py-1 text-xs dark:bg-white/[.08]">
          {url}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/20"
        >
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
