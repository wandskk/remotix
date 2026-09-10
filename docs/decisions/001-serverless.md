# ADR 001 — Serverless (Next.js + Vercel)

**Decisão**: Next.js hospedado na Vercel, sem servidor Node persistente.

**Motivo**: baixo custo inicial, deploy simples, integração com Git,
adequado ao escopo do MVP.

**Consequência**: não depender de processos persistentes nem de WebSocket
próprio; usar polling controlado (ver [002-polling.md](002-polling.md)); usar
PostgreSQL como fila inicial em vez de Redis/RabbitMQ.
