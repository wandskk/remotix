package com.remotix.gateway.service

import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull

sealed class SmsSendResult {
    object Success : SmsSendResult()
    data class Failure(val errorCode: String, val errorMessage: String) : SmsSendResult()
}

private const val ACTION_SMS_SENT = "com.remotix.gateway.action.SMS_SENT"
private const val SEND_TIMEOUT_MS = 20_000L

/**
 * Envia um SMS e aguarda o resultado do rádio (SmsManager só confirma via
 * broadcast assíncrono). Uma única tentativa por comando reclamado — o
 * retry entre tentativas é responsabilidade do backend via `nextAttemptAt`
 * (docs/security.md#retry): o Android nunca reenviaria sozinho o mesmo SMS.
 */
object SmsSender {

    suspend fun send(context: Context, destination: String, message: String): SmsSendResult {
        val appContext = context.applicationContext
        // SmsManager.getDefault() (e não o getSystemService(Class) da API 31+) para funcionar
        // a partir do minSdk 26 — MVP assume um único chip físico (docs/architecture.md).
        @Suppress("DEPRECATION")
        val smsManager = SmsManager.getDefault()

        val result = withTimeoutOrNull(SEND_TIMEOUT_MS) {
            suspendCancellableCoroutine<SmsSendResult> { continuation ->
                val receiver = object : BroadcastReceiver() {
                    override fun onReceive(ctx: Context, intent: Intent) {
                        appContext.unregisterReceiver(this)
                        val outcome = resultCodeToOutcome(resultCode)
                        if (continuation.isActive) continuation.resume(outcome)
                    }
                }

                ContextCompat.registerReceiver(
                    appContext,
                    receiver,
                    IntentFilter(ACTION_SMS_SENT),
                    ContextCompat.RECEIVER_NOT_EXPORTED,
                )

                continuation.invokeOnCancellation {
                    runCatching { appContext.unregisterReceiver(receiver) }
                }

                val sentIntent = PendingIntent.getBroadcast(
                    appContext,
                    destination.hashCode(),
                    Intent(ACTION_SMS_SENT),
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                )

                try {
                    val parts = smsManager.divideMessage(message)
                    if (parts.size > 1) {
                        val sentIntents = ArrayList<PendingIntent>(parts.size).apply {
                            repeat(parts.size) { add(sentIntent) }
                        }
                        smsManager.sendMultipartTextMessage(destination, null, parts, sentIntents, null)
                    } else {
                        smsManager.sendTextMessage(destination, null, message, sentIntent, null)
                    }
                } catch (error: Exception) {
                    appContext.unregisterReceiver(receiver)
                    if (continuation.isActive) {
                        continuation.resume(
                            SmsSendResult.Failure("SEND_EXCEPTION", error.message ?: "Falha ao enviar SMS"),
                        )
                    }
                }
            }
        }

        // Confirmado em teste real (Redmi/HyperOS): a ROM intercepta a entrega do
        // sentIntent para apps de terceiro via um mecanismo interno próprio
        // (com.anrdoid.internal.action.SEND_SMS_RESULT_EVENT visto em
        // `dumpsys activity broadcasts`), então o broadcast de confirmação às vezes
        // nunca chega — mesmo o SMS tendo sido enviado de verdade. Reportar /failed
        // nesse caso faz o backend reabrir o Command pra retry (nextAttemptAt) e
        // reenviar o MESMO SMS de novo, causando duplicata real pro destinatário —
        // pior do que assumir sucesso sem confirmação. Por isso o timeout é tratado
        // como sucesso, não falha.
        return result ?: SmsSendResult.Success
    }

    private fun resultCodeToOutcome(resultCode: Int): SmsSendResult {
        return when (resultCode) {
            android.app.Activity.RESULT_OK -> SmsSendResult.Success
            SmsManager.RESULT_ERROR_NO_SERVICE -> SmsSendResult.Failure("NO_SERVICE", "Sem sinal da operadora")
            SmsManager.RESULT_ERROR_RADIO_OFF -> SmsSendResult.Failure("RADIO_OFF", "Rádio desligado")
            SmsManager.RESULT_ERROR_NULL_PDU -> SmsSendResult.Failure("NULL_PDU", "PDU nulo")
            SmsManager.RESULT_ERROR_GENERIC_FAILURE ->
                SmsSendResult.Failure("GENERIC_FAILURE", "Falha genérica ao enviar")
            else -> SmsSendResult.Failure("ERROR_$resultCode", "Falha ao enviar SMS (código $resultCode)")
        }
    }
}
