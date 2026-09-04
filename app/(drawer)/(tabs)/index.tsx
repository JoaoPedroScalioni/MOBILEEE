import { CameraType, CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { container } from '@/src/fectorie/container';

// Modos de operação da tela
type ScreenMode = 'camera' | 'qrcode' | 'preview';

export default function Camera() {
  // --- Estados ---
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<ScreenMode>('camera');
  const [qrResult, setQrResult] = useState<string | null>(null);

  // Ref para controlar a câmera (tirar foto)
  const cameraRef = useRef<CameraView>(null);

  // --- Permissão de localização ao abrir a tela ---
  useEffect(() => {
    async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à sua localização para salvar a observação.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }
    getCurrentLocation();
  }, []);

  // --- Guarda de permissão da câmera ---
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#666" />
        <Text style={styles.permissionText}>Precisamos de acesso à câmera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Conceder permissão</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- Ações ---

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      const foto = await cameraRef.current.takePictureAsync();
      if (foto?.uri) {
        setUri(foto.uri);
        setMode('preview');
      }
    }
  }

  // Abre a galeria do dispositivo via expo-image-picker
  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à sua galeria de fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setUri(result.assets[0].uri);
      setMode('preview');
    }
  }

  // Salva a foto capturada (câmera ou galeria) + localização
  async function savePhoto() {
    if (!uri) return;

    if (!location) {
      Alert.alert('Aguarde', 'Ainda estamos obtendo sua localização. Tente novamente em instantes.');
      return;
    }

    try {
      await container.registerObservation.execute({
        photo: uri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setUri(null);
      setMode('camera');
      Alert.alert('Sucesso', 'Observação salva com sucesso!');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a observação.');
    }
  }

  function cancelPreview() {
    setUri(null);
    setMode('camera');
  }

  // Chamado pelo scanner do QR Code quando detecta um código
  function handleBarcodeScanned(result: BarcodeScanningResult) {
    setQrResult(result.data);
    setMode('camera'); // Volta para câmera normal após leitura
    Alert.alert('QR Code detectado', result.data, [
      { text: 'OK' },
      { text: 'Copiar', onPress: () => {} }, // placeholder para Clipboard
    ]);
  }

  function enterQrMode() {
    setQrResult(null);
    setMode('qrcode');
  }

  function exitQrMode() {
    setMode('camera');
  }

  // --- Renders por modo ---

  // Modo PRÉVIA: exibe a foto capturada/selecionada com opções de salvar ou cancelar
  if (mode === 'preview' && uri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />

        {/* Badge informativo de localização */}
        <View style={styles.locationBadge}>
          <Ionicons name="location-outline" size={14} color="#fff" />
          <Text style={styles.locationText}>
            {location
              ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
              : 'Obtendo localização…'}
          </Text>
        </View>

        {/* Botão Salvar */}
        <View style={styles.previewSave}>
          <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={savePhoto}>
            <Ionicons name="checkmark-outline" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        {/* Botão Cancelar */}
        <View style={styles.previewCancel}>
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={cancelPreview}>
            <Ionicons name="close-outline" size={22} color="#fff" />
            <Text style={styles.actionButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Modo QR CODE: câmera com barcode scanner ativo e overlay visual
  if (mode === 'qrcode') {
    return (
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />

        {/* Overlay com moldura do QR */}
        <View style={styles.qrOverlay}>
          <View style={styles.qrFrame} />
          <Text style={styles.qrHint}>Aponte para um QR Code</Text>
        </View>

        {/* Botão voltar */}
        <View style={styles.topLeft}>
          <TouchableOpacity style={styles.iconButton} onPress={exitQrMode}>
            <Ionicons name="arrow-back-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Modo CÂMERA (padrão)
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />

      {/* Botão virar câmera — canto superior direito */}
      <View style={styles.topRight}>
        <TouchableOpacity style={styles.iconButton} onPress={toggleCameraFacing}>
          <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Botão QR Code — canto superior esquerdo */}
      <View style={styles.topLeft}>
        <TouchableOpacity style={styles.iconButton} onPress={enterQrMode}>
          <Ionicons name="qr-code-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Barra inferior: galeria | capturar */}
      <View style={styles.bottomBar}>
        {/* Galeria */}
        <TouchableOpacity style={styles.sideButton} onPress={pickFromLibrary}>
          <Ionicons name="images-outline" size={30} color="#fff" />
          <Text style={styles.sideButtonText}>Galeria</Text>
        </TouchableOpacity>

        {/* Botão principal de captura */}
        <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        {/* Espaço reservado para simetria */}
        <View style={styles.sideButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },

  // --- Permissão ---
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#f5f5f5',
  },
  permissionText: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // --- Botões de posição fixa ---
  topRight: {
    position: 'absolute',
    top: 50,
    right: 20,
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

  // --- Barra inferior ---
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 110,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  sideButton: {
    width: 70,
    alignItems: 'center',
  },
  sideButtonText: {
    color: '#fff',
    fontSize: 11,
    marginTop: 4,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },

  // --- Prévia ---
  previewImage: {
    flex: 1,
  },
  locationBadge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    color: '#fff',
    fontSize: 13,
  },
  previewSave: {
    position: 'absolute',
    bottom: 40,
    right: 30,
  },
  previewCancel: {
    position: 'absolute',
    bottom: 40,
    left: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  saveButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // --- QR Code ---
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
    backgroundColor: 'transparent',
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
