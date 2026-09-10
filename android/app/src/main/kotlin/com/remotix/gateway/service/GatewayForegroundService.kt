package com.remotix.gateway.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.lifecycle.LifecycleService
import androidx.lifecycle.lifecycleScope
import com.remotix.gateway.R
import com.remotix.gateway.data.GatewaySession
import com.remotix.gateway.data.GatewayStore
import com.remotix.gateway.data.ProcessedCommandsStore
import com.remotix.gateway.network.ApiOutcome
import com.remotix.gateway.network.GatewayCredentialsRequest
import com.remotix.gateway.network.HeartbeatRequest
import com.remotix.gateway.network.ReportFailureRequest
import com.remotix.gateway.network.RemotixApi
import com.remotix.gateway.network.buildRemotixApi
import com.remotix.gateway.network.safeApiCall
import com.remotix.gateway.ui.MainActivity
import com.remotix.gateway.util.DeviceInfo
import com.remotix.gateway.util.EventLogger
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Coração do gateway: mantém heartbeat + polling de comandos rodando em
 * primeiro plano (docs/architecture.md — "Foreground Service"), já que o
 * backend é serverless e não existe canal push (docs/decisions/002-polling.md).
 */
class GatewayForegroundService : LifecycleService() {

    private lateinit var store: GatewayStore
    private lateinit var processedCommands: ProcessedCommandsStore
    private var api: RemotixApi? = null
    private var session: GatewaySession? = null
    private var loopsStarted = false

    override fun onCreate() {
        super.onCreate()
        store = GatewayStore(this)
        processedCommands = ProcessedCommandsStore(this)
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification(getString(R.string.notification_text_idle)))
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)

        if (intent?.action == ACTION_STOP) {
            _isRunning.value = false
            stopSelf()
            return START_NOT_STICKY
        }

        val loadedSession = store.loadSession()
        if (loadedSession == null) {
            EventLogger.log("Serviço iniciado sem credenciais — encerrando.")
            stopSelf()
            return START_NOT_STICKY
        }

        session = loadedSession
        api = buildRemotixApi(loadedSession.baseUrl)
        _isRunning.value = true

        if (!loopsStarted) {
            loopsStarted = true
            startHeartbeatLoop()
            startPollLoop()
        }

        return START_STICKY
    }

    override fun onDestroy() {
        _isRunning.value = false
        EventLogger.log("Serviço parado.")
        super.onDestroy()
    }

    private fun startHeartbeatLoop() {
        lifecycleScope.launch {
            while (isActive) {
                sendHeartbeat()
                delay(HEARTBEAT_INTERVAL_MS)
            }
        }
    }

    private fun startPollLoop() {
        lifecycleScope.launch {
            while (isActive) {
                pollOnce()
                delay(POLL_INTERVAL_MS)
            }
        }
    }

    private suspend fun sendHeartbeat() {
        val currentSession = session ?: return
        val currentApi = api ?: return

        val outcome = safeApiCall {
            currentApi.heartbeat(
                HeartbeatRequest(
                    deviceUid = currentSession.deviceUid,
                    secret = currentSession.secret,
                    batteryLevel = DeviceInfo.batteryLevel(this@GatewayForegroundService),
                    networkType = DeviceInfo.networkType(this@GatewayForegroundService),
                    appVersion = appVersionName(),
                ),
            )
        }

        when (outcome) {
            is ApiOutcome.Success -> {
                updateNotification(getString(R.string.notification_text_idle))
            }
            is ApiOutcome.Failure -> {
                EventLogger.log("Heartbeat falhou: ${outcome.code} — ${outcome.message}")
                updateNotification(getString(R.string.notification_text_offline))
            }
        }
    }

    private suspend fun pollOnce() {
        val currentSession = session ?: return
        val currentApi = api ?: return

        val credentials = GatewayCredentialsRequest(currentSession.deviceUid, currentSession.secret)
        val outcome = safeApiCall { currentApi.claimCommand(credentials) }

        val command = when (outcome) {
            is ApiOutcome.Success -> outcome.data.command
            is ApiOutcome.Failure -> {
                if (outcome.code != "NETWORK_ERROR") {
                    EventLogger.log("Claim falhou: ${outcome.code} — ${outcome.message}")
                }
                null
            }
        } ?: return

        if (processedCommands.isProcessed(command.id)) {
            // Defensivo: claim é atômico no backend e não deveria repetir um comando já
            // concluído, mas nunca reprocessar por segurança (docs/gateway-protocol.md#idempotência).
            EventLogger.log("Comando ${command.id} já processado, ignorando.")
            return
        }

        EventLogger.log("Comando recebido: ${command.id} → ${command.destination}")
        safeApiCall { currentApi.startCommand(command.id, credentials) }

        when (val sendResult = SmsSender.send(this, command.destination, command.message)) {
            is SmsSendResult.Success -> {
                safeApiCall { currentApi.markCommandSent(command.id, credentials) }
                processedCommands.markProcessed(command.id)
                EventLogger.log("SMS enviado para comando ${command.id}.")
            }
            is SmsSendResult.Failure -> {
                safeApiCall {
                    currentApi.markCommandFailed(
                        command.id,
                        ReportFailureRequest(
                            deviceUid = currentSession.deviceUid,
                            secret = currentSession.secret,
                            errorCode = sendResult.errorCode,
                            errorMessage = sendResult.errorMessage,
                        ),
                    )
                }
                EventLogger.log("Falha ao enviar comando ${command.id}: ${sendResult.errorCode}")
                // Não marca como processado: o backend decide se reabre para PENDING (retry
                // com backoff) e, se reabrir, o Android deve reprocessar o mesmo commandId
                // normalmente no próximo claim (docs/security.md#retry).
            }
        }
    }

    private fun appVersionName(): String = try {
        packageManager.getPackageInfo(packageName, 0).versionName ?: "unknown"
    } catch (_: Exception) {
        "unknown"
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.notification_channel_name),
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = getString(R.string.notification_channel_description)
        }

        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun buildNotification(text: String): Notification {
        val openAppIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE,
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(getString(R.string.notification_title))
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(openAppIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(text))
    }

    companion object {
        const val ACTION_START = "com.remotix.gateway.action.START"
        const val ACTION_STOP = "com.remotix.gateway.action.STOP"

        private const val CHANNEL_ID = "remotix_gateway_status"
        private const val NOTIFICATION_ID = 1001

        private const val POLL_INTERVAL_MS = 5_000L
        private const val HEARTBEAT_INTERVAL_MS = 30_000L

        private val _isRunning = MutableStateFlow(false)
        val isRunning: StateFlow<Boolean> = _isRunning

        fun start(context: Context) {
            val intent = Intent(context, GatewayForegroundService::class.java).setAction(ACTION_START)
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, GatewayForegroundService::class.java).setAction(ACTION_STOP)
            context.startService(intent)
        }
    }
}
