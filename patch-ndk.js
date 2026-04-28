const fs = require('fs');
const path = require('path');

// 1. Patch android/build.gradle to use installed NDK 27
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
// (The .cxx dir lives inside node_modules and persists across android/ folder deletions)
const cxxCache = 'node_modules/react-native-reanimated/android/.cxx';
if (fs.existsSync(cxxCache)) {
  fs.rmSync(cxxCache, { recursive: true, force: true });
  console.log('patch-ndk: cleared reanimated CMake build cache (.cxx)');
}

// 3. Patch reanimated source files for NDK 27 clang++ compatibility.
//    These patches add #pragma suppressions so the strict NDK 27 warnings
//    don't become errors via -Werror.

function patchFile(filePath, check, apply) {
  if (!fs.existsSync(filePath)) {
    console.log('patch-ndk: not found:', filePath);
    return;
  }
  let src = fs.readFileSync(filePath, 'utf8');
  if (check(src)) {
    console.log('patch-ndk: already patched:', filePath);
    return;
  }
  fs.writeFileSync(filePath, apply(src));
  console.log('patch-ndk: patched:', filePath);
}

// WorkletRuntimeDecorator.cpp — replace VLA (and any prior pragma attempts)
// with std::vector so the NDK version doesn't matter.
function patchWorkletRuntimeDecorator(src) {
  // Anchor on the unique line just before the VLA block, then capture
  // everything through the matching call() — covering any pragma debris.
  const blockPattern = /(auto argsSize = argsArray\.size\(rt\);[\s\S]*?remoteFun\.asObject\(rt\)\.asFunction\(rt\)\.call\(rt,\s*(?:args,\s*argsSize|args\.data\(\),\s*args\.size\(\)|argsData,\s*args\.size\(\))\);)/;

  const replacement =
    `auto argsSize = argsArray.size(rt);
            std::vector<jsi::Value> args;
            args.reserve(argsSize);
            for (size_t i = 0; i < argsSize; i++) {
              args.emplace_back(argsArray.getValueAtIndex(rt, i));
            }
            const jsi::Value *argsData = args.data();
            remoteFun.asObject(rt).asFunction(rt).call(rt, argsData, args.size());`;

  const next = src.replace(blockPattern, replacement);

  if (next !== src && !next.includes('#include <vector>')) {
    return next.replace(
      /#include "WorkletRuntime\.h"\r?\n/,
      match => `${match}\n#include <vector>\n`
    );
  }

  return next;
}

patchFile(
  'node_modules/react-native-reanimated/Common/cpp/ReanimatedRuntime/WorkletRuntimeDecorator.cpp',
  src => src.includes('const jsi::Value *argsData = args.data()') && src.includes('call(rt, argsData, args.size())'),
  patchWorkletRuntimeDecorator
);

// NativeReanimatedModule.cpp — implicit this capture in [=] lambda [-Wdeprecated-this-capture]
patchFile(
  'node_modules/react-native-reanimated/Common/cpp/NativeModules/NativeReanimatedModule.cpp',
  src => src.includes('Wdeprecated-this-capture'),
  src => '#pragma clang diagnostic ignored "-Wdeprecated-this-capture"\n' + src
);
