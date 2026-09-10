// Limites por escopo (docs/security.md#rate-limiting). Ajustar conforme
// uso real — evitar que um cliente gere milhares de SMS rapidamente, ou
// que login/ativação sejam usados para força bruta.

export const LOGIN_RATE_LIMIT = { limit: 5, windowMs: 5 * 60 * 1000 }; // 5 tentativas / 5min por email

export const GATEWAY_REGISTER_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 }; // por código de ativação

// Cobre auth/heartbeat/claim/start/sent/failed — todos passam por
// authenticateGateway, então um único limite por deviceUid já protege
// toda a superfície /api/gateway/*.
export const GATEWAY_REQUEST_RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 };

export const COMMAND_CREATE_RATE_LIMIT = { limit: 20, windowMs: 60 * 1000 }; // por cliente
