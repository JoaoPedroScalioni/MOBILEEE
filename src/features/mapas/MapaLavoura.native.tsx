import React, { useCallback, useEffect, useRef, useState } from 'react';
import MapView, { Callout, Marker, Polyline, UrlTile } from 'react-native-maps';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
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
import {
  obterLocalizacaoSegura,
  COORDENADAS_PADRAO_FAZENDA,
  LocationResult,
} from '@/src/shared/utils/locationHelper';

interface DestinationPoint {
  latitude: number;
  longitude: number;
  title: string;
}

interface SearchSuggestion {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
}

type MapLayerType = 'osm' | 'satellite' | 'terrain';

const TILE_SERVERS: Record<MapLayerType, { url: string; maxZ: number }> = {
  osm: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZ: 20,
  },
  satellite: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZ: 20,
  },
  terrain: {
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZ: 20,
  },
};

export function MapaLavoura() {
  const mapRef = useRef<MapView>(null);
  const [locationResult, setLocationResult] = useState<LocationResult>({
    ...COORDENADAS_PADRAO_FAZENDA,
    isFallback: true,
    status: 'fallback',
  });
  const [carregandoGps, setCarregandoGps] = useState(false);
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [destination, setDestination] = useState<DestinationPoint | null>(null);
  const [mapLayer, setMapLayer] = useState<MapLayerType>('osm');

  // Busca e sugestões
  const [termoBusca, setTermoBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<SearchSuggestion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const atualizarPosicao = useCallback(async () => {
    setCarregandoGps(true);
    try {
      const res = await obterLocalizacaoSegura(4000);
      setLocationResult(res);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: res.latitude,
            longitude: res.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          800,
        );
      }
    } finally {
      setCarregandoGps(false);
    }
  }, []);

  useEffect(() => {
    atualizarPosicao();
  }, [atualizarPosicao]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      container.listarApontamentos
        .execute()
        .then((items) => {
          if (isMounted) setApontamentos(items);
        })
        .catch((error) => {
          console.error('Erro ao carregar apontamentos no mapa:', error);
        });
      return () => {
        isMounted = false;
      };
    }, []),
  );

  // Busca com autocomplete via Nominatim (OpenStreetMap Search API gratuito)
  const buscarSugestoes = (texto: string) => {
    setTermoBusca(texto);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!texto.trim() || texto.trim().length < 3) {
      setSugestoes([]);
      setBuscando(false);
      return;
    }

    // Se for coordenada direta, não precisa buscar na API
    const partes = texto.split(/[,;\s]+/).map(Number);
    if (partes.length >= 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
      setSugestoes([]);
      return;
    }

    setBuscando(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = encodeURIComponent(texto.trim());
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=br&limit=5`,
          {
            headers: {
              'User-Agent': 'SafraCafeApp/1.0',
            },
          },
        );
        if (response.ok) {
          const dados: SearchSuggestion[] = await response.json();
          setSugestoes(dados);
        }
      } catch (err) {
        console.warn('Falha na busca online de locais:', err);
      } finally {
        setBuscando(false);
      }
    }, 400);
  };

  function selecionarSugestao(item: SearchSuggestion) {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (!isNaN(lat) && !isNaN(lng)) {
      Keyboard.dismiss();
      setSugestoes([]);
      setTermoBusca(item.display_name.split(',')[0]);
      const newDest: DestinationPoint = {
        latitude: lat,
        longitude: lng,
        title: item.display_name.split(',')[0] || 'Local pesquisado',
      };
      setDestination(newDest);
      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        900,
      );
    }
  }

  function executarBuscaManual() {
    Keyboard.dismiss();
    setSugestoes([]);
    const texto = termoBusca.trim();
    if (!texto) return;

    // 1. Tenta formato de coordenadas: "-21.2488, -44.9998"
    const partes = texto.split(/[,;\s]+/).map(Number);
    if (partes.length >= 2 && !isNaN(partes[0]) && !isNaN(partes[1])) {
      const lat = partes[0];
      const lng = partes[1];
      const newDest: DestinationPoint = {
        latitude: lat,
        longitude: lng,
        title: `Ponto (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
      setDestination(newDest);
      mapRef.current?.animateToRegion(
        {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        800,
      );
      return;
    }

    // 2. Tenta buscar pelo número do balaio (ex: "#1" ou "1")
    const num = parseInt(texto.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0 && num <= apontamentos.length) {
      const a = apontamentos[num - 1];
      const newDest: DestinationPoint = {
        latitude: a.coordenadas.latitude,
        longitude: a.coordenadas.longitude,
        title: `Balaio #${num} (${a.quantidade.litros}L)`,
      };
      setDestination(newDest);
      mapRef.current?.animateToRegion(
        {
          latitude: a.coordenadas.latitude,
          longitude: a.coordenadas.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        800,
      );
      return;
    }

    // 3. Tenta primeira sugestão se houver
    if (sugestoes.length > 0) {
      selecionarSugestao(sugestoes[0]);
    }
  }

  function centerOnUser() {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: locationResult.latitude,
          longitude: locationResult.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        800,
      );
    }
  }

  function fitAllApontamentos() {
    if (apontamentos.length === 0 || !mapRef.current) return;
    const coords = apontamentos.map((a) => ({
      latitude: a.coordenadas.latitude,
      longitude: a.coordenadas.longitude,
    }));
    coords.push({
      latitude: locationResult.latitude,
      longitude: locationResult.longitude,
    });
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 120, right: 60, bottom: 120, left: 60 },
      animated: true,
    });
  }

  function clearDestination() {
    setDestination(null);
    setTermoBusca('');
    setSugestoes([]);
    centerOnUser();
  }

  function alternarCamadaMapa() {
    if (mapLayer === 'osm') setMapLayer('satellite');
    else if (mapLayer === 'satellite') setMapLayer('terrain');
    else setMapLayer('osm');
  }

  const polylineCoordinates = apontamentos.map((a) => ({
    latitude: a.coordenadas.latitude,
    longitude: a.coordenadas.longitude,
  }));

  const userCoords = {
    latitude: locationResult.latitude,
    longitude: locationResult.longitude,
  };

  return (
    <View style={styles.container}>
      {/* Barra de Pesquisa com Sugestões */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#2d6a4f" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cidade, endereço ou coordenada..."
            placeholderTextColor="#999"
            value={termoBusca}
            onChangeText={buscarSugestoes}
            onSubmitEditing={executarBuscaManual}
            returnKeyType="search"
          />
          {buscando && <ActivityIndicator size="small" color="#2d6a4f" style={{ marginRight: 6 }} />}
          {termoBusca.length > 0 && !buscando && (
            <TouchableOpacity onPress={() => { setTermoBusca(''); setSugestoes([]); }} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={executarBuscaManual} style={styles.searchBtn}>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Lista de Sugestões Dropdown */}
        {sugestoes.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={sugestoes}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => selecionarSugestao(item)}
                >
                  <Ionicons name="location-outline" size={18} color="#2d6a4f" style={{ marginRight: 8, marginTop: 2 }} />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="none"
        showsUserLocation={false}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: locationResult.latitude,
          longitude: locationResult.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Renderizador de Camadas de Mapa Universal (OSM / Satélite / Terreno) */}
        <UrlTile
          urlTemplate={TILE_SERVERS[mapLayer].url}
          maximumZ={TILE_SERVERS[mapLayer].maxZ}
          flipY={false}
          zIndex={-1}
        />

        {/* Marcador da Posição Atual do Usuário */}
        <Marker
          coordinate={userCoords}
          title={locationResult.isFallback ? 'Localização de Referência' : 'Minha Posição'}
          description={
            locationResult.isFallback
              ? 'Região cafeeira (Lavras / Sul de MG)'
              : 'Você está aqui'
          }
          pinColor={locationResult.isFallback ? 'orange' : 'blue'}
        />

        {/* Marcadores dos Balaios Colhidos */}
        {apontamentos.map((a, index) => (
          <Marker
            key={a.id}
            coordinate={{
              latitude: a.coordenadas.latitude,
              longitude: a.coordenadas.longitude,
            }}
            title={`Balaio #${index + 1} (${a.quantidade.litros}L)`}
            description={`Lat: ${a.coordenadas.latitude.toFixed(4)} | Long: ${a.coordenadas.longitude.toFixed(4)}`}
            pinColor="#2d6a4f"
          >
            <Callout tooltip={false} style={styles.callout}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Balaio #{index + 1}</Text>
                <Text style={styles.calloutSub}>
                  {a.quantidade.litros} Litros colhidos
                </Text>
                <Text style={styles.calloutCoords}>
                  {new Date(a.data).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} · {new Date(a.data).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Marcador do Ponto de Destino Pesquisado */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={destination.title}
            pinColor="green"
          />
        )}

        {/* Linha traçada até o destino */}
        {destination && (
          <Polyline
            coordinates={[
              userCoords,
              { latitude: destination.latitude, longitude: destination.longitude },
            ]}
            strokeColor="#10b981"
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}

        {polylineCoordinates.length > 1 && (
          <Polyline coordinates={polylineCoordinates} strokeColor="#2d6a4f" strokeWidth={4} />
        )}
      </MapView>

      {/* Indicador de status de GPS */}
      <View style={styles.statusBar}>
        <Ionicons
          name={locationResult.isFallback ? 'warning-outline' : 'navigate-circle-outline'}
          size={16}
          color={locationResult.isFallback ? '#d97706' : '#16a34a'}
        />
        <Text style={styles.statusText}>
          {locationResult.isFallback
            ? 'GPS aguardando sinal (ref. Sul de MG)'
            : 'GPS conectado em tempo real'}
        </Text>
        {carregandoGps && <ActivityIndicator size="small" color="#2d6a4f" style={{ marginLeft: 6 }} />}
      </View>

      {/* Controles Flutuantes da Direita */}
      <View style={styles.floatingControls}>
        {/* Alternador de Camada: OSM / Satélite / Terreno */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={alternarCamadaMapa}
          accessibilityLabel="Mudar tipo de mapa"
        >
          <Ionicons
            name={mapLayer === 'satellite' ? 'earth' : mapLayer === 'terrain' ? 'layers-outline' : 'map-outline'}
            size={22}
            color="#2d6a4f"
          />
        </TouchableOpacity>

        {/* Centralizar GPS */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={atualizarPosicao}
          accessibilityLabel="Atualizar GPS"
        >
          <Ionicons name="locate" size={24} color="#2d6a4f" />
        </TouchableOpacity>

        {/* Enquadrar todos os balaios */}
        {apontamentos.length > 0 && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={fitAllApontamentos}
            accessibilityLabel="Enquadrar toda a colheita"
          >
            <Ionicons name="expand" size={22} color="#2d6a4f" />
          </TouchableOpacity>
        )}

        {/* Limpar destino */}
        {destination && (
          <TouchableOpacity
            style={[styles.controlButton, styles.clearButton]}
            onPress={clearDestination}
          >
            <Ionicons name="close-circle" size={24} color="#dc2626" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e5e7eb' },
  map: { width: '100%', height: '100%' },
  searchContainer: {
    position: 'absolute',
    top: 48,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
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
  searchBtn: {
    backgroundColor: '#2d6a4f',
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  statusBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginLeft: 6,
  },
  floatingControls: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    gap: 12,
  },
  controlButton: {
    backgroundColor: '#fff',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clearButton: { backgroundColor: '#fee2e2' },
  callout: { width: 190, padding: 8 },
  calloutContainer: { alignItems: 'flex-start' },
  calloutTitle: { fontWeight: 'bold', fontSize: 14, color: '#2d6a4f', marginBottom: 2 },
  calloutSub: { fontSize: 13, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  calloutCoords: { fontSize: 11, color: '#666' },
});