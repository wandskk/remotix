# Remotix Gateway (Android)

App Kotlin que roda no celular físico com chip, consome a fila de comandos
do backend Remotix e envia/recebe SMS. Implementa a fase 7 descrita em
[../docs/architecture.md](../docs/architecture.md#ordem-de-implementação-fases).
Protocolo completo em [../docs/gateway-protocol.md](../docs/gateway-protocol.md),
[../docs/sms-protocol.md](../docs/sms-protocol.md) e
[../docs/security.md](../docs/security.md) — este app não inventa nenhum
comportamento fora do que está documentado ali.

## Abrir e rodar

Já compilado e testado de ponta a ponta num aparelho físico real (Redmi,
HyperOS). Toolchain atual: **Gradle 9.7.1 · AGP 9.4.0 · compileSdk/targetSdk
36 · minSdk 26 · JDK 17 (via toolchain, funciona com o JBR do Android
Studio, que hoje é JDK 25)**. AGP 9 tem suporte a Kotlin embutido — não use
o plugin `org.jetbrains.kotlin.android` (removido de propósito, ver
https://kotl.in/gradle/agp-built-in-kotlin).

1. Abra a pasta `android/` no **Android Studio** (2024.x ou mais recente) —
   ele sincroniza sozinho, ou:

   ```bash
   cd android
   ./gradlew installDebug
   adb shell am start -n com.remotix.gateway/.ui.MainActivity
   ```

2. Conecte o aparelho físico por USB com depuração habilitada e autorize o
   computador no popup que aparece no celular (`adb devices` precisa
   mostrar `device`, não `unauthorized`).

3. Na tela de ativação, confirme a **URL da API** (padrão:
   `https://remotix.vercel.app/`, vem de `BuildConfig.DEFAULT_API_BASE_URL`
   em `app/build.gradle.kts`) e digite o **código de ativação** gerado no
   painel admin ao criar o Gateway.
4. Conceda as permissões de SMS e notificações quando solicitado.

## Testando contra um backend local

O app bloqueia tráfego HTTP puro (`usesCleartextTraffic="false"`,
docs/security.md exige HTTPS sempre). Para testar contra `npm run dev`
(`localhost:3000`) a partir de um aparelho físico, exponha o servidor local
via HTTPS (ex. `ngrok http 3000`) e use essa URL na tela de ativação — não
enfraqueça a config de rede do app para aceitar cleartext.

## Estrutura

```
app/src/main/kotlin/com/remotix/gateway/
├── ui/MainActivity.kt            — ativação + tela de status (Views + ViewBinding)
├── service/
│   ├── GatewayForegroundService.kt — heartbeat + polling de comandos (loop principal)
│   ├── SmsSender.kt                — envia SMS via SmsManager, aguarda confirmação do rádio
│   └── InboundSmsReportWorker.kt   — reporta SMS recebido via WorkManager (retry automático)
├── receiver/
│   ├── SmsInboundReceiver.kt       — SMS_RECEIVED_ACTION → enfileira o report
│   └── BootReceiver.kt             — retoma o serviço depois de reiniciar o aparelho
├── network/                        — Retrofit/Gson, um arquivo por schema de lib/validation/*.ts
├── data/
│   ├── GatewayStore.kt              — credenciais em EncryptedSharedPreferences
│   └── ProcessedCommandsStore.kt    — idempotência local (docs/gateway-protocol.md#idempotência)
└── util/                            — bateria/rede para heartbeat, log em memória da tela de status
```

## Decisões importantes (para não reinventar ao mexer aqui)

- **Uma única tentativa de SMS por comando reclamado.** O backend controla
  retry/backoff via `nextAttemptAt` e reabre o mesmo `commandId` para
  `PENDING` (ver `server/services/command-service.ts#markCommandFailed`) —
  o Android nunca reenvia sozinho, senão duas camadas fariam retry ao mesmo
  tempo (proibido por docs/security.md#retry).
- **Idempotência local só bloqueia definitivamente após um `/sent` bem
  sucedido** — nunca após um `/failed`, porque o backend pode reabrir o
  mesmo `commandId` para uma nova tentativa.
- **SMS recebido é reportado via WorkManager**, não direto do
  `BroadcastReceiver` — sobrevive à morte do processo e tenta de novo
  sozinho sem internet no momento (docs/gateway-protocol.md#falhas).
- **`deviceUid` é um UUID gerado uma vez e persistido**, não o Android ID
  nem o número do chip — evita depender de valores que mudam ou ficam
  indisponíveis conforme o fabricante (docs/database.md#gateway já avisa
  "não confiar só no número do chip").
- Tipo de foreground service é **`specialUse`**, não `dataSync` — o
  Android 14+ limita `dataSync` a 6h/dia, incompatível com um gateway que
  precisa ficar sempre ativo.
- **Timeout de confirmação do SMS é tratado como sucesso, não falha**
  (`SmsSender.kt`). Confirmado em teste real num Redmi/HyperOS: a ROM
  intercepta a entrega do `sentIntent` do `SmsManager` para apps de
  terceiro através de um mecanismo próprio (visível em `dumpsys activity
  broadcasts` como `com.anrdoid.internal.action.SEND_SMS_RESULT_EVENT`) —
  o broadcast de confirmação às vezes nunca chega ao app **mesmo o SMS
  tendo sido realmente enviado e entregue**. Reportar `/failed` nesse caso
  faz o backend reabrir o `Command` pra retry e reenviar o **mesmo SMS de
  novo**, duplicando a mensagem para o destinatário real — um efeito
  colateral pior do que assumir sucesso sem confirmação do rádio. Isso foi
  reproduzido e corrigido em produção: duas tentativas com o código antigo
  geraram SMS duplicado de verdade antes da correção.

## Ainda não implementado / próximos passos

- Tela dedicada para trocar o intervalo de polling/heartbeat (hoje fixo em
  código: 5s / 30s, iguais aos padrões da documentação).
- Testes instrumentados (docs/testing.md#android-fase-7 lista o que cobrir:
  autenticação, polling, envio, recebimento, retry, reconexão, heartbeat,
  armazenamento local) — nenhum teste automatizado foi escrito ainda.
- Envio de SMS confirmado manualmente em produção (device de teste →
  número real). Falta testar o ciclo completo com um equipamento de
  verdade respondendo por SMS (confirmação via `SmsReceiver` →
  `CONFIRMED`), que é o cenário crítico de ponta a ponta do MVP
  (docs/testing.md#cenário-crítico-de-ponta-a-ponta).
