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
· Zod · Android/Kotlin ([android/](android/))

Hospedagem: Vercel Free + Neon Free. Sem WebSocket persistente — o gateway
Android usa polling controlado. Ver [docs/architecture.md](docs/architecture.md).

## Documentação

- [docs/product-overview.md](docs/product-overview.md) — como o sistema funciona na visão de negócio
- [docs/architecture.md](docs/architecture.md) — visão geral, fluxo, fases
- [docs/database.md](docs/database.md) — entidades e Prisma
- [docs/api.md](docs/api.md) — API administrativa
- [docs/gateway-protocol.md](docs/gateway-protocol.md) — protocolo Android ↔ API
- [docs/sms-protocol.md](docs/sms-protocol.md) — catálogo de comandos e correlação SMS
- [docs/security.md](docs/security.md) — autenticação, rate limit, retry, expiração
- [docs/deployment.md](docs/deployment.md) — Vercel + Neon
- [docs/testing.md](docs/testing.md) — cobertura e checklist do MVP
- [docs/decisions/](docs/decisions/) — ADRs
- [android/README.md](android/README.md) — app Android (gateway de SMS)

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

Em produção: [remotix.vercel.app](https://remotix.vercel.app).

Fases concluídas: 1 (Fundação), 2 (Autenticação), 3 (Clientes), 4 (Gateways),
5 (Dispositivos), 6 (Commands), 7 (app Android, ver [android/](android/)),
8 (SMS inbound), 9 (Dashboard do cliente), 10 (Rate limiting), 11 (Testes
do backend), 12 (Deploy). Falta o teste real de ponta a ponta com chip
físico (o app Android ainda não rodou contra um aparelho — sem
Android Studio/JDK/SDK disponíveis no ambiente em que ele foi gerado) e
testes instrumentados do app. Ver a ordem completa das fases em
[docs/architecture.md](docs/architecture.md#ordem-de-implementação-fases).
