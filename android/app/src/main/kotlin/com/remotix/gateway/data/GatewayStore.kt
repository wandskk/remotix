package com.remotix.gateway.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.UUID

data class GatewaySession(
    val baseUrl: String,
    val deviceUid: String,
    val secret: String,
    val gatewayId: String,
    val gatewayName: String,
    val clientId: String,
)

/**
 * Credenciais do gateway (deviceUid + secret) em armazenamento seguro do
 * Android (docs/security.md#segurança-do-android) — nunca em
 * SharedPreferences comuns, nunca logado.
 */
class GatewayStore(context: Context) {

    private val appContext = context.applicationContext

    private val prefs: SharedPreferences by lazy {
        val masterKey = MasterKey.Builder(appContext)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()

        EncryptedSharedPreferences.create(
            appContext,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    /** UUID gerado uma vez por instalação — identifica o par app+aparelho (docs/database.md#gateway). */
    fun getOrCreateDeviceUid(): String {
        val existing = prefs.getString(KEY_DEVICE_UID, null)
        if (existing != null) return existing

        val generated = UUID.randomUUID().toString()
        prefs.edit().putString(KEY_DEVICE_UID, generated).apply()
        return generated
    }

    fun saveSession(session: GatewaySession) {
        prefs.edit()
            .putString(KEY_BASE_URL, session.baseUrl)
            .putString(KEY_DEVICE_UID, session.deviceUid)
            .putString(KEY_SECRET, session.secret)
            .putString(KEY_GATEWAY_ID, session.gatewayId)
            .putString(KEY_GATEWAY_NAME, session.gatewayName)
            .putString(KEY_CLIENT_ID, session.clientId)
            .apply()
    }

    fun loadSession(): GatewaySession? {
        val secret = prefs.getString(KEY_SECRET, null) ?: return null
        val deviceUid = prefs.getString(KEY_DEVICE_UID, null) ?: return null
        val baseUrl = prefs.getString(KEY_BASE_URL, null) ?: return null
        val gatewayId = prefs.getString(KEY_GATEWAY_ID, null) ?: return null

        return GatewaySession(
            baseUrl = baseUrl,
            deviceUid = deviceUid,
            secret = secret,
            gatewayId = gatewayId,
            gatewayName = prefs.getString(KEY_GATEWAY_NAME, "") ?: "",
            clientId = prefs.getString(KEY_CLIENT_ID, "") ?: "",
        )
    }

    fun isActivated(): Boolean = loadSession() != null

    /** Mantém o deviceUid: um novo código de ativação reusa o mesmo aparelho. */
    fun clearSession() {
        prefs.edit()
            .remove(KEY_SECRET)
            .remove(KEY_GATEWAY_ID)
            .remove(KEY_GATEWAY_NAME)
            .remove(KEY_CLIENT_ID)
            .remove(KEY_BASE_URL)
            .apply()
    }

    companion object {
        private const val PREFS_NAME = "remotix_gateway_secure_prefs"
        private const val KEY_BASE_URL = "base_url"
        private const val KEY_DEVICE_UID = "device_uid"
        private const val KEY_SECRET = "secret"
        private const val KEY_GATEWAY_ID = "gateway_id"
        private const val KEY_GATEWAY_NAME = "gateway_name"
        private const val KEY_CLIENT_ID = "client_id"
    }
}
