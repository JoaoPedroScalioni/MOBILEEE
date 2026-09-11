import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { StyleSheet, View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { container } from '@/src/factory/container';
import { Apontamento } from '@/src/domain/entities/Apontamento';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface DestinationPoint {
  latitude: number;
  longitude: number;
  title: string;
}

export default function Mapas() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [destination, setDestination] = useState<DestinationPoint | null>(null);

  useEffect(() => {
    async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos de acesso à sua localização para exibir o mapa.');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    }
    getCurrentLocation();
  }, []);

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

  function centerOnUser() {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        800,
      );
    }
  }

  function clearDestination() {
    setDestination(null);
    centerOnUser();
  }

  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2d6a4f" />
        <Text style={styles.loadingText}>Obtendo localização...</Text>
      </View>
    );
  }

  const polylineCoordinates = apontamentos.map((a) => ({
    latitude: a.coordenadas.latitude,
    longitude: a.coordenadas.longitude,
  }));

  const userCoords = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };

  return (
    <View style={styles.container}>
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
              mapRef.current?.animateToRegion(
                {
                  latitude: newDest.latitude,
                  longitude: newDest.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                },
                1000,
              );
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
        <Marker
          coordinate={userCoords}
          title="Minha Posição Atual"
          description="Você está aqui"
          pinColor="blue"
        />

        {apontamentos.map((a, index) => (
          <Marker
            key={a.id}
            coordinate={{
              latitude: a.coordenadas.latitude,
              longitude: a.coordenadas.longitude,
            }}
            title={`Balaio #${index + 1}`}
            description={`${a.quantidade.litros} L · Lat: ${a.coordenadas.latitude.toFixed(4)} | Long: ${a.coordenadas.longitude.toFixed(4)}`}
            pinColor="red"
          >
            <Callout tooltip={false} style={styles.callout}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>Balaio #{index + 1}</Text>
                <Text style={styles.calloutCoords}>
                  {a.quantidade.litros} L · {new Date(a.data).toLocaleDateString('pt-BR')}
                </Text>
                <Text style={styles.calloutCoords}>
                  {a.coordenadas.latitude.toFixed(4)}, {a.coordenadas.longitude.toFixed(4)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

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

        {destination && GOOGLE_MAPS_API_KEY === '' && (
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

      <View style={styles.floatingControls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
          <Ionicons name="locate" size={24} color="#2d6a4f" />
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
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  autocompleteContainer: { flex: 0 },
  textInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  textInput: { height: 48, color: '#333', fontSize: 15, paddingHorizontal: 12 },
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
  clearButton: { backgroundColor: '#fee2e2' },
  callout: { width: 180, padding: 6 },
  calloutContainer: { alignItems: 'center' },
  calloutTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  calloutCoords: { fontSize: 11, color: '#666', marginBottom: 2 },
});