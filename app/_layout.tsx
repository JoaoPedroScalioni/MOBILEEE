import 'react-native-gesture-handler';
import React, { Component, ErrorInfo, ReactNode, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { LogBox, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/src/adapters/auth/AuthContext';
import { DatabaseClient } from '@/src/infra/sqlite/DatabaseClient';

LogBox.ignoreLogs([
  'google places autocomplete',
  'GooglePlacesAutocomplete',
  'You must use an API key to authenticate each request to Google Maps Platform APIs',
  "Codegen didn't run for REASharedTransitionBoundaryView",
  'REASharedTransitionBoundaryView',
]);

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado ao carregar o aplicativo.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>SafraCafé — Recuperação</Text>
          <Text style={styles.errorText}>{this.state.errorMessage}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => this.setState({ hasError: false, errorMessage: '' })}
          >
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(drawer)" />
      <Stack.Screen name="trabalhador/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: 'modal', title: 'Central de Sincronização' }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    DatabaseClient.getInstance().init().catch(() => {});

    async function aplicarAtualizacaoOTASeDisponivel() {
      if (__DEV__) return;
      try {
        const Updates = await import('expo-updates');
        if (!Updates.isEnabled) return;
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // Continua normalmente quando offline
      }
    }

    aplicarAtualizacaoOTASeDisponivel();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppErrorBoundary>
        <AuthProvider>
          <SafeAreaProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </SafeAreaProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9ff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
