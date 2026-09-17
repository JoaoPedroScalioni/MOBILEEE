const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver?.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('expo-router/assets/')) {
    const assetName = moduleName.replace('expo-router/assets/', '');
    const localAssetPath = path.resolve(__dirname, 'assets/expo-router', assetName);
    if (fs.existsSync(localAssetPath)) {
      return {
        filePath: localAssetPath,
        type: 'sourceFile',
      };
    }
  }

  if (moduleName === 'react-native-reanimated') {
    const reanimatedEntry = path.resolve(__dirname, 'node_modules/react-native-reanimated/lib/module/index.js');
    if (fs.existsSync(reanimatedEntry)) {
      return {
        filePath: reanimatedEntry,
        type: 'sourceFile',
      };
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;