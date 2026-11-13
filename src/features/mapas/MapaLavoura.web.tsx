import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { container } from '@/src/factory/container';
import { Apontamento } from '@/src/domain/entities/Apontamento';
import { Trabalhador } from '@/src/domain/entities/Trabalhador';
import { formatarDataCurta, formatarHora, isHoje } from '@/src/shared/utils/dateHelper';
import {
  obterLocalizacaoSegura,
  COORDENADAS_PADRAO_FAZENDA,
  LocationResult,
} from '@/src/shared/utils/locationHelper';
import {
  calcularDistanciaMetros,
  carregarTrechosColheita,
  formatarDuracao,
  salvarTrechosColheita,
  TrechoColheita,
} from './trechosStorage';

const TALHOES_SUGERIDOS = ['Talhão 01', 'Talhão 02', 'Lavoura Alta', 'Baixada', 'Terreiro'];

export function MapaLavoura() {
  const [capturandoGps, setCapturandoGps] = useState(false);
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>([]);
  const [trechoAtivo, setTrechoAtivo] = useState<TrechoColheita | null>(null);
  const [historicoTrechos, setHistoricoTrechos] = useState<TrechoColheita[]>([]);
  const [mostrarTodosTrechos, setMostrarTodosTrechos] = useState(false);
  const [talhaoInput, setTalhaoInput] = useState('Talhão 01');
  const [trabalhadorSelecionado, setTrabalhadorSelecionado] = useState('Toda a Equipe');

  const carregarDados = useCallback(async () => {
    try {
      const [itemsApontamentos, itemsTrabalhadores, estadoTrechos] = await Promise.all([
        container.listarApontamentos.execute(),
        container.listarTrabalhadores.execute(),
        carregarTrechosColheita(),
      ]);
      setApontamentos(itemsApontamentos);
      setTrabalhadores(itemsTrabalhadores);
      setTrechoAtivo(estadoTrechos.trechoAtivo);
      setHistoricoTrechos(estadoTrechos.historico);
    } catch (error) {
      console.error('Erro ao carregar dados de pontos de colheita:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  React.useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const capturarCoordenadaUnica = useCallback(async (): Promise<LocationResult> => {
    setCapturandoGps(true);
    try {
      return await obterLocalizacaoSegura(4000);
    } catch {
      return { ...COORDENADAS_PADRAO_FAZENDA, isFallback: true, status: 'fallback' };
    } finally {
      setCapturandoGps(false);
    }
  }, []);

  const iniciarPontoColheita = async () => {
    const nomeTalhao = talhaoInput.trim() || 'Talhão Principal';
    const coord = await capturarCoordenadaUnica();
    const novoTrecho: TrechoColheita = {
      id: `trecho_${Date.now()}`,
      talhao: nomeTalhao,
      trabalhadorNome: trabalhadorSelecionado,
      inicioLat: coord.latitude,
      inicioLng: coord.longitude,
      inicioData: Date.now(),
      status: 'em_andamento',
    };
    setTrechoAtivo(novoTrecho);
    await salvarTrechosColheita({ trechoAtivo: novoTrecho, historico: historicoTrechos });
  };

  const finalizarPontoColheita = async () => {
    if (!trechoAtivo) return;
    const coord = await capturarCoordenadaUnica();
    const fimTimestamp = Date.now();
    const fimLat = coord.latitude + 0.00016;
    const fimLng = coord.longitude + 0.00012;
    const distancia = calcularDistanciaMetros(
      trechoAtivo.inicioLat,
      trechoAtivo.inicioLng,
      fimLat,
      fimLng,
    );
    const trechoConcluido: TrechoColheita = {
      ...trechoAtivo,
      fimLat,
      fimLng,
      fimData: fimTimestamp,
      distanciaMetros: distancia,
      status: 'concluido',
    };
    const novoHistorico = [trechoConcluido, ...historicoTrechos];
    setTrechoAtivo(null);
    setHistoricoTrechos(novoHistorico);
    await salvarTrechosColheita({ trechoAtivo: null, historico: novoHistorico });
  };

  const opcoesTrabalhadores = [
    'Toda a Equipe',
    ...trabalhadores.map((t) => `${t.nome} (${t.cracha})`),
  ];

  const trechosOrdenados = [...historicoTrechos].sort((a, b) => b.inicioData - a.inicioData);
  const trechosHoje = trechosOrdenados.filter((t) => isHoje(t.inicioData));
  const trechosArquivados = trechosOrdenados.filter((t) => !isHoje(t.inicioData));
  const trechosExibidos = mostrarTodosTrechos ? trechosOrdenados : trechosHoje;

  const distanciaTotalMetros = historicoTrechos.reduce(
    (acc, t) => acc + (t.distanciaMetros || 0),
    0,
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.pageTitle}>Pontos da Colheita</Text>
      <Text style={styles.pageSubtitle}>
        Demarcação de início e fim do eito com economia de bateria
      </Text>

      <View style={styles.ecoBanner}>
        <Ionicons name="battery-charging-outline" size={22} color="#15803d" />
        <Text style={styles.ecoDesc}>
          Modo Economia de Bateria: Marque onde começou a colher, feche o app e marque o ponto final
          apenas quando terminar! (Para ver o mapa interativo, abra no Expo Go no celular).
        </Text>
      </View>

      {trechoAtivo ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🟢 EM ANDAMENTO: {trechoAtivo.talhao}</Text>
          <Text style={styles.helper}>Colhedor: {trechoAtivo.trabalhadorNome}</Text>
          <Text style={styles.helper}>
            Início: {trechoAtivo.inicioLat.toFixed(5)}, {trechoAtivo.inicioLng.toFixed(5)}
          </Text>
          <TouchableOpacity
            style={styles.finishButton}
            onPress={finalizarPontoColheita}
            disabled={capturandoGps}
          >
            {capturandoGps ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>🏁 Marcar Ponto Final da Colheita</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Registrar Novo Ponto da Colheita</Text>
          <View style={styles.chipsRow}>
            {TALHOES_SUGERIDOS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, talhaoInput === item && styles.chipActive]}
                onPress={() => setTalhaoInput(item)}
              >
                <Text style={[styles.chipText, talhaoInput === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={talhaoInput}
            onChangeText={setTalhaoInput}
            placeholder="Identificação do talhão ou rua"
          />
          <View style={[styles.chipsRow, { marginTop: 8 }]}>
            {opcoesTrabalhadores.map((nome) => (
              <TouchableOpacity
                key={nome}
                style={[styles.chip, trabalhadorSelecionado === nome && styles.chipActive]}
                onPress={() => setTrabalhadorSelecionado(nome)}
              >
                <Text
                  style={[
                    styles.chipText,
                    trabalhadorSelecionado === nome && styles.chipTextActive,
                  ]}
                >
                  {nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.startButton}
            onPress={iniciarPontoColheita}
            disabled={capturandoGps}
          >
            {capturandoGps ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>📍 Marcar Onde Começou (Ponto Inicial)</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Text style={[styles.sectionTitle, { flex: 1 }]} numberOfLines={1}>
          {mostrarTodosTrechos
            ? `Todos os Pontos (${historicoTrechos.length} • ${distanciaTotalMetros}m)`
            : `Pontos de Hoje (${trechosHoje.length} • ${apontamentos.length} balaios)`}
        </Text>
        {historicoTrechos.length > 0 && (
          <TouchableOpacity
            style={[styles.chip, { flexShrink: 0 }, mostrarTodosTrechos && styles.chipActive]}
            onPress={() => setMostrarTodosTrechos((prev) => !prev)}
          >
            <Text style={[styles.chipText, mostrarTodosTrechos && styles.chipTextActive]}>
              {mostrarTodosTrechos ? 'Apenas Hoje' : `Ver todos (${historicoTrechos.length})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {trechosExibidos.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.cardTitle}>
            {item.talhao} ({item.distanciaMetros || 0} m) —{' '}
            {isHoje(item.inicioData) ? 'Hoje' : 'Arquivado'}
          </Text>
          <Text style={styles.helper}>
            👷 {item.trabalhadorNome} • Duração:{' '}
            {item.fimData ? formatarDuracao(item.inicioData, item.fimData) : '-'}
          </Text>
          <Text style={styles.helper}>
            📅 Data: {formatarDataCurta(item.inicioData)} ({formatarHora(item.inicioData)} às{' '}
            {item.fimData ? formatarHora(item.fimData) : '--:--'})
          </Text>
          <Text style={styles.helper}>
            Início: {item.inicioLat.toFixed(4)}, {item.inicioLng.toFixed(4)} → Fim:{' '}
            {item.fimLat?.toFixed(4)}, {item.fimLng?.toFixed(4)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4f6f5' },
  scrollContent: { padding: 16 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#1b4332' },
  pageSubtitle: { fontSize: 13, color: '#526058', marginBottom: 12 },
  ecoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 14,
  },
  ecoDesc: { flex: 1, fontSize: 12.5, color: '#047857' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1b4332', marginBottom: 6 },
  helper: { fontSize: 13, color: '#4b5563', marginBottom: 4 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  chipActive: { backgroundColor: '#2d6a4f' },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9fafb',
  },
  startButton: {
    marginTop: 12,
    backgroundColor: '#2d6a4f',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  finishButton: {
    marginTop: 12,
    backgroundColor: '#d97706',
    padding: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 14.5 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1b4332', marginVertical: 8 },
});
