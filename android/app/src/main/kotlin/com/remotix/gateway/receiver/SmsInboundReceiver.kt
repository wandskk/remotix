package com.remotix.gateway.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import com.remotix.gateway.service.InboundSmsReportWorker
import com.remotix.gateway.util.EventLogger

/**
 * SMS de resposta do equipamento (docs/sms-protocol.md#correlação-comando-resposta).
 * Só enfileira o report — quem decide se casa com um Command é o backend.
 */
class SmsInboundReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
        if (messages.isEmpty()) return

        val from = messages.first().originatingAddress ?: return
        val body = messages.joinToString(separator = "") { it.messageBody ?: "" }

        EventLogger.log("SMS recebido de $from.")
        InboundSmsReportWorker.enqueue(context, from, body)
    }
}
