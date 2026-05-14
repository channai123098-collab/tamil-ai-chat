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
      if (!fs.existsSync(gradlePluginPath)) {
        console.log('[withExpoUpdatesKotlinFix] build.gradle.kts not found — skipping');
        return config;
      }

      let content = fs.readFileSync(gradlePluginPath, 'utf8');

      content = content.replace(
        /kotlin\("jvm"\)\s*version\("[^"]+"\)/g,
        'kotlin("jvm") version("2.1.20")'
      );

      content = content.replace(
        /implementation\("com\.facebook\.react:react-native-gradle-plugin(?::[^"]*)?"[)]/g,
        'compileOnly("com.facebook.react:react-native-gradle-plugin:0.81.5")'
      );

      fs.writeFileSync(gradlePluginPath, content);
      console.log('[withExpoUpdatesKotlinFix] ✅ Kotlin→2.1.20 + RN plugin→compileOnly:0.81.5');
      return config;
    },
  ]);
};
