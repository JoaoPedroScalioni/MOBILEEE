import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function MapaLavoura() {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={56} color="#2d6a4f" />
      <Text style={styles.title}>Mapa não disponível no navegador</Text>
      <Text style={styles.subtitle}>
        O mapa com rotas, markers e direções usa módulos nativos (react-native-maps).{'\n'}
        Abra o app no Expo Go no seu celular para visualizar a lavoura.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  title: { marginTop: 16, fontSize: 18, fontWeight: 'bold', color: '#1b4332', textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});