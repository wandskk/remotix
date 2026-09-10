# Deployment

## Infraestrutura do MVP

```
GitHub → Vercel → Next.js
                → Neon (Postgres)
```

Branches: `main` (produção) — este projeto trabalha direto na `main`, cada
fase é commitada e enviada ao `origin/main` depois de testada (lint + build).

## Variáveis de ambiente

Ver [`.env.example`](../.env.example). Nunca versionar `.env`/`.env.local`.
No Vercel, configurar as mesmas chaves no dashboard do projeto.

## Limitações do plano gratuito

Considerar sempre: limites de execução serverless, limites de banco/requests/
build/bandwidth do Neon e Vercel Free, cold starts, ausência de processo
persistente. Não implementar nada que dependa de um processo sempre ativo na
Vercel — daí a decisão de polling (ver
[decisions/002-polling.md](decisions/002-polling.md)).

## Quando escalar

Só avaliar Vercel Pro, Neon pago, Redis, realtime externo, VPS ou fila
dedicada quando houver evidência real de necessidade — não antecipar custo.
