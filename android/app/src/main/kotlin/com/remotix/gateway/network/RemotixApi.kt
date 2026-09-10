package com.remotix.gateway.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * Endpoints de docs/gateway-protocol.md — o único contrato que o app Android
 * fala com o backend. Nunca usar as rotas administrativas.
 */
interface RemotixApi {

    @POST("api/gateway/register")
    suspend fun register(@Body body: RegisterGatewayRequest): Response<ApiEnvelope<RegisterGatewayResponse>>

    @POST("api/gateway/auth")
    suspend fun auth(@Body body: GatewayCredentialsRequest): Response<ApiEnvelope<AuthGatewayResponse>>

    @POST("api/gateway/heartbeat")
    suspend fun heartbeat(@Body body: HeartbeatRequest): Response<ApiEnvelope<HeartbeatResponse>>

    @POST("api/gateway/commands/claim")
    suspend fun claimCommand(@Body body: GatewayCredentialsRequest): Response<ApiEnvelope<ClaimCommandResponse>>

    @POST("api/gateway/commands/{id}/start")
    suspend fun startCommand(
        @Path("id") commandId: String,
        @Body body: GatewayCredentialsRequest,
    ): Response<ApiEnvelope<CommandStatusResponse>>

    @POST("api/gateway/commands/{id}/sent")
    suspend fun markCommandSent(
        @Path("id") commandId: String,
        @Body body: GatewayCredentialsRequest,
    ): Response<ApiEnvelope<CommandStatusResponse>>

    @POST("api/gateway/commands/{id}/failed")
    suspend fun markCommandFailed(
        @Path("id") commandId: String,
        @Body body: ReportFailureRequest,
    ): Response<ApiEnvelope<ReportFailureResponse>>

    @POST("api/gateway/sms/inbound")
    suspend fun reportInboundSms(@Body body: InboundSmsRequest): Response<ApiEnvelope<Any>>
}
