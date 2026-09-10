package com.remotix.gateway.service

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.remotix.gateway.data.GatewayStore
import com.remotix.gateway.network.ApiOutcome
import com.remotix.gateway.network.InboundSmsRequest
import com.remotix.gateway.network.buildRemotixApi
import com.remotix.gateway.network.safeApiCall
import com.remotix.gateway.util.EventLogger
import java.util.concurrent.TimeUnit

/**
 * Reporta um SMS recebido do equipamento via WorkManager em vez de chamar a
 * API direto do BroadcastReceiver — sobrevive à morte do processo e tenta
 * de novo sozinho com backoff se não houver internet no momento
 * (docs/gateway-protocol.md#falhas: "sem internet, nada se perde").
 */
class InboundSmsReportWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val from = inputData.getString(KEY_FROM) ?: return Result.failure()
        val message = inputData.getString(KEY_MESSAGE) ?: return Result.failure()

        val session = GatewayStore(applicationContext).loadSession() ?: return Result.failure()
        val api = buildRemotixApi(session.baseUrl)

        val outcome = safeApiCall {
            api.reportInboundSms(
                InboundSmsRequest(
                    deviceUid = session.deviceUid,
                    secret = session.secret,
                    from = from,
                    message = message,
                ),
            )
        }

        return when (outcome) {
            is ApiOutcome.Success -> {
                EventLogger.log("SMS recebido de $from reportado.")
                Result.success()
            }
            is ApiOutcome.Failure -> {
                EventLogger.log("Falha ao reportar SMS de $from: ${outcome.message}")
                if (outcome.code == "NETWORK_ERROR") Result.retry() else Result.failure()
            }
        }
    }

    companion object {
        private const val KEY_FROM = "from"
        private const val KEY_MESSAGE = "message"

        fun enqueue(context: Context, from: String, message: String) {
            val data = Data.Builder()
                .putString(KEY_FROM, from)
                .putString(KEY_MESSAGE, message)
                .build()

            val request = OneTimeWorkRequestBuilder<InboundSmsReportWorker>()
                .setInputData(data)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context).enqueue(request)
        }
    }
}
