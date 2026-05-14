const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withExpoUpdatesKotlinFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const gradlePluginPath = path.join(
        config.modRequest.projectRoot,
        'node_modules/expo-updates/expo-updates-gradle-plugin/build.gradle.kts'
      );
      if (fs.existsSync(gradlePluginPath)) {
        let content = fs.readFileSync(gradlePluginPath, 'utf8');
        const patched = content.replace(
          /kotlin\("jvm"\)\s*version\("[^"]+"\)/g,
          'kotlin("jvm") version("2.1.20")'
        );
        if (patched !== content) {
          fs.writeFileSync(gradlePluginPath, patched);
          console.log('[withExpoUpdatesKotlinFix] ✅ Patched expo-updates-gradle-plugin Kotlin → 2.1.20');
        } else {
          console.log('[withExpoUpdatesKotlinFix] Already patched or pattern not found');
        }
      } else {
        console.log('[withExpoUpdatesKotlinFix] build.gradle.kts not found — skipping');
      }
      return config;
    },
  ]);
};
