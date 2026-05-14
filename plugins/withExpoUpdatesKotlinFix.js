const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// Stub ExpoUpdatesPlugin - no-op, avoids all dependency issues
const STUB_PLUGIN_KT = `package expo.modules.updates

import org.gradle.api.Plugin
import org.gradle.api.Project

class ExpoUpdatesPlugin : Plugin<Project> {
  override fun apply(project: Project) {
    // Stub: expo-updates OTA handled via JS runtime
  }
}
`;

const STUB_BUILD_GRADLE = `plugins {
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

module.exports = function withExpoUpdatesKotlinFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const root = config.modRequest.projectRoot;
      const pluginDir = path.join(root, 'node_modules/expo-updates/expo-updates-gradle-plugin');

      if (!fs.existsSync(pluginDir)) {
        console.log('[withExpoUpdatesKotlinFix] expo-updates-gradle-plugin not found — skipping');
        return config;
      }

      // Replace build.gradle.kts with stub (no react-native-gradle-plugin dep)
      fs.writeFileSync(path.join(pluginDir, 'build.gradle.kts'), STUB_BUILD_GRADLE);

      // Replace ExpoUpdatesPlugin.kt with no-op stub
      const ktDir = path.join(pluginDir, 'src/main/kotlin/expo/modules/updates');
      fs.mkdirSync(ktDir, { recursive: true });
      // Remove all existing kt files first
      fs.readdirSync(ktDir).forEach(f => {
        if (f.endsWith('.kt')) fs.unlinkSync(path.join(ktDir, f));
      });
      fs.writeFileSync(path.join(ktDir, 'ExpoUpdatesPlugin.kt'), STUB_PLUGIN_KT);

      console.log('[withExpoUpdatesKotlinFix] ✅ Replaced expo-updates-gradle-plugin with no-op stub');
      return config;
    },
  ]);
};
