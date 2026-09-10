# Testes

Cada fase só é considerada concluída com lint, build e testes passando (ver
regra de fases em [architecture.md](architecture.md#ordem-de-implementação-fases)).

## Backend

Cobrir: autenticação, autorização, criação de comando, validação, claim
atômico, idempotência, retry, expiração, associação SMS/comando.

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
