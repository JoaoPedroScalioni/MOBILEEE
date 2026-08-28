import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

// ROOT LAYOUT: É o arquivo de layout principal do seu aplicativo.
// Ele controla a navegação raiz (o que aparece por cima de tudo).

export const unstable_settings = {
  anchor: '(drawer)', // Define que a navegação inicial deve se ancorar na pasta (drawer)
};

export default function RootLayout() {
  return (
    <>
    {/* O Stack.Screen gerencia uma "pilha" de telas. 
        Se o professor pedir para adicionar uma nova tela antes do login (ex: SplashScreen),
        você criaria o arquivo splash.tsx na pasta app e adicionaria um <Stack.Screen name="splash" /> aqui.
    */}
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen name="index" /> {/* A tela principal de login */}
      <Stack.Screen name="(drawer)" /> {/* O menu lateral (gaveta) */}
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
    <StatusBar style="auto" />
    </>
  );
}
