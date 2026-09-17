const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const b64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const bufPng = Buffer.from(b64Png, 'base64');

const xmlArrowRight = '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:fillColor="#FFFFFFFF" android:pathData="M8.59,16.59L13.17,12L8.59,7.41L10,6l6,6l-6,6L8.59,16.59z"/></vector>';
const xmlCheckmark = '<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:fillColor="#FFFFFFFF" android:pathData="M9,16.17L4.83,12l-1.42,1.41L9,19 21,7l-1.41-1.41z"/></vector>';

const baseAssets = [
  'arrow_down.png',
  'error.png',
  'file.png',
  'forward.png',
  'logotype.png',
  'pkg.png',
  'sitemap.png',
  'unmatched.png'
];

// 1. Base assets in assets/expo-router and node_modules/expo-router/assets
const expoRouterAssets = path.join(rootDir, 'node_modules', 'expo-router', 'assets');
const localAssets = path.join(rootDir, 'assets', 'expo-router');
fs.mkdirSync(expoRouterAssets, { recursive: true });
fs.mkdirSync(localAssets, { recursive: true });

baseAssets.forEach(file => {
  fs.writeFileSync(path.join(expoRouterAssets, file), bufPng);
  fs.writeFileSync(path.join(localAssets, file), bufPng);
});

// 2. XML assets
fs.writeFileSync(path.join(expoRouterAssets, 'arrow_right.xml'), xmlArrowRight);
fs.writeFileSync(path.join(expoRouterAssets, 'checkmark.xml'), xmlCheckmark);
fs.writeFileSync(path.join(localAssets, 'arrow_right.xml'), xmlArrowRight);
fs.writeFileSync(path.join(localAssets, 'checkmark.xml'), xmlCheckmark);

// 3. Link image asset
const linkAssets = path.join(rootDir, 'node_modules', 'expo-router', 'build', 'link', 'assets');
fs.mkdirSync(linkAssets, { recursive: true });
fs.writeFileSync(path.join(linkAssets, 'image.png'), bufPng);

// 4. Drawer toggle icon
const drawerIconSrc = path.join(rootDir, 'node_modules', '@react-navigation', 'drawer', 'lib', 'module', 'views', 'assets', 'toggle-drawer-icon.png');
if (fs.existsSync(drawerIconSrc)) {
  const drawerDest1 = path.join(expoRouterAssets, 'react-navigation', 'drawer', 'toggle-drawer-icon.png');
  const drawerDest2 = path.join(localAssets, 'react-navigation', 'drawer', 'toggle-drawer-icon.png');
  fs.mkdirSync(path.dirname(drawerDest1), { recursive: true });
  fs.mkdirSync(path.dirname(drawerDest2), { recursive: true });
  fs.copyFileSync(drawerIconSrc, drawerDest1);
  fs.copyFileSync(drawerIconSrc, drawerDest2);
}

// 5. Elements assets
const elementsSrcDir = path.join(rootDir, 'node_modules', '@react-navigation', 'elements', 'lib', 'module', 'assets');
if (fs.existsSync(elementsSrcDir)) {
  const elementsDest1 = path.join(expoRouterAssets, 'react-navigation', 'elements');
  const elementsDest2 = path.join(localAssets, 'react-navigation', 'elements');
  fs.mkdirSync(elementsDest1, { recursive: true });
  fs.mkdirSync(elementsDest2, { recursive: true });
  const files = fs.readdirSync(elementsSrcDir);
  files.forEach(f => {
    fs.copyFileSync(path.join(elementsSrcDir, f), path.join(elementsDest1, f));
    fs.copyFileSync(path.join(elementsSrcDir, f), path.join(elementsDest2, f));
  });
}

// 6. Fix react-native-reanimated
const reanimatedDir = path.join(rootDir, 'node_modules', 'react-native-reanimated');
if (fs.existsSync(reanimatedDir)) {
  const reanimatedSrcIndex = path.join(reanimatedDir, 'src', 'index.js');
  fs.mkdirSync(path.dirname(reanimatedSrcIndex), { recursive: true });
  fs.writeFileSync(reanimatedSrcIndex, "module.exports = require('../lib/module/index.js');\n");

  const reanimatedPkgPath = path.join(reanimatedDir, 'package.json');
  if (fs.existsSync(reanimatedPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(reanimatedPkgPath, 'utf8'));
    pkg['react-native'] = 'lib/module/index';
    pkg['source'] = 'lib/module/index';
    fs.writeFileSync(reanimatedPkgPath, JSON.stringify(pkg, null, 2));
  }

  const boundaryFile = path.join(reanimatedDir, 'lib', 'module', 'specs', 'SharedTransitionBoundaryNativeComponent.js');
  fs.mkdirSync(path.dirname(boundaryFile), { recursive: true });
  fs.writeFileSync(boundaryFile, `'use strict';
import { View } from 'react-native';
import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';

let Component;
try {
  Component = codegenNativeComponent('REASharedTransitionBoundaryView');
} catch (e) {
  Component = View;
}

export default Component;
`);
}

console.log('Patch completed successfully!');
