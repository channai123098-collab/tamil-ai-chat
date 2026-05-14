const fs = require('fs');
const path = require('path');

const configPath = path.join(
  __dirname, '..', 'node_modules', 'expo-updates', 'expo-module.config.json'
);

if (!fs.existsSync(configPath)) {
  console.log('patch-expo-updates: expo-module.config.json not found — skipping');
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

if (config.android && config.android.gradlePlugins) {
  delete config.android.gradlePlugins;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('patch-expo-updates: ✅ Removed gradlePlugins from expo-updates expo-module.config.json (no includedBuild, no compile error)');
} else {
  console.log('patch-expo-updates: gradlePlugins already absent — nothing to do');
}
