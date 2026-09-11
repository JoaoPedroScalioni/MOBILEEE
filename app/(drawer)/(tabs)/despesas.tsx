import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIAS_DESPESA, Despesa } from '@/src/domain/entities/Despesa';
import { container } from '@/src/factory/container';

export default function Despesas() {
  const [list, setList] = useState<Despesa[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [categoria, setCategoria] = useState<string>('Insumos');
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      container.listarDespesas.execute().then((res) => {
        if (active) setList(res);
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
        Alert.alert('Permissão negada', 'Precisamos de acesso à sua localização para registrar a despesa.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }
    getCurrentLocation();
  }, []);

  async function tirarFoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à câmera para fotografar o recibo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setFotoUri(result.assets[0].uri);
    }
  }

  async function cadastrar() {
    const valorNumero = Number(valor.replace(',', '.'));
    if (!descricao.trim() || Number.isNaN(valorNumero) || valorNumero < 0) {
      Alert.alert('Atenção', 'Informe descrição e valor válidos.');
      return;
    }
    if (!location) {
      Alert.alert('Aguarde', 'Ainda estamos obtendo sua localização. Tente novamente em instantes.');
      return;
    }

    try {
      await container.registrarDespesa.execute({
        descricao,
        valor: valorNumero,
        categoria: categoria as Despesa['categoria'],
        fotoUri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setModalVisivel(false);
      setDescricao('');
      setValor('');
      setFotoUri(null);
      const res = await container.listarDespesas.execute();
      setList(res);
      Alert.alert('Sucesso', 'Despesa registrada!');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível registrar.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Despesas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisivel(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma despesa registrada.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.fotoUri ? (
              <Image source={{ uri: item.fotoUri }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="receipt-outline" size={22} color="#2d6a4f" />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.descricao}</Text>
              <Text style={styles.meta}>
                {item.categoria} · {item.valor.formatar()}
              </Text>
              <Text style={styles.meta}>
                {new Date(item.data).toLocaleDateString('pt-BR')} ·{' '}
                {item.coordenadas.latitude.toFixed(4)}, {item.coordenadas.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova despesa</Text>

            <Text style={styles.label}>Descrição</Text>
            <TextInput style={styles.input} value={descricao} onChangeText={setDescricao} placeholder="Ex.: óleo diesel" />

            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput style={styles.input} value={valor} onChangeText={setValor} keyboardType="numeric" placeholder="150,00" />

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoryRow}>
              {CATEGORIAS_DESPESA.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.categoryChip, categoria === c && styles.categoryChipActive]}
                  onPress={() => setCategoria(c)}
                >
                  <Text style={[styles.categoryText, categoria === c && styles.categoryTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.photoButton} onPress={tirarFoto}>
              <Ionicons name={fotoUri ? 'checkmark-circle-outline' : 'camera-outline'} size={20} color="#2d6a4f" />
              <Text style={styles.photoButtonText}>
                {fotoUri ? 'Recibo anexado' : 'Fotografar recibo'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisivel(false)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={cadastrar}>
                <Text style={styles.confirmButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    backgroundColor: '#2d6a4f',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#e7f3ee',
  },
  thumbPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  meta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
  },
  categoryChipActive: {
    borderColor: '#2d6a4f',
    backgroundColor: '#e7f3ee',
  },
  categoryText: {
    color: '#555',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#2d6a4f',
    fontWeight: '600',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2d6a4f',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    color: '#2d6a4f',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});