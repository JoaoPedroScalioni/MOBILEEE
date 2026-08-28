import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { container } from "@/src/fectorie/container";

export default function Camera() {
  // ESTADOS:
  // location: Guarda a localização atual do usuário (latitude e longitude)
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  // facing: Guarda de qual lado a câmera está (traseira='back', frontal='front')
  const [facing, setFacing] = useState<CameraType>('back');
  // permission: Controle se o usuário deu permissão para acessar a câmera
  const [permission, requestPermission] = useCameraPermissions();
  // cameraRef: Referência usada para "tirar a foto" chamando funções da câmera
  const [uri, setUri] = useState<string | null>(null); // Guarda a foto tirada

  // useEffect roda quando a tela abre. Ele pede a permissão de localização e pega as coordenadas.
  // Se o professor pedir para não pegar localização, remova esse bloco.
  useEffect(()=>{
    async function getCurrentLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão negada", "Precisamos de acesso à sua localização para salvar a observação.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }
    getCurrentLocation();
  },[])
  
  if (!permission) {
    return <View />
  }
  
  if (!permission.granted) {
    return (
      <View>
        <Text>Permissão negada</Text>
        <Button title="Conceder permissão" onPress={requestPermission} />
      </View>
    )
  } 

  // FUNÇÃO DE SALVAR: Envia a foto e a localização para o container do repositório
  // Se pedirem para salvar um novo campo (ex: descrição), adicione ele no objeto abaixo e pegue de um state.
  async function savePhoto() {
    /* */

    await container.registerObservation.execute({
      photo: String(uri),
      latitude: Number(location?.coords.latitude),
      longitude: Number(location?.coords.longitude),
    })
    setUri(null); // Volta para a tela da câmera ao limpar a URI
    Alert.alert("Sucesso", "Foto salva com sucesso!");
  }

  function toggleCameraFacing() {
    setFacing(current => current === 'back' ? 'front' : 'back');
  }

  // FUNÇÃO DE TIRAR FOTO
  async function takePicture() {
    if (cameraRef.current) {
      // takePictureAsync tira a foto de verdade
      const foto = await cameraRef.current.takePictureAsync();
      if (foto.uri) {
        setUri(foto.uri); // Salva a uri no state (vai acionar a view mostrarFoto)
      }
    }
  }

  function mostrarFoto(){
    if (uri) {
      return (
        <>
          <Image source={{ uri }} style={{ flex: 1 }}/>
          <View style={styles.buttonFlip}>
            <TouchableOpacity style={styles.button} onPress={savePhoto}>
              <Text style={styles.text}>Salvar</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonCapture}>
            <TouchableOpacity style={styles.button} onPress={() => setUri(null)}>
              <Text style={styles.text}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </>
      )
    }
  }

  function viewCamera(){
    return (
      <>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
        <View style={styles.buttonFlip}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Virar Câmera</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonCapture}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.text}>Capturar</Text>
          </TouchableOpacity>
        </View>
      </>
    )
  }

  return (
    <View style={styles.camera}>
      {uri ? mostrarFoto() : viewCamera()}
    </View>
  );
}

const styles = StyleSheet.create({
  camera: {
    flex: 1,
  },
  buttonFlip: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 10,
  },
  buttonCapture: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
});