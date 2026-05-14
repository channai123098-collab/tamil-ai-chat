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

// Fix 1: Kotlin JVM version → 2.1.20 (matches EAS server Kotlin)
content = content.replace(
  /kotlin\("jvm"\)\s*version\("[^"]+"\)/g,
  'kotlin("jvm") version("2.1.20")'
);

// Fix 2: react-native-gradle-plugin: no version + wrong scope → compileOnly with version
content = content.replace(
  /implementation\("com\.facebook\.react:react-native-gradle-plugin(?::[^"]*)?"[)]/g,
  'compileOnly("com.facebook.react:react-native-gradle-plugin:0.81.5")'
);

fs.writeFileSync(gradleFile, content, 'utf8');
console.log('patch-expo-updates: ✅ Kotlin→2.1.20, RN plugin→compileOnly:0.81.5');
