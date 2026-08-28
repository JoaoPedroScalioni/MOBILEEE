import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'
import React from 'react';

export default function TabLayout() {
  return (
    // TABS: Define o menu inferior (barra de abas).
    // Se o professor pedir para adicionar uma nova aba, crie um arquivo .tsx na pasta (tabs)
    // e adicione um novo <Tabs.Screen> aqui abaixo.
    <Tabs
      screenOptions={{
        headerShown: false, // Esconde o cabeçalho no menu de abas, pois o Drawer já tem um.
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Camera',
          tabBarIcon: () => <Ionicons name="camera-outline" size={24} color={"black"}/>,
        }}
      />
      <Tabs.Screen
        name="maps"
        options={{
          title: 'Maps',
          tabBarIcon: () => <Ionicons name="map-outline" size={24} color={"black"}/>,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Lista',
          tabBarIcon: () => <Ionicons name="list-outline" size={24} color={"black"}/>,
        }}
      />
    </Tabs>
  );
}
