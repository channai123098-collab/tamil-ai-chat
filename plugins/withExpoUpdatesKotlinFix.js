const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withExpoUpdatesKotlinFix(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const root = config.modRequest.projectRoot;
      const configPath = path.join(
        root, 'node_modules/expo-updates/expo-module.config.json'
      );

      if (!fs.existsSync(configPath)) {
        console.log('[withExpoUpdatesKotlinFix] expo-module.config.json not found — skipping');
        return config;
      }

      const moduleConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      if (moduleConfig.android && moduleConfig.android.gradlePlugins) {
        delete moduleConfig.android.gradlePlugins;
        fs.writeFileSync(configPath, JSON.stringify(moduleConfig, null, 2));
        console.log('[withExpoUpdatesKotlinFix] ✅ Removed gradlePlugins from expo-updates expo-module.config.json — no includedBuild, no Gradle compile error');
      } else {
        console.log('[withExpoUpdatesKotlinFix] gradlePlugins already absent — skipping');
      }

      return config;
    },
  ]);
};
