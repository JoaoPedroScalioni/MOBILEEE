import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
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
import { Apontamento as ApontamentoEntity } from '@/src/domain/entities/Apontamento';
import { container } from '@/src/factory/container';
import { triggerAutoSync } from '@/src/shared/utils/autoSync';
import { formatarDataHora, isHoje } from '@/src/shared/utils/dateHelper';
import {
  obterLocalizacaoSegura,
  COORDENADAS_PADRAO_FAZENDA,
  LocationResult,
} from '@/src/shared/utils/locationHelper';

type ScreenMode = 'select' | 'scan';

export default function Apontamento() {
  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>([]);
  const [apontamentos, setApontamentos] = useState<ApontamentoEntity[]>([]);
  const [selecionado, setSelecionado] = useState<Trabalhador | null>(null);
  const [litros, setLitros] = useState('');
  const [mostrarTodosBalaios, setMostrarTodosBalaios] = useState(false);
  const [locationResult, setLocationResult] = useState<LocationResult>({
    ...COORDENADAS_PADRAO_FAZENDA,
    isFallback: true,
    status: 'fallback',
  });
  const [mode, setMode] = useState<ScreenMode>('select');
  const [permission, requestPermission] = useCameraPermissions();
  const [salvando, setSalvando] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      const [resTrab, resApont] = await Promise.all([
        container.listarTrabalhadores.execute(),
        container.listarApontamentos.execute(),
      ]);
      setTrabalhadores(resTrab);
      setApontamentos(resApont);
    } catch (err) {
      console.error('Erro ao carregar dados de apontamento:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  const [atualizandoGps, setAtualizandoGps] = useState(false);

  const carregarLocalizacao = useCallback(async () => {
    setAtualizandoGps(true);
    try {
      const loc = await obterLocalizacaoSegura(4000);
      setLocationResult(loc);
    } finally {
      setAtualizandoGps(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarLocalizacao();
    }, 0);
    return () => clearTimeout(timer);
  }, [carregarLocalizacao]);

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

    setSalvando(true);
    try {
      await container.registrarApontamento.execute({
        trabalhadorId: selecionado.id,
        litros: litrosNumero,
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
      });

      setLitros('');
      const nomeTrabalhador = selecionado.nome;
      setSelecionado(null);

      // Recarrega imediatamente a lista de apontamentos
      const listaAtualizada = await container.listarApontamentos.execute();
      setApontamentos(listaAtualizada);

      // Sincronização automática com Supabase em segundo plano
      triggerAutoSync();

      Alert.alert('Sucesso!', `Balaio de ${litrosNumero}L registrado para ${nomeTrabalhador}.`);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível registrar o balaio.');
    } finally {
      setSalvando(false);
    }
  }

  // Separação entre balaios de hoje e balaios arquivados (dias anteriores), ordenados do mais recente ao mais antigo
  const apontamentosOrdenados = [...apontamentos].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
  const apontamentosHoje = apontamentosOrdenados.filter((item) => isHoje(item.data));
  const apontamentosArquivados = apontamentosOrdenados.filter((item) => !isHoje(item.data));

  const listaExibida = mostrarTodosBalaios ? apontamentosOrdenados : apontamentosHoje;

  // Cálculos do resumo do dia e acumulado
  const totalBalaiosHoje = apontamentosHoje.length;
  const totalLitrosHoje = apontamentosHoje.reduce((acc, item) => acc + item.quantidade.litros, 0);
  const totalLitrosGeral = apontamentos.reduce((acc, item) => acc + item.quantidade.litros, 0);

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
      <Text style={styles.subtitle}>Selecione o trabalhador e informe os litros colhidos no balaio.</Text>

      {/* Cartões de Resumo do Dia */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Ionicons name="basket-outline" size={22} color="#2d6a4f" />
          <Text style={styles.summaryValue}>{totalBalaiosHoje}</Text>
          <Text style={styles.summaryLabel}>Balaios Hoje</Text>
          {apontamentosArquivados.length > 0 && (
            <Text style={styles.summarySubLabel}>
              +{apontamentosArquivados.length} arquivado(s)
            </Text>
          )}
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="water-outline" size={22} color="#2d6a4f" />
          <Text style={styles.summaryValue}>{totalLitrosHoje} L</Text>
          <Text style={styles.summaryLabel}>Colhido Hoje</Text>
          {apontamentosArquivados.length > 0 && (
            <Text style={styles.summarySubLabel}>Total geral: {totalLitrosGeral} L</Text>
          )}
        </View>
      </View>

      {/* Card de Seleção do Trabalhador */}
      <View style={styles.workerRow}>
        <View style={styles.workerInfo}>
          <Text style={styles.label}>Trabalhador Selecionado</Text>
          <Text style={styles.workerName}>{selecionado ? selecionado.nome : 'Nenhum selecionado'}</Text>
          {selecionado ? (
            <Text style={styles.workerMeta}>
              Crachá {selecionado.cracha} · Diária {selecionado.diaria.formatar()}
            </Text>
          ) : (
            <Text style={styles.workerMeta}>Toque em &quot;Ler crachá&quot; ou escolha abaixo</Text>
          )}
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={() => setMode('scan')}>
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Ler crachá</Text>
        </TouchableOpacity>
      </View>

      {/* Seleção rápida de trabalhadores */}
      {!selecionado && (
        <View>
          <Text style={styles.label}>Ou escolha manualmente</Text>
          {trabalhadores.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyWorkerShortcut}
              onPress={() => router.push('/(drawer)/(tabs)/trabalhadores')}
            >
              <Ionicons name="person-add-outline" size={18} color="#2d6a4f" style={{ marginRight: 8 }} />
              <Text style={styles.emptyWorkerShortcutText}>
                Nenhum trabalhador cadastrado. Toque aqui para adicionar.
              </Text>
            </TouchableOpacity>
          ) : (
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
          )}
        </View>
      )}

      {/* Entrada de Quantidade */}
      <View>
        <Text style={styles.label}>Quantidade colhida (litros)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex.: 45 ou 60"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={litros}
          onChangeText={setLitros}
        />
      </View>

      {/* Tag de GPS */}
      <TouchableOpacity
        style={styles.locationTag}
        onPress={carregarLocalizacao}
        disabled={atualizandoGps}
        activeOpacity={0.7}
      >
        <Ionicons
          name={atualizandoGps ? 'sync-outline' : locationResult.isFallback ? 'warning-outline' : 'location'}
          size={16}
          color={locationResult.isFallback ? '#d97706' : '#2d6a4f'}
        />
        <Text style={styles.coords}>
          {atualizandoGps
            ? 'Obtendo satélites...'
            : `${locationResult.latitude.toFixed(4)}, ${locationResult.longitude.toFixed(4)} ${
                locationResult.isFallback
                  ? '(ref. Sul de MG · toque p/ atualizar)'
                  : '(GPS ativo · toque p/ atualizar)'
              }`}
        </Text>
      </TouchableOpacity>

      {/* Botão Registrar */}
      <TouchableOpacity
        style={[styles.saveButton, salvando && styles.saveButtonDisabled]}
        disabled={salvando}
        onPress={registrar}
      >
        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.saveButtonText}>{salvando ? 'Salvando...' : 'Registrar balaio'}</Text>
      </TouchableOpacity>

      {/* Seção de Histórico de Balaios (Hoje vs. Arquivados) */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <View style={styles.historyHeaderLeft}>
            <Text style={styles.historyTitle} numberOfLines={1}>
              {mostrarTodosBalaios ? 'Todos os Balaios' : 'Balaios de Hoje'}
            </Text>
            <Text style={styles.historyCount} numberOfLines={1}>
              {mostrarTodosBalaios
                ? `${apontamentos.length} no total (${apontamentosArquivados.length} arq.)`
                : `${apontamentosHoje.length} registrado(s) hoje`}
            </Text>
          </View>

          {apontamentos.length > 0 && (
            <TouchableOpacity
              style={[
                styles.archiveToggleBtn,
                mostrarTodosBalaios && styles.archiveToggleBtnActive,
              ]}
              onPress={() => setMostrarTodosBalaios((prev) => !prev)}
            >
              <Ionicons
                name={mostrarTodosBalaios ? 'today-outline' : 'archive-outline'}
                size={15}
                color={mostrarTodosBalaios ? '#fff' : '#2d6a4f'}
              />
              <Text
                style={[
                  styles.archiveToggleText,
                  mostrarTodosBalaios && styles.archiveToggleTextActive,
                ]}
              >
                {mostrarTodosBalaios
                  ? 'Apenas Hoje'
                  : `Ver todos (${apontamentos.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {listaExibida.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cafe-outline" size={36} color="#bbb" />
            <Text style={styles.emptyTitle}>
              {mostrarTodosBalaios
                ? 'Nenhum balaio registrado no sistema'
                : 'Nenhum balaio registrado hoje'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {apontamentosArquivados.length > 0 && !mostrarTodosBalaios
                ? `Você possui ${apontamentosArquivados.length} balaio(s) arquivado(s) de dias anteriores.`
                : 'Assim que você registrar o primeiro balaio do dia, ele aparecerá aqui.'}
            </Text>
            {!mostrarTodosBalaios && apontamentosArquivados.length > 0 && (
              <TouchableOpacity
                style={styles.viewArchivedInlineBtn}
                onPress={() => setMostrarTodosBalaios(true)}
              >
                <Ionicons name="folder-open-outline" size={16} color="#2d6a4f" />
                <Text style={styles.viewArchivedInlineText}>
                  Ver {apontamentosArquivados.length} balaio(s) arquivado(s)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {listaExibida.map((item, index) => {
              const trabalhador = trabalhadores.find((t) => t.id === item.trabalhadorId);
              const nomeExibicao = trabalhador
                ? trabalhador.nome
                : 'Trabalhador ID: ' + item.trabalhadorId.slice(0, 8);
              const crachaExibicao = trabalhador ? `Crachá ${trabalhador.cracha}` : '';
              const dataHoraSalva = formatarDataHora(item.data);
              const registroDeHoje = isHoje(item.data);

              return (
                <View
                  key={item.id || index}
                  style={[
                    styles.historyCard,
                    !registroDeHoje && styles.historyCardArchived,
                  ]}
                >
                  <View
                    style={[
                      styles.historyIconBox,
                      !registroDeHoje && styles.historyIconBoxArchived,
                    ]}
                  >
                    <Ionicons
                      name={registroDeHoje ? 'cafe' : 'archive-outline'}
                      size={22}
                      color={registroDeHoje ? '#2d6a4f' : '#64748b'}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <View style={styles.historyTitleRow}>
                      <Text style={styles.historyWorkerName}>{nomeExibicao}</Text>
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
                          {registroDeHoje ? 'Hoje' : 'Arquivado'}
                        </Text>
                      </View>
                    </View>
                    {crachaExibicao ? (
                      <Text style={styles.historyMeta}>{crachaExibicao}</Text>
                    ) : null}
                    <Text style={styles.historyDateTime}>📅 Salvo em {dataHoraSalva}</Text>
                    <Text style={styles.historyCoords}>
                      📍 {item.coordenadas.latitude.toFixed(4)},{' '}
                      {item.coordenadas.longitude.toFixed(4)}
                    </Text>
                  </View>
                  <View style={styles.historyBadge}>
                    <Text style={styles.historyLitrosText}>{item.quantidade.litros} L</Text>
                  </View>
                </View>
              );
            })}

            {/* Botão inferior para expandir ou recolher balaios arquivados */}
            {apontamentosArquivados.length > 0 && (
              <TouchableOpacity
                style={styles.bottomArchiveButton}
                onPress={() => setMostrarTodosBalaios((prev) => !prev)}
              >
                <Ionicons
                  name={mostrarTodosBalaios ? 'chevron-up-outline' : 'archive-outline'}
                  size={18}
                  color="#2d6a4f"
                />
                <Text style={styles.bottomArchiveButtonText}>
                  {mostrarTodosBalaios
                    ? 'Ocultar arquivados (mostrar apenas os de hoje)'
                    : `Ver todos os balaios (${apontamentosArquivados.length} arquivado(s) anteriores)`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
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
    paddingBottom: 40,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
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
    fontSize: 22,
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  workerInfo: {
    flex: 1,
    paddingRight: 10,
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
    fontSize: 13,
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
    fontSize: 13,
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
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coords: {
    fontSize: 13,
    color: '#555',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#2d6a4f',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historySection: {
    marginTop: 16,
    gap: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  historyHeaderLeft: {
    flex: 1,
    flexShrink: 1,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  historyCount: {
    fontSize: 12.5,
    color: '#666',
    fontWeight: '500',
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
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    gap: 8,
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
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyCardArchived: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  historyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#e7f3ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyIconBoxArchived: {
    backgroundColor: '#f1f5f9',
  },
  historyInfo: {
    flex: 1,
    paddingRight: 8,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  historyWorkerName: {
    fontSize: 15,
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
  historyMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  historyDateTime: {
    fontSize: 12,
    color: '#1b4332',
    fontWeight: '600',
    marginTop: 3,
  },
  historyCoords: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexShrink: 0,
  },
  historyLitrosText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
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
  emptyWorkerShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f3ee',
    borderWidth: 1,
    borderColor: '#b7dfce',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  emptyWorkerShortcutText: {
    color: '#2d6a4f',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});