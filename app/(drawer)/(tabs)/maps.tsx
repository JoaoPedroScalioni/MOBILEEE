import React, { useState, useEffect, useCallback } from 'react';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { StyleSheet, View, Text, ActivityIndicator, Alert, Image } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { container } from '@/src/fectorie/container';
import { Observation } from '@/src/domain/entities/Observation';

export default function Maps() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);

  // Pede localização ao entrar na tela do mapa
  useEffect(() => {
    async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão negada", "Precisamos de acesso à sua localização para salvar a observação.");
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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Marcador da posição atual do usuário */}
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
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

        {/* Traçado da Polyline conectando todas as observações registradas */}
        {polylineCoordinates.length > 1 && (
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor="#2563eb"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}
      </MapView>
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
