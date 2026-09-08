import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { StyleSheet, View, Text, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { container } from '@/src/fectorie/container';
import { Observation } from '@/src/domain/entities/Observation';

// Chave da API do Google Maps (configurável via variável de ambiente ou direto aqui)
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface DestinationPoint {
  latitude: number;
  longitude: number;
  title: string;
}

export default function Maps() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [destination, setDestination] = useState<DestinationPoint | null>(null);

  // Pede localização ao entrar na tela do mapa
  useEffect(() => {
    async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão negada", "Precisamos de acesso à sua localização para exibir o mapa.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    }
    getCurrentLocation();
  }, []);

  // Recarrega as observações salvas sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      container.listObservations.execute()
        .then((items) => {
          if (isMounted) {
            setObservations(items);
          }
        })
        .catch((error) => {
          console.error("Erro ao carregar observações no mapa:", error);
        });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  // Centraliza a visualização na posição atual
  function centerOnUser() {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 800);
    }
  }

  // Limpa o destino selecionado
  function clearDestination() {
    setDestination(null);
    centerOnUser();
  }

  // Se não tem localização ainda, mostra o loading
  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Obtendo localização...</Text>
      </View>
    );
  }

  // Prepara as coordenadas para o traçado da Polyline (ordem das observações)
  const polylineCoordinates = observations.map((obs) => ({
    latitude: obs.coordinates.latitude,
    longitude: obs.coordinates.longitude,
  }));

  const userCoords = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };

  return (
    <View style={styles.container}>
      {/* Barra flutuante de busca de locais com autocompletar (GooglePlacesAutocomplete) */}
      <View style={styles.searchContainer}>
        <GooglePlacesAutocomplete
          placeholder="Buscar endereço ou local..."
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details?.geometry?.location) {
              const newDest: DestinationPoint = {
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                title: data.description || 'Destino pesquisado',
              };
              setDestination(newDest);

              mapRef.current?.animateToRegion({
                latitude: newDest.latitude,
                longitude: newDest.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }, 1000);
            }
          }}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'pt-BR',
          }}
          styles={{
            container: styles.autocompleteContainer,
            textInputContainer: styles.textInputContainer,
            textInput: styles.textInput,
            listView: styles.listView,
          }}
          enablePoweredByContainer={false}
          debounce={300}
        />
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={false}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Marcador da posição atual do usuário */}
        <Marker
          coordinate={userCoords}
          title="Minha Posição Atual"
          description="Você está aqui"
          pinColor="blue"
        />

        {/* Marcadores de cada observação salva */}
        {observations.map((obs, index) => (
          <Marker
            key={obs.id}
            coordinate={{
              latitude: obs.coordinates.latitude,
              longitude: obs.coordinates.longitude,
            }}
            title={`Observação #${index + 1}`}
            description={`Lat: ${obs.coordinates.latitude.toFixed(4)} | Long: ${obs.coordinates.longitude.toFixed(4)}`}
            pinColor="red"
          >
            <Callout tooltip={false} style={styles.callout}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Observação #{index + 1}</Text>
                <Text style={styles.calloutCoords}>
                  {obs.coordinates.latitude.toFixed(4)}, {obs.coordinates.longitude.toFixed(4)}
                </Text>
                {obs.photo ? (
                  <Image
                    source={{ uri: obs.photo }}
                    style={styles.calloutImage}
                    resizeMode="cover"
                  />
                ) : null}
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Marcador do destino pesquisado */}
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

        {/* Rota viária (turn-by-turn) com MapViewDirections se houver chave do Google */}
        {destination && GOOGLE_MAPS_API_KEY !== '' && (
          <MapViewDirections
            origin={userCoords}
            destination={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#10b981"
            onError={(errorMessage) => {
              console.warn('Erro ao calcular rota MapViewDirections:', errorMessage);
            }}
          />
        )}

        {/* Fallback de rota direta até o destino quando sem chave de API do Google */}
        {destination && GOOGLE_MAPS_API_KEY === '' && (
          <Polyline
            coordinates={[userCoords, { latitude: destination.latitude, longitude: destination.longitude }]}
            strokeColor="#10b981"
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}

        {/* Traçado da Polyline conectando todas as observações registradas */}
        {polylineCoordinates.length > 1 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor="#2563eb"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Botões flutuantes de ação rápida */}
      <View style={styles.floatingControls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#2563eb" />
        </TouchableOpacity>

        {destination && (
          <TouchableOpacity style={[styles.controlButton, styles.clearButton]} onPress={clearDestination}>
            <Ionicons name="close-circle" size={24} color="#dc2626" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  autocompleteContainer: {
    flex: 0,
  },
  textInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  textInput: {
    height: 48,
    color: '#333',
    fontSize: 15,
    paddingHorizontal: 12,
  },
  listView: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  clearButton: {
    backgroundColor: '#fee2e2',
  },
  callout: {
    width: 180,
    padding: 6,
  },
  calloutContainer: {
    alignItems: 'center',
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  calloutCoords: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  calloutImage: {
    width: 160,
    height: 100,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
  },
});
