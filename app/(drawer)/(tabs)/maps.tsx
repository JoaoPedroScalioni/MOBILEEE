import React, { useState, useEffect } from 'react';
import MapView, { Region } from 'react-native-maps';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';

export default function Maps() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  // Pede localização ao entrar na tela do mapa
  useEffect(() => {
    async function getCurrentLocation(){
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão negada", "Precisamos de acesso à sua localização para salvar a observação.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    };
    getCurrentLocation();
  }, []);

  // Se não tem localização ainda, mostra o loading
  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );  
  }

  // Mostra o mapa
  // Se o professor pedir para adicionar um pino (Marker) para a posição atual,
  // basta adicionar <Marker coordinate={{latitude: ..., longitude: ...}} /> dentro de MapView.
  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        showsUserLocation={true}  // Mostra a bolinha azul
        showsMyLocationButton={true} // Botão de voltar pra minha posição
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      />
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
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  }
});
