# Protocolo do Gateway (Android ↔ API)

O Android não usa as APIs administrativas — só os endpoints abaixo, sob
`/api/gateway/*`, autenticados por credencial própria do gateway (nunca só
`gateway_id`).

| Endpoint | Descrição |
|---|---|
| `POST /api/gateway/register` | Registra o gateway |
| `POST /api/gateway/auth` | Autentica o gateway |
| `POST /api/gateway/heartbeat` | Heartbeat periódico |
| `POST /api/gateway/commands/claim` | Busca e reserva o próximo comando pendente |
| `POST /api/gateway/commands/:id/start` | Informa que iniciou execução |
| `POST /api/gateway/commands/:id/sent` | Informa que o SMS foi enviado |
| `POST /api/gateway/commands/:id/failed` | Informa falha no envio |
| `POST /api/gateway/sms/inbound` | Informa SMS recebido |

## Provisionamento

1. Admin cria o Gateway no painel.
2. Sistema gera um código de ativação de curta validade (ex. `A7K9-2P4M`).
3. App Android pede o código ao usuário.
4. App chama a API com o código.
5. API valida o código e vincula o gateway.
6. API devolve a credencial (`gateway_id` + `gateway_secret`).
7. App armazena a credencial em armazenamento seguro do Android.
8. Gateway começa a operar (heartbeat + polling).

O secret nunca aparece de novo no painel administrativo depois de criado; o
backend armazena só uma representação segura (hash) quando possível.

## Heartbeat

```json
{ "batteryLevel": 84, "networkType": "4G", "appVersion": "1.0.0" }
```

Atualiza `last_seen_at`, `battery_level`, `network_type`, `app_version`,
`status`.

## Status calculado

Não é um booleano solto — é derivado de `last_seen_at` (limites
configuráveis):

```
último heartbeat < 90s        → ONLINE
90s – 5min                    → INACTIVE
> 5min                        → OFFLINE
```

## Claim de comandos (polling)

```
POST /api/gateway/commands/claim
```

1. autentica o gateway
2. procura comando `PENDING` pertencente a esse gateway
3. faz o claim de forma **atômica/transacional** no Postgres (evita dois
   requests pegando o mesmo comando)
4. muda o status para `CLAIMED`
5. retorna o comando

Sem comando pendente: `{ "command": null }`.

Intervalo de polling configurável, padrão **5 segundos** — nunca polling
agressivo de 1s por padrão.

## Idempotência

Cada `Command` tem ID único. O Android guarda localmente os comandos já
processados e ignora reprocessamento do mesmo `commandId`. A API também trata
requests repetidos (retry HTTP) de forma idempotente — nunca deve resultar em
SMS duplicado.

## Falhas

- **Sem internet**: comando permanece `PENDING`; nada se perde, o Android
  retoma o claim quando reconectar.
- **Falha no envio do SMS**: Android chama `.../failed`; backend incrementa
  `attempts` e marca `FAILED`. Política de retry (backend) decide se volta
  para `PENDING` — nunca reenviar automaticamente comando crítico sem
  política explícita. Ver [security.md](security.md#retry).
