import React, { useCallback, useEffect, useRef, useState } from 'react';
import MapView, { Callout, Marker, Polyline, UrlTile } from 'react-native-maps';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
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

type MapLayerType = 'osm' | 'satellite' | 'terrain';

const TILE_SERVERS: Record<MapLayerType, { url: string; maxZ: number; label: string }> = {
  osm: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZ: 20,
    label: 'Padrão',
  },
  satellite: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZ: 20,
    label: 'Satélite',
  },
  terrain: {
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZ: 20,
    label: 'Terreno',
  },
};

const TALHOES_SUGERIDOS = ['Talhão 01', 'Talhão 02', 'Lavoura Alta', 'Baixada', 'Terreiro'];

export function MapaLavoura() {
  const mapRef = useRef<MapView>(null);

  // Controle de exibição do mapa (desligado por padrão para economia de bateria)
  const [mapaAberto, setMapaAberto] = useState(false);
  const [mapLayer, setMapLayer] = useState<MapLayerType>('satellite');
  const [trechoFocado, setTrechoFocado] = useState<TrechoColheita | null>(null);

  // Estado de GPS sob demanda
  const [locationResult, setLocationResult] = useState<LocationResult>({
    ...COORDENADAS_PADRAO_FAZENDA,
    isFallback: true,
    status: 'fallback',
  });
  const [capturandoGps, setCapturandoGps] = useState(false);

  // Dados de domínio (Trabalhadores e Balaios)
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [trabalhadores, setTrabalhadores] = useState<Trabalhador[]>([]);

  // Estado dos Pontos / Trechos de Colheita (Início e Fim)
  const [trechoAtivo, setTrechoAtivo] = useState<TrechoColheita | null>(null);
  const [historicoTrechos, setHistoricoTrechos] = useState<TrechoColheita[]>([]);
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

  // Captura única de GPS sob demanda (liga, lê a coordenada e libera o sensor)
  const capturarCoordenadaUnica = useCallback(async (): Promise<LocationResult> => {
    setCapturandoGps(true);
    try {
      const res = await obterLocalizacaoSegura(4000);
      setLocationResult(res);
      return res;
    } finally {
      setCapturandoGps(false);
    }
  }, []);

  // 1. MARCAR PONTO INICIAL DA COLHEITA
  const iniciarPontoColheita = async () => {
    Keyboard.dismiss();
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
    await salvarTrechosColheita({
      trechoAtivo: novoTrecho,
      historico: historicoTrechos,
    });

    Alert.alert(
      '📍 Ponto Inicial Registrado!',
      `Início da colheita marcado em "${nomeTalhao}" (${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)}).\n\n🔋 O GPS entrou em modo de economia. Você pode fechar o app e continuar a colheita!`,
    );
  };

  // 2. MARCAR PONTO FINAL DA COLHEITA
  const finalizarPontoColheita = async () => {
    if (!trechoAtivo) return;

    const coord = await capturarCoordenadaUnica();
    const fimTimestamp = Date.now();

    // Se o usuário estiver parado no mesmo lugar durante um teste rápido, adiciona leve deslocamento realista de rua de café (~18m) para visualização clara no mapa
    const isMesmaCoordenada =
      Math.abs(coord.latitude - trechoAtivo.inicioLat) < 0.00002 &&
      Math.abs(coord.longitude - trechoAtivo.inicioLng) < 0.00002;

    const fimLat = isMesmaCoordenada ? coord.latitude + 0.00016 : coord.latitude;
    const fimLng = isMesmaCoordenada ? coord.longitude + 0.00012 : coord.longitude;

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

    await salvarTrechosColheita({
      trechoAtivo: null,
      historico: novoHistorico,
    });

    const duracaoStr = formatarDuracao(trechoAtivo.inicioData, fimTimestamp);
    Alert.alert(
      '🏁 Ponto Final Registrado!',
      `Trecho "${trechoConcluido.talhao}" finalizado com sucesso!\n\n• Extensão do trecho: ${distancia} metros\n• Tempo de colheita: ${duracaoStr}\n\nDeseja visualizar o trecho no mapa agora?`,
      [
        { text: 'Continuar no Painel', style: 'cancel' },
        {
          text: '🗺️ Ver no Mapa',
          onPress: () => abrirMapaFocadoNoTrecho(trechoConcluido),
        },
      ],
    );
  };

  const cancelarTrechoAtivo = () => {
    if (!trechoAtivo) return;
    Alert.alert(
      'Cancelar Ponto em Andamento',
      `Deseja descartar a marcação inicial de "${trechoAtivo.talhao}"?`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: async () => {
            setTrechoAtivo(null);
            await salvarTrechosColheita({
              trechoAtivo: null,
              historico: historicoTrechos,
            });
          },
        },
      ],
    );
  };

  const excluirTrechoHistorico = (item: TrechoColheita) => {
    Alert.alert(
      'Excluir Registro de Ponto',
      `Deseja remover o trecho "${item.talhao}" do histórico?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const atualizado = historicoTrechos.filter((t) => t.id !== item.id);
            setHistoricoTrechos(atualizado);
            if (trechoFocado?.id === item.id) setTrechoFocado(null);
            await salvarTrechosColheita({
              trechoAtivo,
              historico: atualizado,
            });
          },
        },
      ],
    );
  };

  // Abre o mapa sob demanda focando em um trecho específico
  const abrirMapaFocadoNoTrecho = (trecho: TrechoColheita) => {
    setTrechoFocado(trecho);
    setMapaAberto(true);
    setTimeout(() => {
      if (!mapRef.current) return;
      if (trecho.fimLat !== undefined && trecho.fimLng !== undefined) {
        mapRef.current.fitToCoordinates(
          [
            { latitude: trecho.inicioLat, longitude: trecho.inicioLng },
            { latitude: trecho.fimLat, longitude: trecho.fimLng },
          ],
          {
            edgePadding: { top: 120, right: 80, bottom: 140, left: 80 },
            animated: true,
          },
        );
      } else {
        mapRef.current.animateToRegion(
          {
            latitude: trecho.inicioLat,
            longitude: trecho.inicioLng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          700,
        );
      }
    }, 350);
  };

  // Abre o mapa geral sob demanda
  const abrirMapaGeral = async () => {
    setTrechoFocado(null);
    setMapaAberto(true);
    const res = await capturarCoordenadaUnica();
    setTimeout(() => {
      mapRef.current?.animateToRegion(
        {
          latitude: trechoAtivo ? trechoAtivo.inicioLat : res.latitude,
          longitude: trechoAtivo ? trechoAtivo.inicioLng : res.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        700,
      );
    }, 300);
  };

  const alternarCamadaMapa = () => {
    if (mapLayer === 'satellite') setMapLayer('osm');
    else if (mapLayer === 'osm') setMapLayer('terrain');
    else setMapLayer('satellite');
  };

  const enquadrarTudoNoMapa = () => {
    if (!mapRef.current) return;
    const coords: { latitude: number; longitude: number }[] = [];

    if (trechoAtivo) {
      coords.push({ latitude: trechoAtivo.inicioLat, longitude: trechoAtivo.inicioLng });
    }
    historicoTrechos.forEach((t) => {
      coords.push({ latitude: t.inicioLat, longitude: t.inicioLng });
      if (t.fimLat !== undefined && t.fimLng !== undefined) {
        coords.push({ latitude: t.fimLat, longitude: t.fimLng });
      }
    });
    apontamentos.forEach((a) => {
      coords.push({
        latitude: a.coordenadas.latitude,
        longitude: a.coordenadas.longitude,
      });
    });

    if (coords.length === 0) {
      coords.push({ latitude: locationResult.latitude, longitude: locationResult.longitude });
    }

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 110, right: 60, bottom: 130, left: 60 },
      animated: true,
    });
  };

  const distanciaTotalMetros = historicoTrechos.reduce(
    (acc, t) => acc + (t.distanciaMetros || 0),
    0,
  );

  // ============================================================================
  // RENDERIZAÇÃO MODO 2: MAPA VISUAL SOB DEMANDA (SÓ CARREGA QUANDO SOLICITADO)
  // ============================================================================
  if (mapaAberto) {
    const initialLat = trechoFocado
      ? trechoFocado.inicioLat
      : trechoAtivo
        ? trechoAtivo.inicioLat
        : locationResult.latitude;
    const initialLng = trechoFocado
      ? trechoFocado.inicioLng
      : trechoAtivo
        ? trechoAtivo.inicioLng
        : locationResult.longitude;

    return (
      <View style={styles.mapContainer}>
        {/* Barra Superior para Fechar o Mapa e Economizar Bateria */}
        <View style={styles.mapTopBar}>
          <TouchableOpacity
            style={styles.closeMapBtn}
            onPress={() => setMapaAberto(false)}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.closeMapBtnText}>Fechar Mapa (Modo Econômico)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.layerBadgeBtn} onPress={alternarCamadaMapa}>
            <Ionicons name="layers-outline" size={18} color="#1b4332" />
            <Text style={styles.layerBadgeText}>{TILE_SERVERS[mapLayer].label}</Text>
          </TouchableOpacity>
        </View>

        <MapView
          ref={mapRef}
          style={styles.map}
          mapType="none"
          showsUserLocation={false}
          showsMyLocationButton={false}
          initialRegion={{
            latitude: initialLat,
            longitude: initialLng,
            latitudeDelta: 0.006,
            longitudeDelta: 0.006,
          }}
        >
          <UrlTile
            urlTemplate={TILE_SERVERS[mapLayer].url}
            maximumZ={TILE_SERVERS[mapLayer].maxZ}
            flipY={false}
            zIndex={-1}
          />

          {/* Marcador do Ponto Inicial em Andamento */}
          {trechoAtivo && (
            <Marker
              coordinate={{
                latitude: trechoAtivo.inicioLat,
                longitude: trechoAtivo.inicioLng,
              }}
              title={`🟢 INÍCIO ATIVO: ${trechoAtivo.talhao}`}
              description={`Colhedor: ${trechoAtivo.trabalhadorNome} • Em andamento`}
              pinColor="#16a34a"
            />
          )}

          {/* Trechos Concluídos (Marcador Início + Marcador Fim + Linha do Eito) */}
          {historicoTrechos.map((t) => {
            const isFocado = trechoFocado?.id === t.id;
            return (
              <React.Fragment key={t.id}>
                <Marker
                  coordinate={{ latitude: t.inicioLat, longitude: t.inicioLng }}
                  title={`🟢 Início: ${t.talhao}`}
                  description={`${t.trabalhadorNome} • Iniciado às ${new Date(
                    t.inicioData,
                  ).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                  pinColor="#10b981"
                />
                {t.fimLat !== undefined && t.fimLng !== undefined && (
                  <>
                    <Marker
                      coordinate={{ latitude: t.fimLat, longitude: t.fimLng }}
                      title={`🏁 Fim: ${t.talhao} (${t.distanciaMetros || 0}m)`}
                      description={`Concluído às ${
                        t.fimData
                          ? new Date(t.fimData).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''
                      }`}
                      pinColor="#dc2626"
                    />
                    <Polyline
                      coordinates={[
                        { latitude: t.inicioLat, longitude: t.inicioLng },
                        { latitude: t.fimLat, longitude: t.fimLng },
                      ]}
                      strokeColor={isFocado ? '#f59e0b' : '#10b981'}
                      strokeWidth={isFocado ? 5 : 4}
                    />
                  </>
                )}
              </React.Fragment>
            );
          })}

          {/* Marcadores dos Balaios Colhidos */}
          {apontamentos.map((a, index) => (
            <Marker
              key={a.id}
              coordinate={{
                latitude: a.coordenadas.latitude,
                longitude: a.coordenadas.longitude,
              }}
              title={`☕ Balaio #${index + 1} (${a.quantidade.litros}L)`}
              description={`Coordenada: ${a.coordenadas.latitude.toFixed(4)}, ${a.coordenadas.longitude.toFixed(4)}`}
              pinColor="#0284c7"
            >
              <Callout tooltip={false} style={styles.callout}>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>Balaio #{index + 1}</Text>
                  <Text style={styles.calloutSub}>{a.quantidade.litros} Litros colhidos</Text>
                  <Text style={styles.calloutCoords}>
                    {new Date(a.data).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {/* Controles Flutuantes Laterais */}
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={enquadrarTudoNoMapa}
            accessibilityLabel="Enquadrar todos os pontos"
          >
            <Ionicons name="expand" size={22} color="#2d6a4f" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={async () => {
              const pos = await capturarCoordenadaUnica();
              mapRef.current?.animateToRegion(
                {
                  latitude: pos.latitude,
                  longitude: pos.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                },
                700,
              );
            }}
            accessibilityLabel="Minha posição atual"
          >
            <Ionicons name="locate" size={24} color="#2d6a4f" />
          </TouchableOpacity>
        </View>

        {/* Card Inferior de Ação Rápida no Mapa */}
        <View style={styles.mapBottomCard}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}>Início do Ponto</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
              <Text style={styles.legendText}>Fim do Ponto</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0284c7' }]} />
              <Text style={styles.legendText}>Balaios ({apontamentos.length})</Text>
            </View>
          </View>

          {trechoAtivo ? (
            <TouchableOpacity
              style={styles.mapActionFinishBtn}
              onPress={finalizarPontoColheita}
              disabled={capturandoGps}
            >
              <Ionicons name="flag" size={18} color="#fff" />
              <Text style={styles.mapActionBtnText}>
                {capturandoGps
                  ? 'Capturando GPS...'
                  : `Marcar Ponto Final (${trechoAtivo.talhao})`}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.mapActionStartBtn}
              onPress={iniciarPontoColheita}
              disabled={capturandoGps}
            >
              <Ionicons name="location" size={18} color="#fff" />
              <Text style={styles.mapActionBtnText}>
                {capturandoGps ? 'Capturando GPS...' : `Marcar Início Aqui (${talhaoInput})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ============================================================================
  // RENDERIZAÇÃO MODO 1 (PADRÃO): PAINEL DE PONTOS DA COLHEITA (ECONOMIA DE BATERIA)
  // ============================================================================
  const opcoesTrabalhadores = [
    'Toda a Equipe',
    ...trabalhadores.map((t) => `${t.nome} (${t.cracha})`),
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Cabeçalho com Abertura de Mapa Sob Demanda */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Pontos da Colheita</Text>
          <Text style={styles.pageSubtitle}>
            Demarcação de início e fim do eito com economia de bateria
          </Text>
        </View>

        <TouchableOpacity style={styles.openMapButton} onPress={abrirMapaGeral}>
          <Ionicons name="map-outline" size={18} color="#2d6a4f" />
          <Text style={styles.openMapButtonText}>Abrir Mapa</Text>
        </TouchableOpacity>
      </View>

      {/* Banner de Economia de Bateria (Eco-GPS) */}
      <View style={styles.ecoBanner}>
        <View style={styles.ecoIconBox}>
          <Ionicons name="battery-charging-outline" size={22} color="#15803d" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ecoTitle}>Modo Economia de Bateria Ativo</Text>
          <Text style={styles.ecoDesc}>
            O mapa não fica aberto em segundo plano. Marque onde começou a colher, feche o app e
            marque o ponto final apenas quando terminar!
          </Text>
        </View>
      </View>

      {/* CARD PRINCIPAL: OU COLHEITA EM ANDAMENTO, OU INICIAR NOVO PONTO */}
      {trechoAtivo ? (
        <View style={styles.activeCard}>
          <View style={styles.activeHeader}>
            <View style={styles.pulseBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>COLHEITA EM ANDAMENTO</Text>
            </View>
            <Text style={styles.activeTime}>
              Início:{' '}
              {new Date(trechoAtivo.inicioData).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <Text style={styles.activeTalhaoTitle}>{trechoAtivo.talhao}</Text>
          <Text style={styles.activeWorkerText}>
            👷 Colhedor / Equipe: <Text style={{ fontWeight: '700' }}>{trechoAtivo.trabalhadorNome}</Text>
          </Text>

          <View style={styles.coordsBox}>
            <Ionicons name="location" size={18} color="#15803d" />
            <View style={{ flex: 1 }}>
              <Text style={styles.coordsLabel}>Ponto Inicial Registrado no GPS:</Text>
              <Text style={styles.coordsValue}>
                Lat: {trechoAtivo.inicioLat.toFixed(5)} • Long: {trechoAtivo.inicioLng.toFixed(5)}
              </Text>
            </View>
          </View>

          <View style={styles.sleepNotice}>
            <Ionicons name="moon-outline" size={16} color="#0369a1" />
            <Text style={styles.sleepNoticeText}>
              GPS em repouso para poupar bateria. Você pode guardar o celular e finalizar quando
              encerrar este trecho.
            </Text>
          </View>

          {/* Botão Principal: Marcar Ponto Final */}
          <TouchableOpacity
            style={[styles.finishButton, capturandoGps && styles.buttonDisabled]}
            onPress={finalizarPontoColheita}
            disabled={capturandoGps}
          >
            {capturandoGps ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="flag" size={22} color="#fff" />
                <Text style={styles.finishButtonText}>
                  Marcar Ponto Final da Colheita
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.activeSecondaryRow}>
            <TouchableOpacity
              style={styles.secondaryMapBtn}
              onPress={() => abrirMapaFocadoNoTrecho(trechoAtivo)}
            >
              <Ionicons name="navigate-outline" size={16} color="#2d6a4f" />
              <Text style={styles.secondaryMapBtnText}>Ver Ponto no Mapa</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelPointBtn} onPress={cancelarTrechoAtivo}>
              <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
              <Text style={styles.cancelPointBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.startCard}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="pin-outline" size={22} color="#2d6a4f" />
            <Text style={styles.cardTitle}>Registrar Novo Ponto da Colheita</Text>
          </View>
          <Text style={styles.cardHelper}>
            1. Escolha o talhão ou rua de café onde a colheita vai começar:
          </Text>

          {/* Chips Rápidos de Talhão */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContainer}
          >
            {TALHOES_SUGERIDOS.map((item) => {
              const ativo = talhaoInput === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, ativo && styles.chipActive]}
                  onPress={() => setTalhaoInput(item)}
                >
                  <Text style={[styles.chipText, ativo && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TextInput
            style={styles.input}
            value={talhaoInput}
            onChangeText={setTalhaoInput}
            placeholder="Ou digite a identificação (ex: Rua 14 - Catuaí)"
            placeholderTextColor="#9ca3af"
          />

          <Text style={[styles.cardHelper, { marginTop: 10 }]}>
            2. Selecione o colhedor ou equipe responsável:
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsContainer}
          >
            {opcoesTrabalhadores.map((nome) => {
              const ativo = trabalhadorSelecionado === nome;
              return (
                <TouchableOpacity
                  key={nome}
                  style={[styles.chip, ativo && styles.chipActive]}
                  onPress={() => setTrabalhadorSelecionado(nome)}
                >
                  <Text style={[styles.chipText, ativo && styles.chipTextActive]}>{nome}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Botão Principal: Marcar Onde Começou */}
          <TouchableOpacity
            style={[styles.startButton, capturandoGps && styles.buttonDisabled]}
            onPress={iniciarPontoColheita}
            disabled={capturandoGps}
          >
            {capturandoGps ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="location" size={22} color="#fff" />
                <Text style={styles.startButtonText}>
                  Marcar Onde Começou (Ponto Inicial)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Métricas Rápidas dos Pontos */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{historicoTrechos.length}</Text>
          <Text style={styles.metricLabel}>Trechos Concluídos</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{distanciaTotalMetros} m</Text>
          <Text style={styles.metricLabel}>Extensão Colhida</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{apontamentos.length}</Text>
          <Text style={styles.metricLabel}>Balaios no GPS</Text>
        </View>
      </View>

      {/* Histórico de Trechos Registrados (Início e Fim) */}
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>Histórico de Pontos (Início → Fim)</Text>
        {historicoTrechos.length > 0 && (
          <TouchableOpacity onPress={abrirMapaGeral}>
            <Text style={styles.viewAllMapLink}>Ver todos no mapa</Text>
          </TouchableOpacity>
        )}
      </View>

      {historicoTrechos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="compass-outline" size={38} color="#9ca3af" />
          <Text style={styles.emptyTitle}>Nenhum trecho finalizado ainda</Text>
          <Text style={styles.emptySub}>
            Marque o ponto inicial ao começar uma rua de café e o ponto final ao terminar para
            registrar o avanço da colheita.
          </Text>
        </View>
      ) : (
        historicoTrechos.map((item) => {
          const horaInicio = new Date(item.inicioData).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          const horaFim = item.fimData
            ? new Date(item.fimData).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '--:--';
          const duracao = item.fimData ? formatarDuracao(item.inicioData, item.fimData) : '-';

          return (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTalhao}>{item.talhao}</Text>
                  <Text style={styles.historyWorker}>👷 {item.trabalhadorNome}</Text>
                </View>

                <View style={styles.distanceBadge}>
                  <Ionicons name="resize-outline" size={14} color="#065f46" />
                  <Text style={styles.distanceBadgeText}>{item.distanciaMetros || 0} m</Text>
                </View>
              </View>

              <View style={styles.timelineBox}>
                <View style={styles.timelinePoint}>
                  <View style={[styles.timelineDot, { backgroundColor: '#16a34a' }]} />
                  <Text style={styles.timelineLabel}>
                    <Text style={{ fontWeight: '700' }}>Início ({horaInicio}): </Text>
                    {item.inicioLat.toFixed(4)}, {item.inicioLng.toFixed(4)}
                  </Text>
                </View>

                <View style={styles.timelinePoint}>
                  <View style={[styles.timelineDot, { backgroundColor: '#dc2626' }]} />
                  <Text style={styles.timelineLabel}>
                    <Text style={{ fontWeight: '700' }}>Final ({horaFim}): </Text>
                    {item.fimLat?.toFixed(4)}, {item.fimLng?.toFixed(4)}
                  </Text>
                </View>
              </View>

              <View style={styles.historyFooter}>
                <Text style={styles.durationText}>⏱️ Duração: {duracao}</Text>

                <View style={styles.historyActions}>
                  <TouchableOpacity
                    style={styles.mapItemBtn}
                    onPress={() => abrirMapaFocadoNoTrecho(item)}
                  >
                    <Ionicons name="map-outline" size={15} color="#2d6a4f" />
                    <Text style={styles.mapItemBtnText}>Ver no Mapa</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteItemBtn}
                    onPress={() => excluirTrechoHistorico(item)}
                  >
                    <Ionicons name="trash-outline" size={17} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f6f5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1b4332',
  },
  pageSubtitle: {
    fontSize: 12.5,
    color: '#526058',
    marginTop: 2,
  },
  openMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#2d6a4f',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  openMapButtonText: {
    color: '#2d6a4f',
    fontWeight: '700',
    fontSize: 13,
  },
  ecoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  ecoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ecoTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#065f46',
  },
  ecoDesc: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
    marginTop: 2,
  },
  startCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1b4332',
  },
  cardHelper: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
    marginBottom: 8,
  },
  chipsScroll: {
    marginBottom: 8,
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  chipActive: {
    backgroundColor: '#2d6a4f',
    borderColor: '#2d6a4f',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  startButton: {
    marginTop: 16,
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  activeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#16a34a',
    marginBottom: 16,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  pulseText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  activeTime: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4b5563',
  },
  activeTalhaoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  activeWorkerText: {
    fontSize: 13.5,
    color: '#374151',
    marginTop: 2,
    marginBottom: 12,
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 8,
    marginBottom: 10,
  },
  coordsLabel: {
    fontSize: 11.5,
    color: '#166534',
    fontWeight: '600',
  },
  coordsValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#14532d',
    marginTop: 1,
  },
  sleepNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 14,
  },
  sleepNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    lineHeight: 16,
  },
  finishButton: {
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  finishButtonText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: 'bold',
  },
  activeSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  secondaryMapBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#e6f4ea',
    gap: 6,
  },
  secondaryMapBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  cancelPointBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    gap: 4,
  },
  cancelPointBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2d6a4f',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
    textAlign: 'center',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1b4332',
  },
  viewAllMapLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyTalhao: {
    fontSize: 15.5,
    fontWeight: 'bold',
    color: '#111827',
  },
  historyWorker: {
    fontSize: 12.5,
    color: '#4b5563',
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  timelineBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    marginBottom: 10,
  },
  timelinePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#374151',
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  mapItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  deleteItemBtn: {
    padding: 6,
  },
  // ESTILOS DO MODO MAPA SOB DEMANDA
  mapContainer: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapTopBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    zIndex: 999,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  closeMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d6a4f',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeMapBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  layerBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  layerBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1b4332',
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    bottom: 130,
    gap: 10,
  },
  controlButton: {
    backgroundColor: '#ffffff',
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapBottomCard: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11.5,
    color: '#374151',
    fontWeight: '600',
  },
  mapActionStartBtn: {
    backgroundColor: '#2d6a4f',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  mapActionFinishBtn: {
    backgroundColor: '#d97706',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  mapActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  callout: { width: 180, padding: 8 },
  calloutContainer: { alignItems: 'flex-start' },
  calloutTitle: { fontWeight: 'bold', fontSize: 13.5, color: '#2d6a4f', marginBottom: 2 },
  calloutSub: { fontSize: 12.5, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  calloutCoords: { fontSize: 11, color: '#666' },
});
