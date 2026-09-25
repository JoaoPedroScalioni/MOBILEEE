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
      let active = true;
      carregarDados();
      return () => {
        active = false;
      };
    }, [carregarDados]),
  );

  useEffect(() => {
    async function carregarLocalizacao() {
      const loc = await obterLocalizacaoSegura(4000);
      setLocationResult(loc);
    }
    carregarLocalizacao();
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

      Alert.alert('Sucesso!', `Balaio de ${litrosNumero}L registrado para ${nomeTrabalhador}.`);
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Não foi possível registrar o balaio.');
    } finally {
      setSalvando(false);
    }
  }

  // Cálculos do resumo do dia
  const totalBalaios = apontamentos.length;
  const totalLitros = apontamentos.reduce((acc, item) => acc + item.quantidade.litros, 0);

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
          <Text style={styles.summaryValue}>{totalBalaios}</Text>
          <Text style={styles.summaryLabel}>Balaios Hoje</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="water-outline" size={22} color="#2d6a4f" />
          <Text style={styles.summaryValue}>{totalLitros} L</Text>
          <Text style={styles.summaryLabel}>Total Colhido</Text>
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
            <Text style={styles.workerMeta}>Toque em "Ler crachá" ou escolha abaixo</Text>
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
      <View style={styles.locationTag}>
        <Ionicons
          name={locationResult.isFallback ? 'warning-outline' : 'location'}
          size={16}
          color={locationResult.isFallback ? '#d97706' : '#2d6a4f'}
        />
        <Text style={styles.coords}>
          {locationResult.latitude.toFixed(4)}, {locationResult.longitude.toFixed(4)}
          {locationResult.isFallback ? ' (ref. Sul de MG)' : ' (GPS ativo)'}
        </Text>
      </View>

      {/* Botão Registrar */}
      <TouchableOpacity
        style={[styles.saveButton, salvando && styles.saveButtonDisabled]}
        disabled={salvando}
        onPress={registrar}
      >
        <Ionicons name="checkmark-circle-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.saveButtonText}>{salvando ? 'Salvando...' : 'Registrar balaio'}</Text>
      </TouchableOpacity>

      {/* Seção de Histórico de Balaios do Dia */}
      <View style={styles.historySection}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Últimos Balaios Registrados</Text>
          <Text style={styles.historyCount}>{apontamentos.length} registros</Text>
        </View>

        {apontamentos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cafe-outline" size={36} color="#bbb" />
            <Text style={styles.emptyTitle}>Nenhum balaio registrado ainda hoje</Text>
            <Text style={styles.emptySubtitle}>
              Assim que você registrar o primeiro balaio, ele aparecerá aqui com os detalhes.
            </Text>
          </View>
        ) : (
          [...apontamentos].reverse().map((item, index) => {
            const trabalhador = trabalhadores.find((t) => t.id === item.trabalhadorId);
            const nomeExibicao = trabalhador ? trabalhador.nome : 'Trabalhador ID: ' + item.trabalhadorId.slice(0, 8);
            const crachaExibicao = trabalhador ? `Crachá ${trabalhador.cracha}` : '';
            const horaFormatada = new Date(item.data).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View key={item.id || index} style={styles.historyCard}>
                <View style={styles.historyIconBox}>
                  <Ionicons name="cafe" size={22} color="#2d6a4f" />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyWorkerName}>{nomeExibicao}</Text>
                  <Text style={styles.historyMeta}>
                    {horaFormatada} {crachaExibicao ? `· ${crachaExibicao}` : ''}
                  </Text>
                  <Text style={styles.historyCoords}>
                    📍 {item.coordenadas.latitude.toFixed(4)}, {item.coordenadas.longitude.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyLitrosText}>{item.quantidade.litros} L</Text>
                </View>
              </View>
            );
          })
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
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  historyCount: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
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
  historyIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#e7f3ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyWorkerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  historyMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  },
  historyLitrosText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
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