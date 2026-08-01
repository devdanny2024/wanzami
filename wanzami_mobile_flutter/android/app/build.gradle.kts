plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

import java.util.Properties

android {
    namespace = "tv.wanzami.app"
    // flutter_web_auth_2's androidx.browser dependency requires SDK 36.
    compileSdk = 36
    ndkVersion = "27.0.12077973"

    // Release signing (Play Store)
    val keystoreProperties = Properties()
    val keystorePropertiesFile = rootProject.file("key.properties")
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(keystorePropertiesFile.inputStream())
    }

    signingConfigs {
        create("release") {
            val storeFilePath = keystoreProperties["storeFile"] as String?
            if (storeFilePath != null) {
                storeFile = rootProject.file(storeFilePath)
            }
            storePassword = keystoreProperties["storePassword"] as String?
            keyAlias = keystoreProperties["keyAlias"] as String?
            keyPassword = keystoreProperties["keyPassword"] as String?
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "tv.wanzami.app"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        // Pinned explicitly rather than left on flutter.targetSdkVersion: Google
        // rejected an update because the build resolved to API 35 despite
        // compileSdk already being 36, since CI's Flutter version predates 36
        // becoming that property's default. Pinning removes the dependency on
        // whichever Flutter version happens to build it.
        targetSdk = 36
        versionCode = flutter.versionCode
        versionName = flutter.versionName

        // Restrict ABIs to device-relevant architectures to avoid heavy x86_64 release merges.
        ndk {
            abiFilters += listOf("armeabi-v7a", "arm64-v8a")
        }
    }

    buildTypes {
        release {
            // Use the upload keystore when key.properties is present (Play
            // builds); fall back to debug signing so CI can produce an
            // installable test APK without the keystore.
            signingConfig = if (keystorePropertiesFile.exists()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
    }
}

flutter {
    source = "../.."
}
