package com.remotix.gateway.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.remotix.gateway.data.GatewayStore
import com.remotix.gateway.service.GatewayForegroundService
import com.remotix.gateway.util.EventLogger

/** Retoma o gateway sozinho depois de o aparelho reiniciar, se já estava ativado. */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED) return

        if (GatewayStore(context).isActivated()) {
            EventLogger.log("Aparelho reiniciado — retomando gateway.")
            GatewayForegroundService.start(context)
        }
    }
}
