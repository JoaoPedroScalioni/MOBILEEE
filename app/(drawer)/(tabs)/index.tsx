import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trabalhador } from '@/src/domain/entities/Trabalhador';
import { container } from '@/src/factory/container';

type ScreenMode = 'select' | 'scan';

export default function Apontamento() {
  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>([]);
  const [selecionado, setSelecionado] = useState<Trabalhador | null>(null);
  const [litros, setLitros] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mode, setMode] = useState<ScreenMode>('select');
  const [permission, requestPermission] = useCameraPermissions();
  const [salvando, setSalvando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      container.listarTrabalhadores.execute().then((res) => {
        if (active) setTrabalhadores(res);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à sua localização para registrar o balaio.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }
    getCurrentLocation();
  }, []);

  function selecionarPorCracha(codigo: string) {
    const cracha = codigo.trim();
    const trabalhador = trabalhadores.find(
      (t) => t.cracha.toLowerCase() === cracha.toLowerCase(),
    );
    if (trabalhador) {
      setSelecionado(trabalhador);
      setMode('select');
    } else {
      Alert.alert('Não encontrado', `Nenhum trabalhador com o crachá "${cracha}".`);
    }
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    selecionarPorCracha(result.data);
  }

  async function registrar() {
    const litrosNumero = Number(litros.replace(',', '.'));
    if (!selecionado) {
      Alert.alert('Atenção', 'Selecione um trabalhador antes de registrar.');
      return;
    }
    if (!litros || Number.isNaN(litrosNumero) || litrosNumero <= 0) {
      Alert.alert('Atenção', 'Informe a quantidade de litros do balaio.');
      return;
    }
    if (!location) {
      Alert.alert('Aguarde', 'Ainda estamos obtendo sua localização. Tente novamente em instantes.');
      return;
    }

    setSalvando(true);
    try {
      await container.registrarApontamento.execute({
        trabalhadorId: selecionado.id,
        litros: litrosNumero,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLitros('');
      setSelecionado(null);
      Alert.alert('Sucesso', 'Balaio registrado com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível registrar o balaio.');
    } finally {
      setSalvando(false);
    }
  }

  if (mode === 'scan') {
    if (!permission) {
      return <View style={styles.container} />;
    }
    if (!permission.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="qr-code-outline" size={64} color="#666" />
          <Text style={styles.permissionText}>Precisamos de acesso à câmera para ler o crachá.</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Conceder permissão</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('select')}>
            <Text style={styles.backLink}>Cancelar e voltar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.qrOverlay}>
          <View style={styles.qrFrame} />
          <Text style={styles.qrHint}>Aponte para o QR Code do crachá</Text>
        </View>
        <View style={styles.topLeft}>
          <TouchableOpacity style={styles.iconButton} onPress={() => setMode('select')}>
            <Ionicons name="arrow-back-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar Apontamento</Text>
      <Text style={styles.subtitle}>Selecione o trabalhador e informe os litros do balaio.</Text>

      <View style={styles.workerRow}>
        <View style={styles.workerInfo}>
          <Text style={styles.label}>Trabalhador</Text>
          <Text style={styles.workerName}>{selecionado ? selecionado.nome : 'Nenhum selecionado'}</Text>
          {selecionado && (
            <Text style={styles.workerMeta}>
              Crachá {selecionado.cracha} · Diária {selecionado.diaria.formatar()}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={() => setMode('scan')}>
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Ler crachá</Text>
        </TouchableOpacity>
      </View>

      {!selecionado && (
        <View>
          <Text style={styles.label}>Ou escolha manualmente</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {trabalhadores.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={styles.chip}
                onPress={() => setSelecionado(t)}
              >
                <Text style={styles.chipText}>{t.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <Text style={styles.label}>Quantidade (litros)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: 45"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={litros}
        onChangeText={setLitros}
      />

      {location && (
        <Text style={styles.coords}>
          📍 {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.saveButton, salvando && styles.saveButtonDisabled]}
        disabled={salvando}
        onPress={registrar}
      >
        <Text style={styles.saveButtonText}>{salvando ? 'Salvando...' : 'Registrar balaio'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  workerMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  chips: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    backgroundColor: '#e7f3ee',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2d6a4f',
  },
  chipText: {
    color: '#2d6a4f',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  coords: {
    fontSize: 13,
    color: '#2d6a4f',
  },
  saveButton: {
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  permissionText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    color: '#2d6a4f',
    fontWeight: '600',
  },
  topLeft: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 50,
  },
  qrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFrame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
  },
  qrHint: {
    color: '#fff',
    marginTop: 20,
    fontSize: 15,
    fontWeight: '500',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
});