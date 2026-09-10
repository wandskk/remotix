package com.remotix.gateway.data

import android.content.Context

/**
 * Guarda localmente os `commandId` já processados para ignorar
 * reprocessamento em caso de claim duplicado (docs/gateway-protocol.md#idempotência).
 * Não precisa de criptografia (não é segredo) nem de banco — um conjunto
 * limitado em SharedPreferences é suficiente para o volume esperado.
 */
class ProcessedCommandsStore(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    @Synchronized
    fun isProcessed(commandId: String): Boolean {
        return prefs.getStringSet(KEY_IDS, emptySet())?.contains(commandId) == true
    }

    @Synchronized
    fun markProcessed(commandId: String) {
        val current = prefs.getStringSet(KEY_IDS, emptySet())?.toMutableList() ?: mutableListOf()
        current.add(commandId)

        val trimmed = if (current.size > MAX_ENTRIES) {
            current.takeLast(MAX_ENTRIES)
        } else {
            current
        }

        prefs.edit().putStringSet(KEY_IDS, trimmed.toSet()).apply()
    }

    companion object {
        private const val PREFS_NAME = "remotix_gateway_processed_commands"
        private const val KEY_IDS = "ids"
        private const val MAX_ENTRIES = 300
    }
}
