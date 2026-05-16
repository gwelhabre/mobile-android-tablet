const fs = require('fs');

// 1. Patch android/build.gradle to use installed NDK 27.
//    RN 0.81 ships this NDK by default, but pin it explicitly so a stale
//    android/ folder generated against an older RN still builds.
const buildGradle = 'android/build.gradle';
if (fs.existsSync(buildGradle)) {
  let c = fs.readFileSync(buildGradle, 'utf8');
  const before = c;
  c = c.replace(/ndkVersion\s*=\s*"[^"]+"/g, 'ndkVersion = "27.1.12297006"');
  if (c !== before) {
    fs.writeFileSync(buildGradle, c);
    console.log('patch-ndk: ndkVersion patched to 27.1.12297006');
  } else {
    console.log('patch-ndk: ndkVersion already correct');
  }
}

// 2. Delete reanimated CMake build cache so any flag changes take effect on next build
//    (The .cxx dir lives inside node_modules and persists across android/ folder deletions)
const cxxCache = 'node_modules/react-native-reanimated/android/.cxx';
if (fs.existsSync(cxxCache)) {
  fs.rmSync(cxxCache, { recursive: true, force: true });
  console.log('patch-ndk: cleared reanimated CMake build cache (.cxx)');
}
