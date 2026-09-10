# Arquitetura — Remotix SMS Gateway

## Objetivo

Transformar uma ação clicada em um painel web em um comando SMS enviado por um
celular Android físico (com chip) para um equipamento remoto (portão, luz,
bomba etc.), e relatar de volta a confirmação do equipamento quando ele
responder por SMS.

```
Painel Web → API Next.js → Fila de comandos (Postgres) → Android Gateway → SMS
  → Equipamento → SMS de resposta → Android Gateway → API → Command CONFIRMED
```

## Restrição de infraestrutura

MVP roda em **Vercel Free + Neon Free**. Não assumir infraestrutura dedicada.

Não implementar no MVP: servidor Node persistente, WebSocket próprio hospedado
na Vercel, Redis obrigatório, RabbitMQ, Kubernetes, Docker obrigatório, VPS,
serviço externo de filas.

## Decisão: sem WebSocket persistente

A Vercel é serverless — funções não ficam vivas entre requests. Por isso o
Android Gateway usa **polling controlado** (intervalo configurável, padrão
5s) contra `POST /api/gateway/commands/claim`, em vez de manter conexão
aberta. Ver [decisions/002-polling.md](decisions/002-polling.md).

## Stack

- **Web**: Next.js (App Router), TypeScript estrito, React, Tailwind CSS
- **Backend**: dentro do próprio Next.js — Route Handlers, Server Components,
  Server Actions quando fizer sentido. Sem Express separado.
- **Banco**: PostgreSQL (Neon) via Prisma ORM
- **Validação**: Zod, sempre no backend
- **Android**: Kotlin, Android SDK, `SmsManager`, `BroadcastReceiver`,
  Foreground Service

## Princípios

- TypeScript strict
- Separação entre UI e regras de negócio (`app/` fino, `server/` com a lógica)
- Toda entrada externa validada com Zod no backend
- Acesso ao banco via repositories/services (`server/repositories`,
  `server/services`) — nunca Prisma direto de dentro de um componente
- Nenhuma regra crítica só no frontend (ex.: nunca confiar em `client_id` do
  frontend — sempre derivar da sessão autenticada)
- Idempotência de comandos: retries de HTTP não podem gerar SMS duplicado
- Autenticação própria para gateways (nunca só `gateway_id`)
- Logs de operações críticas + auditoria
- Evitar overengineering — não adicionar dependência sem necessidade real

## Estrutura de pastas

```
remotix/
├── app/
│   ├── (auth)/login/
│   ├── admin/{dashboard,clients,gateways,devices,commands,logs}/
│   ├── client/{dashboard,devices}/
│   └── api/{auth,clients,gateways,devices,commands,gateway}/
├── components/
├── lib/{auth,db,validation,commands,gateways,sms}/
├── server/{services,repositories,permissions}/
├── prisma/schema.prisma
├── docs/
├── tests/
```

`lib/` = utilitários e clientes reutilizáveis (ex. cliente Prisma, helpers de
validação, catálogo de comandos). `server/` = regra de negócio (services
orquestram, repositories falam com o Prisma, permissions decide quem pode
fazer o quê).

## Fluxo completo de um comando

1. Usuário clica "Abrir portão" no painel.
2. `POST /api/commands` — backend valida sessão, permissão, cliente,
   dispositivo, gateway; cria `Command` com status `PENDING`.
3. Android chama `POST /api/gateway/commands/claim` a cada intervalo de
   polling; backend faz claim atômico (transação Postgres) e muda o status
   para `CLAIMED`.
4. Android envia o SMS via `SmsManager`, depois `POST
   /api/gateway/commands/:id/sent` → status `SENT`.
5. Equipamento responde por SMS; Android recebe via `SmsReceiver` e envia
   `POST /api/gateway/sms/inbound`; backend associa a resposta ao comando
   (por ID/nonce embutido na mensagem) → status `CONFIRMED`.
6. Painel mostra o resultado.

Ver [gateway-protocol.md](gateway-protocol.md) e [sms-protocol.md](sms-protocol.md)
para os detalhes de cada etapa.

## Estados de um Command

```
PENDING → CLAIMED → SENDING → SENT → CONFIRMED
                          ↘ FAILED
PENDING → EXPIRED (TTL, padrão 5 min)
PENDING → CANCELLED
```

**SMS enviado não significa equipamento confirmado.** Só o `SmsReceiver`
recebendo a resposta do equipamento confirma o comando. Ver
[security.md](security.md#confirmação).

## Ordem de implementação (fases)

Não pular fases — cada fase precisa estar funcional (lint + build + testes
básicos) antes de avançar:

1. **Fundação** — Next.js, TS, Tailwind, Prisma, Neon, estrutura, env, migrations
2. **Autenticação** — login, sessão, roles, proteção de rotas
3. **Clientes** — CRUD, usuários, permissões
4. **Gateways** — CRUD, ativação, autenticação do gateway, heartbeat, status
5. **Dispositivos** — CRUD, associação a gateway, catálogo de comandos
6. **Commands** — criação, fila, claim, estados, idempotência, retry, expiração
7. **Android** — projeto Kotlin, ativação, auth, polling, heartbeat, SmsManager, receiver
8. **SMS inbound** — recebimento, processamento, associação ao comando
9. **Dashboards** — admin e cliente
10. **Segurança** — rate limiting, auditoria, hardening
11. **Testes** — unitários, integração, E2E, teste real com chip
12. **Deploy** — Vercel + Neon + domínio + produção

## Evolução futura (fora do MVP)

Múltiplos gateways por cliente, múltiplos chips, MQTT/HTTP como transporte
alternativo ao SMS, WebSocket/Realtime externo, Redis, filas dedicadas,
relatórios, notificações, WhatsApp, API pública, app mobile para clientes,
billing/planos, multi-tenant avançado. Não antecipar — só implementar quando
houver necessidade real de escala.
