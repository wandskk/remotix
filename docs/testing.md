# Testes

Cada fase só é considerada concluída com lint, build e testes passando (ver
regra de fases em [architecture.md](architecture.md#ordem-de-implementação-fases)).

## Backend

Framework: [Vitest](https://vitest.dev) (`npm test` roda uma vez, `npm run
test:watch` fica observando). Configuração em `vitest.config.mts`.

```
tests/
├── setup.ts          # carrega .env pros testes
├── helpers/
│   └── fixtures.ts   # cria Client/Gateway/Device/User de teste e limpa depois
├── unit/             # funções puras, sem banco (catálogo, política de
│                        retry, hash, validação, status do gateway)
└── integration/      # batem no banco de dev real (Neon) — cada teste cria
                         seus próprios registros e limpa via cascade delete
                         no Client de teste (server/services chamados
                         diretamente, sem subir o servidor HTTP)
```

Cobertura atual: autenticação de gateway (credenciais corretas/erradas,
gateway desativado, cliente inativo), registro/ativação, heartbeat,
criação de comando (catálogo, dispositivo/gateway desativado, escopo por
cliente, deduplicação), **claim atômico** (duas chamadas concorrentes só
uma recebe o comando), idempotência de `/sent` e `/failed` (SmsMessage
não duplica, tentativas não dobram), retry com backoff até `FAILED`,
expiração por TTL, confirmação via SMS de resposta (`processInboundSms`)
inclusive o caso de não reabrir um comando já `EXPIRED`, e rate limiting.

Não há banco de teste isolado nem CI configurados ainda — os testes de
integração usam a mesma conexão Neon do `.env` de desenvolvimento. Uma
melhoria futura razoável é separar um banco só para testes (ou usar
transações com rollback), mas para o estágio atual do projeto isso seria
antecipar infraestrutura sem necessidade real.

Login via NextAuth (Credentials Provider) não é testado automaticamente
— exercitar o `authorize()` exigiria subir o servidor Next inteiro. A
lógica que ele usa (hash de senha, busca de usuário) está coberta por
unit tests; o fluxo de login completo continua sendo verificado
manualmente no navegador a cada fase.

## Android (fase 7+)

Cobrir: autenticação, polling, envio de SMS, recebimento de SMS, retry,
reconexão, heartbeat, armazenamento local.

## Cenário crítico de ponta a ponta

Este fluxo precisa funcionar obrigatoriamente antes de considerar o MVP
pronto:

```
Admin cria cliente → cria gateway → ativa Android → cria dispositivo
  → cliente acessa painel → clica ABRIR → Command criado → Android recebe
  → SMS enviado → equipamento responde → Android envia resposta
  → Command CONFIRMED → painel mostra sucesso
```

## Checklist antes de considerar o MVP pronto

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] testes passando
- [ ] Prisma schema válido, migrations funcionando
- [ ] autenticação e autorização funcionando
- [ ] gateway autenticando, heartbeat e polling funcionando
- [ ] comando sendo criado, claimado, SMS enviado, resposta recebida
- [ ] idempotência e retry testados
- [ ] logs funcionando
- [ ] Vercel e Neon funcionando em produção
