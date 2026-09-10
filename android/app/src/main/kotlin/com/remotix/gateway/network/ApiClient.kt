package com.remotix.gateway.network

import com.google.gson.Gson
import com.remotix.gateway.BuildConfig
import java.io.IOException
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

sealed class ApiOutcome<out T> {
    data class Success<T>(val data: T) : ApiOutcome<T>()
    data class Failure(val code: String, val message: String) : ApiOutcome<Nothing>()
}

private val gson = Gson()

/**
 * Constrói um RemotixApi para a URL base informada. Recriado sempre que o
 * usuário muda a URL na tela de ativação (não há estado de sessão HTTP —
 * cada chamada carrega as próprias credenciais no corpo, ver
 * docs/gateway-protocol.md).
 */
fun buildRemotixApi(baseUrl: String): RemotixApi {
    val normalizedBaseUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

    val logging = HttpLoggingInterceptor().apply {
        level = if (BuildConfig.DEBUG) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
    }

    val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .writeTimeout(15, TimeUnit.SECONDS)
        .addInterceptor(logging)
        .build()

    return Retrofit.Builder()
        .baseUrl(normalizedBaseUrl)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create(gson))
        .build()
        .create(RemotixApi::class.java)
}

/**
 * Traduz uma chamada Retrofit para o envelope {success,data|error} do
 * backend (docs/api.md#formato-de-erro) em um resultado tipado, tratando
 * também falha de rede/timeout como um único caso (NETWORK_ERROR) — o
 * chamador decide o que fazer (ex.: comando permanece pendente e será
 * reclaimado no próximo polling).
 */
suspend fun <T> safeApiCall(call: suspend () -> Response<ApiEnvelope<T>>): ApiOutcome<T> {
    return try {
        val response = call()
        val body = response.body()

        if (response.isSuccessful && body != null && body.success && body.data != null) {
            ApiOutcome.Success(body.data)
        } else if (body?.error != null) {
            ApiOutcome.Failure(body.error.code, body.error.message)
        } else {
            val parsedError = parseErrorBody(response)
            if (parsedError != null) {
                ApiOutcome.Failure(parsedError.code, parsedError.message)
            } else {
                ApiOutcome.Failure("HTTP_${response.code()}", response.message())
            }
        }
    } catch (error: IOException) {
        ApiOutcome.Failure("NETWORK_ERROR", error.message ?: "Falha de rede")
    } catch (error: Exception) {
        ApiOutcome.Failure("UNKNOWN_ERROR", error.message ?: "Erro desconhecido")
    }
}

private fun parseErrorBody(response: Response<*>): ApiErrorBody? {
    val raw = response.errorBody()?.string() ?: return null
    return try {
        // `error` não é o parâmetro genérico do envelope (é sempre
        // ApiErrorBody), então mesmo usando a classe crua o Gson consegue
        // desserializá-lo corretamente.
        gson.fromJson(raw, ApiEnvelope::class.java)?.error
    } catch (_: Exception) {
        null
    }
}
