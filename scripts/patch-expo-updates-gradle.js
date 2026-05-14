const fs = require('fs');
const path = require('path');

const gradleFile = path.join(
  __dirname, '..', 'node_modules', 'expo-updates',
  'expo-updates-gradle-plugin', 'build.gradle.kts'
);

if (!fs.existsSync(gradleFile)) {
  console.log('patch-expo-updates: file not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(gradleFile, 'utf8');

// Patch Kotlin version from 1.9.x to 2.1.20
const patched = content.replace(
  /kotlin\("jvm"\)\s+version\("1\.\d+\.\d+"\)/,
  'kotlin("jvm") version("2.1.20")'
);

if (patched === content) {
  console.log('patch-expo-updates: already patched or pattern not found');
} else {
  fs.writeFileSync(gradleFile, patched, 'utf8');
  console.log('patch-expo-updates: ✅ Kotlin 1.9.x → 2.1.20 in expo-updates-gradle-plugin');
}
