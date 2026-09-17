import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/src/adapters/auth/AuthContext';

LogBox.ignoreLogs([
  'google places autocomplete',
  'GooglePlacesAutocomplete',
  'You must use an API key to authenticate each request to Google Maps Platform APIs',
  "Codegen didn't run for REASharedTransitionBoundaryView",
  'REASharedTransitionBoundaryView',
]);

export const unstable_settings = {
  anchor: '(drawer)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(drawer)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </AuthProvider>
  );
}