# Segurança

## Autenticação do gateway

Nunca usar só `gateway_id` como credencial. No provisionamento, gerar um
`gateway_secret` próprio (ver [gateway-protocol.md](gateway-protocol.md)). O
secret não reaparece no painel depois de gerado; o backend guarda uma
representação segura (hash) quando possível. O Android guarda a credencial em
armazenamento seguro do sistema.

## Comandos críticos

Exigem: usuário autenticado, cliente correto, dispositivo ativo, gateway
ativo, comando permitido pelo catálogo, rate limit, auditoria. Considerar
confirmação visual explícita no painel ("Você deseja abrir o portão
principal?").

## Rate limiting

Proteger `/api/auth/*`, `/api/gateway/*`, `/api/commands/*`. Limites
configuráveis por usuário, cliente, gateway e IP — nunca deixar um cliente
gerar milhares de SMS rapidamente.

## Retry

Ao falhar o envio de um SMS: `attempts += 1`, limite inicial de **3
tentativas**, backoff `imediato / +10s / +30s`. O Android controla retries de
transporte quando apropriado; o backend controla o estado do `Command`. Nunca
duas camadas fazendo retry ao mesmo tempo.

## Expiração

Comandos `PENDING` antigos não ficam na fila para sempre — TTL padrão de
**5 minutos**, configurável, depois disso viram `EXPIRED`.

## Confirmação

SMS enviado ≠ equipamento confirmado. Ver
[sms-protocol.md](sms-protocol.md#três-estados-diferentes-de-enviado).

## Segurança do Android

HTTPS sempre; credenciais em armazenamento seguro; nunca secret em log; nunca
credencial hardcoded; validar toda resposta da API; evitar processar comando
duplicado; validar origem das operações; nunca executar comando arbitrário
sem autorização do backend.

## Segredos

Nenhum secret no código-fonte. Tudo via variáveis de ambiente
(`.env`, nunca commitado — ver [`.env.example`](../.env.example)).
