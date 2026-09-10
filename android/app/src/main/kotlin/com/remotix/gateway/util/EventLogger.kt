package com.remotix.gateway.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * Log em memória (não persistido) para a tela de status — só para
 * diagnóstico visual do que o gateway está fazendo, nunca contém secret
 * (docs/security.md#segurança-do-android: "nunca secret em log").
 */
object EventLogger {

    private const val MAX_LINES = 200
    private val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())

    private val _lines = MutableStateFlow<List<String>>(emptyList())
    val lines: StateFlow<List<String>> = _lines

    @Synchronized
    fun log(message: String) {
        val timestamped = "${timeFormat.format(Date())}  $message"
        val updated = (_lines.value + timestamped).takeLast(MAX_LINES)
        _lines.value = updated
    }
}
