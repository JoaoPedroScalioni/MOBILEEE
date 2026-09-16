module.exports = {
  resolver: {
    alias: {
      '^expo-router/assets/(.*)$': '<rootDir>/assets/images/$1',
    },
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'mp4', 'mov', 'wav', 'mp3', 'm4a', 'caf', 'aac', 'ogg', 'flac', 'wma', 'mid', 'webm', 'tif', 'tiff', 'pdf'],
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  },
};