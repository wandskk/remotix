package com.remotix.gateway.network

/**
 * Envelope comum de toda a API (docs/api.md#formato-de-erro):
 * { success: true, data: T } ou { success: false, error: { code, message } }.
 */
data class ApiEnvelope<T>(
    val success: Boolean,
    val data: T?,
    val error: ApiErrorBody?,
)

data class ApiErrorBody(
    val code: String,
    val message: String,
)

// --- Requests (espelham lib/validation/gateway.ts e lib/validation/command.ts) ---

data class RegisterGatewayRequest(
    val activationCode: String,
    val deviceUid: String,
    val appVersion: String?,
)

data class GatewayCredentialsRequest(
    val deviceUid: String,
    val secret: String,
)

data class HeartbeatRequest(
    val deviceUid: String,
    val secret: String,
    val batteryLevel: Int?,
    val networkType: String?,
    val appVersion: String?,
)

data class ReportFailureRequest(
    val deviceUid: String,
    val secret: String,
    val errorCode: String?,
    val errorMessage: String?,
)

data class InboundSmsRequest(
    val deviceUid: String,
    val secret: String,
    val from: String,
    val message: String,
)

// --- Responses ---

data class RegisterGatewayResponse(
    val gatewayId: String,
    val gatewaySecret: String,
    val name: String,
    val clientId: String,
)

data class AuthGatewayResponse(
    val gatewayId: String,
    val name: String,
    val clientId: String,
)

data class HeartbeatResponse(
    val status: String,
    val lastSeenAt: String?,
)

data class ClaimCommandResponse(
    val command: PendingCommand?,
)

data class PendingCommand(
    val id: String,
    val type: String,
    val destination: String,
    val message: String,
)

data class CommandStatusResponse(
    val status: String,
)

data class ReportFailureResponse(
    val status: String,
    val attempts: Int,
)
