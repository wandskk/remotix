# Deployment

## Infraestrutura do MVP

```
GitHub → Vercel → Next.js
                → Neon (Postgres)
```

Branches: `main` (produção) — este projeto trabalha direto na `main`, cada
fase é commitada e enviada ao `origin/main` depois de testada (lint + build).

## Produção

`https://remotix.vercel.app` — projeto `remotix` no time `wandskks-projects`
na Vercel, ligado ao `github.com/wandskk/remotix` (branch `main`, deploy
automático a cada push).

Aponta para o **mesmo banco Neon usado em desenvolvimento** — decisão
deliberada para simplificar o MVP; os dados de teste criados durante o
desenvolvimento também aparecem em produção. Separar um banco de produção é
uma melhoria futura, não uma necessidade imediata.

## Variáveis de ambiente

Ver [`.env.example`](../.env.example). Nunca versionar `.env`/`.env.local`.

No Vercel, o projeto tem uma integração Neon nativa que importa
automaticamente as variáveis com os nomes do Neon (`POSTGRES_URL`, `PGHOST`,
etc.) — **nenhuma delas tem o nome que o código espera.** É preciso
adicionar manualmente, em Project → Settings → Environment Variables:

- `DATABASE_URL` — igual ao `.env` local (conexão pooled)
- `DIRECT_URL` — igual ao `.env` local (conexão direta, sem pgbouncer —
  necessária em build time porque `prisma7.config.ts` a lê via `env()`)
- `AUTH_SECRET` — igual ao `.env` local

Sem essas três, o build falha em `postinstall` (`prisma generate`) com
`PrismaConfigEnvError: Cannot resolve environment variable: DIRECT_URL`.

## Limitações do plano gratuito

Considerar sempre: limites de execução serverless, limites de banco/requests/
build/bandwidth do Neon e Vercel Free, cold starts, ausência de processo
persistente. Não implementar nada que dependa de um processo sempre ativo na
Vercel — daí a decisão de polling (ver
[decisions/002-polling.md](decisions/002-polling.md)).

## Quando escalar

Só avaliar Vercel Pro, Neon pago, Redis, realtime externo, VPS ou fila
dedicada quando houver evidência real de necessidade — não antecipar custo.
