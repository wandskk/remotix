package com.remotix.gateway.ui

import android.Manifest
import android.app.AlertDialog
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.remotix.gateway.BuildConfig
import com.remotix.gateway.R
import com.remotix.gateway.data.GatewaySession
import com.remotix.gateway.data.GatewayStore
import com.remotix.gateway.databinding.ActivityMainBinding
import com.remotix.gateway.network.ApiOutcome
import com.remotix.gateway.network.RegisterGatewayRequest
import com.remotix.gateway.network.buildRemotixApi
import com.remotix.gateway.network.safeApiCall
import com.remotix.gateway.service.GatewayForegroundService
import com.remotix.gateway.util.EventLogger
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var store: GatewayStore
    private var pendingActivationAfterPermissions = false

    private val requiredPermissions: Array<String>
        get() = buildList {
            add(Manifest.permission.SEND_SMS)
            add(Manifest.permission.RECEIVE_SMS)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }.toTypedArray()

    private val permissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { grantResults ->
        val allGranted = grantResults.values.all { it }
        if (allGranted && pendingActivationAfterPermissions) {
            pendingActivationAfterPermissions = false
            activate()
        } else if (!allGranted) {
            pendingActivationAfterPermissions = false
            showActivationError(getString(R.string.activation_permissions_required))
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        store = GatewayStore(this)
        binding.baseUrlInput.setText(BuildConfig.DEFAULT_API_BASE_URL)

        binding.activateButton.setOnClickListener { onActivateClicked() }
        binding.toggleServiceButton.setOnClickListener { onToggleServiceClicked() }
        binding.unlinkButton.setOnClickListener { onUnlinkClicked() }

        renderState()
        observeServiceState()
        observeLogs()
    }

    override fun onResume() {
        super.onResume()
        renderState()
    }

    private fun renderState() {
        val session = store.loadSession()
        if (session != null) {
            showStatusScreen(session)
            if (!GatewayForegroundService.isRunning.value) {
                GatewayForegroundService.start(this)
            }
        } else {
            showActivationScreen()
        }
    }

    private fun showActivationScreen() {
        binding.activationGroup.visibility = android.view.View.VISIBLE
        binding.statusGroup.visibility = android.view.View.GONE
    }

    private fun showStatusScreen(session: GatewaySession) {
        binding.activationGroup.visibility = android.view.View.GONE
        binding.statusGroup.visibility = android.view.View.VISIBLE
        binding.statusClient.text = getString(R.string.status_client, session.clientId)
        binding.statusGatewayId.text = getString(R.string.status_gateway_id, session.gatewayName)
        updateServiceStateLabel(GatewayForegroundService.isRunning.value)
    }

    private fun onActivateClicked() {
        val activationCode = binding.activationCodeInput.text?.toString()?.trim().orEmpty()
        val baseUrl = binding.baseUrlInput.text?.toString()?.trim().orEmpty()

        if (activationCode.isEmpty() || baseUrl.isEmpty()) {
            showActivationError(getString(R.string.activation_error_generic))
            return
        }

        val missingPermissions = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isNotEmpty()) {
            pendingActivationAfterPermissions = true
            permissionsLauncher.launch(missingPermissions.toTypedArray())
            return
        }

        activate()
    }

    private fun activate() {
        val activationCode = binding.activationCodeInput.text?.toString()?.trim().orEmpty()
        val baseUrl = binding.baseUrlInput.text?.toString()?.trim().orEmpty()
        val deviceUid = store.getOrCreateDeviceUid()

        setActivationLoading(true)

        lifecycleScope.launch {
            val api = buildRemotixApi(baseUrl)
            val outcome = safeApiCall {
                api.register(
                    RegisterGatewayRequest(
                        activationCode = activationCode,
                        deviceUid = deviceUid,
                        appVersion = appVersionName(),
                    ),
                )
            }

            setActivationLoading(false)

            when (outcome) {
                is ApiOutcome.Success -> {
                    val data = outcome.data
                    store.saveSession(
                        GatewaySession(
                            baseUrl = baseUrl,
                            deviceUid = deviceUid,
                            secret = data.gatewaySecret,
                            gatewayId = data.gatewayId,
                            gatewayName = data.name,
                            clientId = data.clientId,
                        ),
                    )
                    EventLogger.log("Gateway ativado: ${data.name}")
                    GatewayForegroundService.start(this@MainActivity)
                    renderState()
                }
                is ApiOutcome.Failure -> {
                    showActivationError(outcome.message)
                }
            }
        }
    }

    private fun onToggleServiceClicked() {
        if (GatewayForegroundService.isRunning.value) {
            GatewayForegroundService.stop(this)
        } else {
            GatewayForegroundService.start(this)
        }
    }

    private fun onUnlinkClicked() {
        AlertDialog.Builder(this)
            .setTitle(R.string.unlink_confirm_title)
            .setMessage(R.string.unlink_confirm_message)
            .setNegativeButton(R.string.action_cancel, null)
            .setPositiveButton(R.string.action_confirm) { _, _ ->
                GatewayForegroundService.stop(this)
                store.clearSession()
                binding.activationCodeInput.setText("")
                renderState()
            }
            .show()
    }

    private fun observeServiceState() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                GatewayForegroundService.isRunning.collect { running ->
                    updateServiceStateLabel(running)
                }
            }
        }
    }

    private fun observeLogs() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                EventLogger.lines.collect { lines ->
                    binding.logView.text = lines.takeLast(30).joinToString(separator = "\n")
                }
            }
        }
    }

    private fun updateServiceStateLabel(running: Boolean) {
        if (binding.statusGroup.visibility != android.view.View.VISIBLE) return
        binding.statusServiceState.text = getString(
            if (running) R.string.status_service_running else R.string.status_service_stopped,
        )
        binding.toggleServiceButton.text = getString(
            if (running) R.string.button_stop_service else R.string.button_start_service,
        )
    }

    private fun setActivationLoading(loading: Boolean) {
        binding.activationProgress.visibility = if (loading) android.view.View.VISIBLE else android.view.View.GONE
        binding.activateButton.isEnabled = !loading
        if (loading) binding.activationError.visibility = android.view.View.GONE
    }

    private fun showActivationError(message: String) {
        binding.activationError.text = message
        binding.activationError.visibility = android.view.View.VISIBLE
    }

    private fun appVersionName(): String = try {
        packageManager.getPackageInfo(packageName, 0).versionName ?: "unknown"
    } catch (_: Exception) {
        "unknown"
    }
}
