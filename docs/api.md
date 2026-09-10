# API administrativa

Endpoints conceituais (fase 3 em diante):

```
POST   /api/clients
GET    /api/clients
GET    /api/clients/:id
PATCH  /api/clients/:id
DELETE /api/clients/:id

POST   /api/gateways
GET    /api/gateways
GET    /api/gateways/:id
PATCH  /api/gateways/:id

POST   /api/devices
GET    /api/devices
GET    /api/devices/:id
PATCH  /api/devices/:id

POST   /api/commands
GET    /api/commands
GET    /api/commands/:id
POST   /api/commands/:id/cancel
```

Ver [gateway-protocol.md](gateway-protocol.md) para os endpoints específicos
do Android (`/api/gateway/*`).

## Autorização

```
ADMIN  → acessa tudo
CLIENT → só os recursos vinculados ao próprio client_id
```

O `client_id` nunca é aceito vindo do frontend/body — o backend sempre o
deriva da sessão autenticada.

## Formato de erro

```json
{
  "success": false,
  "error": {
    "code": "GATEWAY_OFFLINE",
    "message": "O gateway não está conectado."
  }
}
```

Códigos previsíveis: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
`VALIDATION_ERROR`, `GATEWAY_OFFLINE`, `GATEWAY_DISABLED`, `DEVICE_DISABLED`,
`COMMAND_NOT_FOUND`, `COMMAND_EXPIRED`, `COMMAND_ALREADY_PROCESSED`,
`RATE_LIMITED`, `INTERNAL_ERROR`.
