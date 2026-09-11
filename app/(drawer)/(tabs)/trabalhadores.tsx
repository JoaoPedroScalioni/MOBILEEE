import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Trabalhador } from '@/src/domain/entities/Trabalhador';
import { container } from '@/src/factory/container';

export default function Trabalhadores() {
  const [list, setList] = useState<Trabalhador[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cracha, setCracha] = useState('');
  const [diaria, setDiaria] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      container.listarTrabalhadores.execute().then((res) => {
        if (active) setList(res);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  async function cadastrar() {
    try {
      await container.cadastrarTrabalhador.execute({
        nome,
        cpf,
        cracha,
        diaria: Number(diaria.replace(',', '.')),
      });
      setModalVisivel(false);
      setNome('');
      setCpf('');
      setCracha('');
      setDiaria('');
      const res = await container.listarTrabalhadores.execute();
      setList(res);
      Alert.alert('Sucesso', 'Trabalhador cadastrado!');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível cadastrar.');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trabalhadores</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisivel(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum trabalhador cadastrado.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color="#2d6a4f" />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.nome}</Text>
              <Text style={styles.meta}>
                Crachá {item.cracha} · R$ {item.diaria.valor.toFixed(2)}/dia
              </Text>
              <Text style={styles.meta}>CPF {item.cpf}</Text>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Novo trabalhador</Text>

            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Nome completo" />

            <Text style={styles.label}>CPF (11 dígitos)</Text>
            <TextInput style={styles.input} value={cpf} onChangeText={setCpf} keyboardType="number-pad" placeholder="00000000000" />

            <Text style={styles.label}>Código do crachá (QR Code)</Text>
            <TextInput style={styles.input} value={cracha} onChangeText={setCracha} autoCapitalize="characters" placeholder="EX: TRAB-003" />

            <Text style={styles.label}>Valor da diária (R$)</Text>
            <TextInput style={styles.input} value={diaria} onChangeText={setDiaria} keyboardType="numeric" placeholder="60" />

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
    padding: 14,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e7f3ee',
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