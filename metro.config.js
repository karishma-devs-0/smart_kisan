// Metro does not treat .tflite as an asset by default, so `require()`ing a
// model returns nothing and react-native-fast-tflite fails at load with an
// unhelpful error. Registering the extension is what lets the two weed models
// ship inside the APK and run offline.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('tflite');

module.exports = config;
