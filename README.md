# Remotix

Plataforma de SMS Gateway: um painel web cria comandos (ex. "abrir portão")
que um app Android — funcionando como gateway SMS com um chip físico —
consome por polling, envia como SMS para o equipamento remoto, e relata de
volta a confirmação quando o equipamento responde.

```
Painel Web → API (Next.js) → Fila de comandos (Postgres) → Android Gateway
  → SMS → Equipamento → SMS de resposta → Android Gateway → API → Confirmado
```

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL (Neon)
· Zod · Android/Kotlin (fase posterior)

Hospedagem: Vercel Free + Neon Free. Sem WebSocket persistente — o gateway
Android usa polling controlado. Ver [docs/architecture.md](docs/architecture.md).

## Documentação

- [docs/architecture.md](docs/architecture.md) — visão geral, fluxo, fases
- [docs/database.md](docs/database.md) — entidades e Prisma
- [docs/api.md](docs/api.md) — API administrativa
- [docs/gateway-protocol.md](docs/gateway-protocol.md) — protocolo Android ↔ API
- [docs/sms-protocol.md](docs/sms-protocol.md) — catálogo de comandos e correlação SMS
- [docs/security.md](docs/security.md) — autenticação, rate limit, retry, expiração
- [docs/deployment.md](docs/deployment.md) — Vercel + Neon
- [docs/testing.md](docs/testing.md) — cobertura e checklist do MVP
- [docs/decisions/](docs/decisions/) — ADRs

## Desenvolvimento

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Variáveis de ambiente: copiar `.env.example` para `.env` e preencher (ver
[docs/deployment.md](docs/deployment.md)).

## Estado atual

Fase 1 — Fundação em andamento. Ver a ordem completa das fases em
[docs/architecture.md](docs/architecture.md#ordem-de-implementação-fases).
