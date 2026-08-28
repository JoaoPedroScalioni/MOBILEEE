import { Drawer } from 'expo-router/drawer'

// DRAWER LAYOUT: Define o menu lateral da aplicação.
export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        // Se precisar mudar a cor do cabeçalho globalmente, adicione aqui: headerStyle: { backgroundColor: 'red' }
      }}
    >
      {/* 
        Cada Drawer.Screen é um item no menu lateral.
        Se o professor pedir para adicionar uma nova página no menu, 
        crie o arquivo .tsx na pasta (drawer) e adicione um novo <Drawer.Screen name="nomedoarquivo" /> aqui.
      */}
      <Drawer.Screen
        name='(tabs)'
        options={{
          drawerLabel: 'Painel', // Texto que aparece no menu lateral
          title: 'Painel' // Texto que aparece no topo da tela (header)
        }}
      />
      <Drawer.Screen
        name='hellopage'
        options={{
          drawerLabel: 'Hello',
          title: 'Hello'
        }}
      />
    </Drawer>
  )
}
