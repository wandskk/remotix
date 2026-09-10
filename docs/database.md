# Banco de dados

PostgreSQL (Neon) via Prisma. O schema fica em [`prisma/schema.prisma`](../prisma/schema.prisma)
e é a fonte de verdade — nunca alterar o banco manualmente sem registrar via
migration.

## Entidades

### User
Usuários do sistema. `role`: `ADMIN` | `CLIENT`. Usuário `CLIENT` sempre tem
`client_id` preenchido; a autorização nunca confia em `client_id` vindo do
frontend, sempre deriva da sessão.

### Client
Um cliente da plataforma. Relacionamentos: `Client → Users`, `Client →
Gateways`, `Client → Devices`.

### Gateway
O aparelho Android físico. Campos: `device_uid` (único, não confiar só no
número do chip), `sim_phone`, `status` (`ONLINE`/`OFFLINE`/`INACTIVE`/`DISABLED`,
calculado a partir de `last_seen_at`), `last_seen_at`, `app_version`,
`battery_level`, `network_type`.

### Device
O equipamento controlado (portão, luz, bomba...). Pertence a um `Client` e a
um `Gateway`. `type`: `GATE` | `LIGHT` | `PUMP` | `ALARM` | `OTHER`.

### Command
Uma ação solicitada. `type` inicialmente só `SEND_SMS` (existe para permitir
expansão futura — MQTT/HTTP). `status` — ver máquina de estados em
[architecture.md](architecture.md#estados-de-um-command). Campos de
timestamp: `claimed_at`, `sent_at`, `confirmed_at`, `failed_at`. `attempts`,
`error_code`, `error_message`.

### SmsMessage
Registro de cada SMS enviado ou recebido, ligado a um `Command` e a um
`Gateway`. `direction`: `OUTBOUND` | `INBOUND`.

### GatewayEvent
Eventos do Android: `CONNECTED`, `HEARTBEAT`, `COMMAND_RECEIVED`, `SMS_SENT`,
`SMS_FAILED`, `SMS_RECEIVED`, `APP_STARTED`, `APP_STOPPED`, `AUTH_FAILED`.
Evitar armazenar dados desnecessários no `payload`.

### AuditLog
Toda operação administrativa importante gera um registro:
`CLIENT_CREATED`, `CLIENT_UPDATED`, `GATEWAY_CREATED`, `GATEWAY_DISABLED`,
`DEVICE_CREATED`, `COMMAND_CREATED`, `COMMAND_CANCELLED`, `USER_LOGIN`, etc.

## Migrations

```bash
npx prisma migrate dev --name <descricao>   # dev
npx prisma migrate deploy                    # produção
npx prisma generate
```

`DATABASE_URL` é a connection string pooled (usada em runtime);
`DIRECT_URL` é a conexão direta ao Neon, usada pelo Prisma só para rodar
migrations.
