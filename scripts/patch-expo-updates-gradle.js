const fs = require('fs');
const path = require('path');

const pluginDir = path.join(
  __dirname, '..', 'node_modules', 'expo-updates', 'expo-updates-gradle-plugin'
);

if (!fs.existsSync(pluginDir)) {
  console.log('patch-expo-updates: plugin dir not found, skipping');
  process.exit(0);
}

// Stub build.gradle.kts — no react-native-gradle-plugin, no AGP dependency issues
const stubBuildGradle = `plugins {
  kotlin("jvm") version("2.1.20")
  id("java-gradle-plugin")
}

repositories {
  google()
  mavenCentral()
}

dependencies {
  implementation(gradleApi())
}

java {
  sourceCompatibility = JavaVersion.VERSION_11
  targetCompatibility = JavaVersion.VERSION_11
}

group = "expo.modules"

gradlePlugin {
  plugins {
    register("expoUpdatesPlugin") {
      id = "expo-updates-gradle-plugin"
      implementationClass = "expo.modules.updates.ExpoUpdatesPlugin"
    }
  }
}
`;

const stubPluginKt = `package expo.modules.updates

import org.gradle.api.Plugin
import org.gradle.api.Project

class ExpoUpdatesPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    // Stub: expo-updates OTA handled via JS runtime
  }
}
`;

// Write stub build.gradle.kts
fs.writeFileSync(path.join(pluginDir, 'build.gradle.kts'), stubBuildGradle);

// Write stub ExpoUpdatesPlugin.kt
const ktDir = path.join(pluginDir, 'src/main/kotlin/expo/modules/updates');
fs.mkdirSync(ktDir, { recursive: true });
// Remove all old kt files
fs.readdirSync(ktDir).forEach(f => {
  if (f.endsWith('.kt')) fs.unlinkSync(path.join(ktDir, f));
});
fs.writeFileSync(path.join(ktDir, 'ExpoUpdatesPlugin.kt'), stubPluginKt);

console.log('patch-expo-updates: ✅ Replaced expo-updates-gradle-plugin with no-op stub (Kotlin 2.1.20, no RN dep)');
