// Códigos previstos em docs/api.md — mantidos estáveis para o frontend e
// para o Android poderem tratar cada caso de forma programática.
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "GATEWAY_OFFLINE"
  | "GATEWAY_DISABLED"
  | "DEVICE_DISABLED"
  | "COMMAND_NOT_FOUND"
  | "COMMAND_EXPIRED"
  | "COMMAND_ALREADY_PROCESSED"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  GATEWAY_OFFLINE: 409,
  GATEWAY_DISABLED: 409,
  DEVICE_DISABLED: 409,
  COMMAND_NOT_FOUND: 404,
  COMMAND_EXPIRED: 409,
  COMMAND_ALREADY_PROCESSED: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export function unauthorized(message = "Sessão inválida ou expirada.") {
  return new ApiError("UNAUTHORIZED", message);
}

export function forbidden(message = "Você não tem permissão para esta ação.") {
  return new ApiError("FORBIDDEN", message);
}

export function notFound(message = "Recurso não encontrado.") {
  return new ApiError("NOT_FOUND", message);
}

export function validationError(message: string, details?: unknown) {
  return new ApiError("VALIDATION_ERROR", message, details);
}
