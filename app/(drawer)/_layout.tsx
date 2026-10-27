import { Drawer } from 'expo-router/drawer';
import { Alert, TouchableOpacity, LogBox, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/adapters/auth/AuthContext';

LogBox.ignoreLogs([
  "Codegen didn't run for REASharedTransitionBoundaryView",
  'REASharedTransitionBoundaryView',
]);

export default function DrawerLayout() {
  const { logout } = useAuth();

  const confirmarLogout = () => {
    Alert.alert('Sair da Conta', 'Deseja realmente sair do SafraCafé?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <Drawer
      screenOptions={{
        headerTintColor: '#1a1a1a',
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, gap: 4 }}>
            <TouchableOpacity
              onPress={() => router.push('/modal')}
              style={{ padding: 6 }}
              accessibilityLabel="Central de Sincronização e Nuvem"
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#2d6a4f" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={confirmarLogout}
              style={{ padding: 6 }}
              accessibilityLabel="Sair da Conta"
            >
              <Ionicons name="log-out-outline" size={24} color="#dc2626" />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Painel',
          title: 'SafraCafé',
        }}
      />
    </Drawer>
  );
}
