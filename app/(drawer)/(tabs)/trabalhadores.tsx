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
  const [busca, setBusca] = useState('');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [trabalhadorEmEdicao, setTrabalhadorEmEdicao] = useState<Trabalhador | null>(null);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cracha, setCracha] = useState('');
  const [diaria, setDiaria] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregarTrabalhadores = useCallback(async () => {
    try {
      const res = await container.listarTrabalhadores.execute();
      setList(res);
    } catch (err) {
      console.error('Erro ao listar trabalhadores:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      carregarTrabalhadores();
      return () => {
        active = false;
      };
    }, [carregarTrabalhadores]),
  );

  function abrirModalCadastro() {
    setTrabalhadorEmEdicao(null);
    setNome('');
    setCpf('');
    setCracha('');
    setDiaria('');
    setModalVisivel(true);
  }

  function abrirModalEdicao(item: Trabalhador) {
    setTrabalhadorEmEdicao(item);
    setNome(item.nome);
    setCpf(item.cpf);
    setCracha(item.cracha);
    setDiaria(String(item.diaria.valor));
    setModalVisivel(true);
  }

  async function salvar() {
    const valorDiaria = Number(diaria.replace(',', '.'));
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Informe o nome do trabalhador.');
      return;
    }
    if (!cracha.trim()) {
      Alert.alert('Atenção', 'Informe o código do crachá.');
      return;
    }
    if (Number.isNaN(valorDiaria) || valorDiaria < 0) {
      Alert.alert('Atenção', 'Informe um valor de diária válido.');
      return;
    }

    setSalvando(true);
    try {
      if (trabalhadorEmEdicao) {
        // Modo Edição
        await container.editarTrabalhador.execute({
          id: trabalhadorEmEdicao.id,
          nome,
          cracha,
          diaria: valorDiaria,
        });
        Alert.alert('Sucesso', 'Trabalhador atualizado com sucesso!');
      } else {
        // Modo Cadastro
        if (!cpf.trim() || cpf.replace(/\D/g, '').length !== 11) {
          Alert.alert('Atenção', 'O CPF deve conter exatamente 11 dígitos numéricos.');
          setSalvando(false);
          return;
        }

        await container.cadastrarTrabalhador.execute({
          nome,
          cpf: cpf.replace(/\D/g, ''),
          cracha,
          diaria: valorDiaria,
        });
        Alert.alert('Sucesso', 'Trabalhador cadastrado com sucesso!');
      }

      setModalVisivel(false);
      await carregarTrabalhadores();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(item: Trabalhador) {
    Alert.alert(
      'Excluir Trabalhador',
      `Deseja realmente remover ${item.nome}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await container.excluirTrabalhador.execute({ id: item.id });
              await carregarTrabalhadores();
              Alert.alert('Sucesso', `${item.nome} foi removido.`);
            } catch (err) {
              Alert.alert('Erro', err instanceof Error ? err.message : 'Não foi possível excluir.');
            }
          },
        },
      ],
    );
  }

  const trabalhadoresFiltrados = list.filter((t) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return (
      t.nome.toLowerCase().includes(termo) ||
      t.cracha.toLowerCase().includes(termo) ||
      t.cpf.includes(termo)
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Trabalhadores</Text>
          <Text style={styles.subtitle}>{list.length} cadastrados</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={abrirModalCadastro}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou crachá..."
          placeholderTextColor="#999"
          value={busca}
          onChangeText={setBusca}
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={trabalhadoresFiltrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#bbb" />
            <Text style={styles.empty}>
              {busca ? 'Nenhum trabalhador encontrado na busca.' : 'Nenhum trabalhador cadastrado ainda.'}
            </Text>
            {!busca && (
              <TouchableOpacity style={styles.emptyAddButton} onPress={abrirModalCadastro}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.emptyAddButtonText}>Cadastrar Trabalhador</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color="#2d6a4f" />
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>{item.nome}</Text>
              <Text style={styles.meta}>
                Crachá {item.cracha} · {item.diaria.formatar()}/dia
              </Text>
              <Text style={styles.cpf}>CPF {item.cpf}</Text>
            </View>

            {/* Ações: Editar e Excluir */}
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtnEdit}
                onPress={() => abrirModalEdicao(item)}
                accessibilityLabel={`Editar ${item.nome}`}
              >
                <Ionicons name="pencil" size={18} color="#2d6a4f" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnDelete}
                onPress={() => confirmarExclusao(item)}
                accessibilityLabel={`Excluir ${item.nome}`}
              >
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal de Cadastro / Edição */}
      <Modal visible={modalVisivel} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {trabalhadorEmEdicao ? 'Editar Trabalhador' : 'Novo Trabalhador'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisivel(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex.: Sebastião Silva"
            />

            {!trabalhadorEmEdicao && (
              <>
                <Text style={styles.label}>CPF (11 dígitos numéricos)</Text>
                <TextInput
                  style={styles.input}
                  value={cpf}
                  onChangeText={setCpf}
                  keyboardType="number-pad"
                  maxLength={11}
                  placeholder="00000000000"
                />
              </>
            )}

            <Text style={styles.label}>Código do Crachá (QR Code)</Text>
            <TextInput
              style={styles.input}
              value={cracha}
              onChangeText={setCracha}
              autoCapitalize="characters"
              placeholder="Ex.: TRAB-005"
            />

            <Text style={styles.label}>Valor da Diária (R$)</Text>
            <TextInput
              style={styles.input}
              value={diaria}
              onChangeText={setDiaria}
              keyboardType="numeric"
              placeholder="Ex.: 60"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisivel(false)}
                disabled={salvando}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, salvando && styles.buttonDisabled]}
                onPress={salvar}
                disabled={salvando}
              >
                <Text style={styles.confirmButtonText}>
                  {salvando ? 'Salvando...' : trabalhadorEmEdicao ? 'Atualizar' : 'Cadastrar'}
                </Text>
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
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#2d6a4f',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    color: '#444',
    marginTop: 2,
    fontWeight: '500',
  },
  cpf: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnEdit: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e7f3ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDelete: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    gap: 12,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
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
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  emptyAddButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d6a4f',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  emptyAddButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});