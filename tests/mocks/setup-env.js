// Mock for react-native/setup-env which doesn't exist in React Native 0.86+
// This is a no-op mock to satisfy the @react-native/jest-preset moduleNameMapper

// Mock Platform
global.__DEV__ = true;

// Mock Platform.OS
global.Platform = {
  OS: 'ios',
  Version: '15.0',
  select: (obj) => obj.ios || obj.default,
};

// Mock TurboModuleRegistry
global.__turboModuleProxy = {};

// Mock expo-crypto randomUUID
global.crypto = {
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9),
};