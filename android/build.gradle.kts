plugins {
    // AGP 9+ tem suporte a Kotlin embutido — o plugin org.jetbrains.kotlin.android
    // não é mais necessário nem aceito lado a lado (https://kotl.in/gradle/agp-built-in-kotlin).
    id("com.android.application") version "9.4.0" apply false
}
