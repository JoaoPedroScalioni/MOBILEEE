import * as ImagePicker from 'expo-image-picker';
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
import { ValorMonetario } from '@/src/domain/value-objects/ValorMonetario';
import { container } from '@/src/factory/container';
import { triggerAutoSync } from '@/src/shared/utils/autoSync';
import { formatarDataHora, isHoje } from '@/src/shared/utils/dateHelper';
import { LocalReceiptStorage } from '@/src/infra/filesystem/LocalReceiptStorage';
import {
  obterLocalizacaoSegura,
  COORDENADAS_PADRAO_FAZENDA,
  LocationResult,
} from '@/src/shared/utils/locationHelper';

export default function Despesas() {
  const [list, setList] = useState<Despesa[]>([]);
  const [mostrarTodasDespesas, setMostrarTodasDespesas] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [comprovanteAmpliado, setComprovanteAmpliado] = useState<Despesa | null>(null);
  const [locationResult, setLocationResult] = useState<LocationResult>({
    ...COORDENADAS_PADRAO_FAZENDA,
    isFallback: true,
    status: 'fallback',
  });

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
    let active = true;
    container.listarDespesas.execute().then((res) => {
      if (active) setList(res);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    async function carregarLocalizacao() {
      const loc = await obterLocalizacaoSegura(4000);
      setLocationResult(loc);
    }
    carregarLocalizacao();
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
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setFotoUri(uri);
    }
  }

  async function escolherDaGaleria() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à biblioteca de fotos para selecionar o recibo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setFotoUri(uri);
    }
  }

  async function cadastrar() {
    const valorNumero = Number(valor.replace(',', '.'));
    if (!descricao.trim() || Number.isNaN(valorNumero) || valorNumero < 0) {
      Alert.alert('Atenção', 'Informe descrição e valor válidos.');
      return;
    }
    try {
      let finalFotoUri = fotoUri;
      if (fotoUri && fotoUri.startsWith('file://')) {
        finalFotoUri = await LocalReceiptStorage.getInstance().persistReceiptImage(fotoUri);
      }

      await container.registrarDespesa.execute({
        descricao,
        valor: valorNumero,
        categoria: categoria as Despesa['categoria'],
        fotoUri: finalFotoUri,
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
      });
      setModalVisivel(false);
      setDescricao('');
      setValor('');
      setFotoUri(null);
      const res = await container.listarDespesas.execute();
      setList(res);
      triggerAutoSync();
      Alert.alert('Sucesso', 'Despesa registrada!');
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível registrar.');
    }
  }

  function confirmarExclusao(item: Despesa) {
    Alert.alert(
      'Excluir Despesa',
      `Deseja realmente excluir a despesa "${item.descricao}" no valor de ${item.valor.formatar()}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await container.excluirDespesa.execute({ id: item.id });
              const res = await container.listarDespesas.execute();
              setList(res);
              triggerAutoSync();
              Alert.alert('Sucesso', 'Despesa excluída com sucesso!');
            } catch (err: any) {
              Alert.alert('Erro', err?.message || 'Não foi possível excluir a despesa.');
            }
          },
        },
      ],
    );
  }

  // Separação entre despesas de hoje e despesas arquivadas (dias anteriores), ordenadas da mais recente à mais antiga
  const despesasOrdenadas = [...list].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
  const despesasHoje = despesasOrdenadas.filter((item) => isHoje(item.data));
  const despesasArquivadas = despesasOrdenadas.filter((item) => !isHoje(item.data));

  const listaExibida = mostrarTodasDespesas ? despesasOrdenadas : despesasHoje;

  const totalValorHoje = despesasHoje.reduce((acc, d) => acc + d.valor.valor, 0);
  const totalValorGeral = list.reduce((acc, d) => acc + d.valor.valor, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Despesas da Lavoura</Text>
          <Text style={styles.subtitle}>Controle de gastos com foto do comprovante e GPS</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisivel(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={listaExibida}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            {/* Cartões de Resumo do Dia */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Ionicons name="receipt-outline" size={20} color="#2d6a4f" />
                <Text style={styles.summaryValue}>{despesasHoje.length}</Text>
                <Text style={styles.summaryLabel}>Despesas Hoje</Text>
                {despesasArquivadas.length > 0 && (
                  <Text style={styles.summarySubLabel}>
                    +{despesasArquivadas.length} arquivada(s)
                  </Text>
                )}
              </View>

              <View style={styles.summaryCard}>
                <Ionicons name="cash-outline" size={20} color="#2d6a4f" />
                <Text style={styles.summaryValue}>
                  {new ValorMonetario(totalValorHoje).formatar()}
                </Text>
                <Text style={styles.summaryLabel}>Gasto Hoje</Text>
                {despesasArquivadas.length > 0 && (
                  <Text style={styles.summarySubLabel}>
                    Total: {new ValorMonetario(totalValorGeral).formatar()}
                  </Text>
                )}
              </View>
            </View>

            {/* Cabeçalho da Lista (Hoje vs. Arquivadas) */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle} numberOfLines={1}>
                  {mostrarTodasDespesas ? 'Todas as Despesas' : 'Despesas de Hoje'}
                </Text>
                <Text style={styles.sectionSubtitle} numberOfLines={1}>
                  {mostrarTodasDespesas
                    ? `${list.length} no total (${despesasArquivadas.length} arq.)`
                    : `${despesasHoje.length} registrada(s) hoje`}
                </Text>
              </View>

              {list.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.archiveToggleBtn,
                    mostrarTodasDespesas && styles.archiveToggleBtnActive,
                  ]}
                  onPress={() => setMostrarTodasDespesas((prev) => !prev)}
                >
                  <Ionicons
                    name={mostrarTodasDespesas ? 'today-outline' : 'archive-outline'}
                    size={15}
                    color={mostrarTodasDespesas ? '#fff' : '#2d6a4f'}
                  />
                  <Text
                    style={[
                      styles.archiveToggleText,
                      mostrarTodasDespesas && styles.archiveToggleTextActive,
                    ]}
                  >
                    {mostrarTodasDespesas
                      ? 'Apenas Hoje'
                      : `Ver todas (${list.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={38} color="#bbb" />
            <Text style={styles.emptyTitle}>
              {mostrarTodasDespesas
                ? 'Nenhuma despesa registrada'
                : 'Nenhuma despesa registrada hoje'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {despesasArquivadas.length > 0 && !mostrarTodasDespesas
                ? `Você possui ${despesasArquivadas.length} despesa(s) arquivada(s) de dias anteriores.`
                : 'Toque no botão "+" acima para lançar uma nova despesa da safra.'}
            </Text>
            {!mostrarTodasDespesas && despesasArquivadas.length > 0 && (
              <TouchableOpacity
                style={styles.viewArchivedInlineBtn}
                onPress={() => setMostrarTodasDespesas(true)}
              >
                <Ionicons name="folder-open-outline" size={16} color="#2d6a4f" />
                <Text style={styles.viewArchivedInlineText}>
                  Ver {despesasArquivadas.length} despesa(s) arquivada(s)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ListFooterComponent={
          despesasArquivadas.length > 0 && listaExibida.length > 0 ? (
            <TouchableOpacity
              style={styles.bottomArchiveButton}
              onPress={() => setMostrarTodasDespesas((prev) => !prev)}
            >
              <Ionicons
                name={mostrarTodasDespesas ? 'chevron-up-outline' : 'archive-outline'}
                size={18}
                color="#2d6a4f"
              />
              <Text style={styles.bottomArchiveButtonText}>
                {mostrarTodasDespesas
                  ? 'Ocultar arquivadas (mostrar apenas as de hoje)'
                  : `Ver todas as despesas (${despesasArquivadas.length} arquivada(s) anteriores)`}
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
        renderItem={({ item }) => {
          const registroDeHoje = isHoje(item.data);
          const dataHoraSalva = formatarDataHora(item.data);

          return (
            <View style={[styles.card, !registroDeHoje && styles.cardArchived]}>
              {item.fotoUri ? (
                <TouchableOpacity
                  onPress={() => setComprovanteAmpliado(item)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: item.fotoUri }} style={styles.thumb} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Ionicons
                    name={registroDeHoje ? 'receipt-outline' : 'archive-outline'}
                    size={22}
                    color={registroDeHoje ? '#2d6a4f' : '#64748b'}
                  />
                </View>
              )}
              <View style={styles.info}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.name}>{item.descricao}</Text>
                  <View
                    style={[
                      styles.statusTag,
                      registroDeHoje ? styles.statusTagToday : styles.statusTagArchived,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTagText,
                        registroDeHoje
                          ? styles.statusTagTextToday
                          : styles.statusTagTextArchived,
                      ]}
                    >
                      {registroDeHoje ? 'Hoje' : 'Arquivada'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaValue}>
                  {item.categoria} · <Text style={styles.valorDestaque}>{item.valor.formatar()}</Text>
                </Text>
                <Text style={styles.metaDateTime}>📅 Salvo em {dataHoraSalva}</Text>
                <Text style={styles.metaCoords}>
                  📍 {item.coordenadas.latitude.toFixed(4)}, {item.coordenadas.longitude.toFixed(4)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmarExclusao(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={20} color="#e63946" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* Modal de Visualização Ampliada do Comprovante */}
      <Modal
        visible={!!comprovanteAmpliado}
        transparent
        animationType="fade"
        onRequestClose={() => setComprovanteAmpliado(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {comprovanteAmpliado?.descricao} ({comprovanteAmpliado?.valor.formatar()})
            </Text>
            {comprovanteAmpliado?.fotoUri && (
              <Image
                source={{ uri: comprovanteAmpliado.fotoUri }}
                style={styles.fullReceiptImage}
                resizeMode="contain"
              />
            )}
            <Text style={styles.receiptMetaText}>
              📅 Salvo em {comprovanteAmpliado ? formatarDataHora(comprovanteAmpliado.data) : ''}
            </Text>
            <TouchableOpacity
              style={[styles.confirmButton, { flex: 0, marginTop: 14 }]}
              onPress={() => setComprovanteAmpliado(null)}
            >
              <Text style={styles.confirmButtonText}>Fechar Comprovante</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Cadastro de Nova Despesa */}
      <Modal visible={modalVisivel} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova despesa</Text>

            <Text style={styles.label}>Descrição</Text>
            <TextInput
              style={styles.input}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Ex.: óleo diesel"
            />

            <Text style={styles.label}>Valor (R$)</Text>
            <TextInput
              style={styles.input}
              value={valor}
              onChangeText={setValor}
              keyboardType="numeric"
              placeholder="150,00"
            />

            <Text style={styles.label}>Categoria</Text>
            <View style={styles.categoryRow}>
              {CATEGORIAS_DESPESA.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.categoryChip, categoria === c && styles.categoryChipActive]}
                  onPress={() => setCategoria(c)}
                >
                  <Text
                    style={[styles.categoryText, categoria === c && styles.categoryTextActive]}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {fotoUri ? (
              <View style={styles.previewContainer}>
                <Image source={{ uri: fotoUri }} style={styles.previewImage} />
                <View style={styles.previewActions}>
                  <Text style={styles.previewText}>Comprovante selecionado</Text>
                  <TouchableOpacity
                    onPress={() => setFotoUri(null)}
                    style={styles.removePhotoButton}
                  >
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text style={styles.removePhotoText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.photoButtonsRow}>
                <TouchableOpacity style={styles.photoButton} onPress={tirarFoto}>
                  <Ionicons name="camera-outline" size={18} color="#2d6a4f" />
                  <Text style={styles.photoButtonText}>Tirar foto</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.photoButton} onPress={escolherDaGaleria}>
                  <Ionicons name="images-outline" size={18} color="#2d6a4f" />
                  <Text style={styles.photoButtonText}>Galeria</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisivel(false)}
              >
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
  },
  headerContent: {
    gap: 16,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2d6a4f',
    marginTop: 6,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  summarySubLabel: {
    fontSize: 11,
    color: '#2d6a4f',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    gap: 10,
  },
  sectionHeaderLeft: {
    flex: 1,
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: '#666',
    marginTop: 2,
  },
  archiveToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 5,
    backgroundColor: '#e7f3ee',
    borderWidth: 1,
    borderColor: '#2d6a4f',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  archiveToggleBtnActive: {
    backgroundColor: '#2d6a4f',
  },
  archiveToggleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  archiveToggleTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 36,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 13,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardArchived: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1a1a1a',
    flexShrink: 1,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusTagToday: {
    backgroundColor: '#dcfce7',
  },
  statusTagArchived: {
    backgroundColor: '#e2e8f0',
  },
  statusTagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusTagTextToday: {
    color: '#15803d',
  },
  statusTagTextArchived: {
    color: '#475569',
  },
  metaValue: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  valorDestaque: {
    fontWeight: '700',
    color: '#2d6a4f',
  },
  metaDateTime: {
    fontSize: 12,
    color: '#1b4332',
    fontWeight: '600',
    marginTop: 3,
  },
  metaCoords: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  viewArchivedInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#e7f3ee',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  viewArchivedInlineText: {
    color: '#2d6a4f',
    fontWeight: '700',
    fontSize: 13,
  },
  bottomArchiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e7f3ee',
    borderWidth: 1,
    borderColor: '#b7dfce',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  bottomArchiveButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d6a4f',
    flexShrink: 1,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    color: '#1a1a1a',
  },
  fullReceiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  receiptMetaText: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
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
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2d6a4f',
    borderStyle: 'dashed',
    backgroundColor: '#f0fdf4',
  },
  photoButtonText: {
    color: '#2d6a4f',
    fontWeight: '600',
    fontSize: 13,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  previewActions: {
    flex: 1,
  },
  previewText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  removePhotoText: {
    fontSize: 12,
    color: '#dc2626',
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
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
