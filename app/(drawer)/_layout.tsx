import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, LogBox, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/src/adapters/auth/AuthContext';
import { triggerAutoSync } from '@/src/shared/utils/autoSync';

LogBox.ignoreLogs([
  "Codegen didn't run for REASharedTransitionBoundaryView",
  'REASharedTransitionBoundaryView',
]);

export default function DrawerLayout() {
  const { logout, status } = useAuth();
  const [modalSairVisivel, setModalSairVisivel] = useState(false);
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    // Sincronização automática na inicialização
    triggerAutoSync();

    // Verificação periódica a cada 15 segundos (envio automático assim que houver internet)
    const timer = setInterval(() => {
      triggerAutoSync();
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/');
    }
  }, [status]);

  const executarLogout = async () => {
    if (saindo) return;
    setSaindo(true);
    try {
      await logout();
    } finally {
      setModalSairVisivel(false);
      setSaindo(false);
      router.replace('/');
    }
  };

  return (
    <>
      <Drawer
        screenOptions={{
          headerTintColor: '#1a1a1a',
          headerLeft: () => null,
          swipeEnabled: false,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, gap: 4 }}>
              {/* Botão de nuvem/sincronização oculto para a apresentação atual (próxima etapa):
              <TouchableOpacity
                onPress={() => router.push('/modal')}
                style={{ padding: 6 }}
                accessibilityLabel="Central de Sincronização e Nuvem"
              >
                <Ionicons name="cloud-upload-outline" size={24} color="#2d6a4f" />
              </TouchableOpacity>
              */}

              <TouchableOpacity
                onPress={() => setModalSairVisivel(true)}
                style={styles.logoutHeaderBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Sair da Conta"
              >
                <Ionicons name="log-out-outline" size={22} color="#dc2626" />
                <Text style={styles.logoutHeaderText}>Sair</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: 'Painel',
            title: 'SafraCafé',
          }}
        />
      </Drawer>

      {/* Modal de Confirmação de Saída (100% compatível com Android, iOS e Web) */}
      <Modal
        visible={modalSairVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalSairVisivel(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="log-out-outline" size={28} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>Sair da Conta</Text>
            <Text style={styles.modalSubtitle}>
              Deseja realmente encerrar a sessão e voltar para a tela de login do SafraCafé?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalSairVisivel(false)}
                disabled={saindo}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmLogoutBtn}
                onPress={executarLogout}
                disabled={saindo}
              >
                <Text style={styles.confirmLogoutBtnText}>
                  {saindo ? 'Saindo...' : 'Sair da Conta'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  logoutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dc2626',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  confirmLogoutBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmLogoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
