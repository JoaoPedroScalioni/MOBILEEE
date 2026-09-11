import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Apontamento',
          tabBarIcon: () => <Ionicons name="cafe-outline" size={24} color={"black"}/>,
        }}
      />
      <Tabs.Screen
        name="trabalhadores"
        options={{
          title: 'Trabalhadores',
          tabBarIcon: () => <Ionicons name="people-outline" size={24} color={"black"}/>,
        }}
      />
      <Tabs.Screen
        name="despesas"
        options={{
          title: 'Despesas',
          tabBarIcon: () => <Ionicons name="wallet-outline" size={24} color={"black"}/>,
        }}
      />
      <Tabs.Screen
        name="mapas"
        options={{
          title: 'Mapa',
          tabBarIcon: () => <Ionicons name="map-outline" size={24} color={"black"}/>,
        }}
      />
    </Tabs>
  );
}