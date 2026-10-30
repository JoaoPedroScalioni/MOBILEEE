import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Trabalhador } from '@/src/domain/entities/Trabalhador';
import { Apontamento } from '@/src/domain/entities/Apontamento';
import { container } from '@/src/factory/container';

/**
 * Tela de Detalhes do Trabalhador via Rota Dinâmica [id].
 * 
 * Atende aos marcos de:
 * - 11/ago: Expo Router: Dynamic routes and URL parameters. Passando query parameters.
 *           Usando dynamic route variables e query parameters na página de destino.
 * - 21/ago: Atualizando query parameters sem navegação (router.setParams).
 */
export default function TrabalhadorDetalhesScreen() {
  // Captura os parâmetros dinâmicos da URL e query params
  const params = useLocalSearchParams<{ id: string; origem?: string; tab?: string }>();
  const idTrabalhador = params.id;
  const abaAtiva = params.tab || 'balaios';
  const origemNavegacao = params.origem || 'direto';

  const [trabalhador, setTrabalhador] = useState<Trabalhador | null>(null);
  const [balaios, setBalaios] = useState<Apontamento[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [todosTrabalhadores, todosApontamentos] = await Promise.all([
        container.listarTrabalhadores.execute(),
        container.listarApontamentos.execute(),
      ]);

      const trab = todosTrabalhadores.find((t) => t.id === idTrabalhador) || null;
      setTrabalhador(trab);

      const balaiosDoTrabalhador = todosApontamentos.filter(
        (a) => a.trabalhadorId === idTrabalhador,
      );
      setBalaios(balaiosDoTrabalhador);
    } catch (err) {
      console.error('Erro ao carregar detalhes do trabalhador:', err);
    } finally {
      setCarregando(false);
    }
  }, [idTrabalhador]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  // Demonstração da atualização de query parameter SEM navegação (Marco de 21/ago)
  const mudarAba = (novaAba: 'balaios' | 'estatisticas') => {
    router.setParams({ tab: novaAba });
  };

  const totalBalaios = balaios.length;
  const totalLitros = balaios.reduce((acc, cur) => acc + cur.quantidade.litros, 0);
  const mediaLitrosPorBalaio = totalBalaios > 0 ? (totalLitros / totalBalaios).toFixed(1) : '0';

  if (carregando) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2d6a4f" />
          <Text style={styles.loadingText}>Carregando ficha do trabalhador...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trabalhador) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={54} color="#dc2626" />
          <Text style={styles.errorTitle}>Trabalhador não encontrado</Text>
          <Text style={styles.errorSub}>O ID &quot;{idTrabalhador}&quot; não existe no banco de dados.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra Superior */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Ficha do Trabalhador</Text>
        <View style={styles.badgeOrigem}>
          <Text style={styles.badgeOrigemText}>via {origemNavegacao}</Text>
        </View>
      </View>

      {/* Cartão de Perfil */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {trabalhador.nome.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.workerName}>{trabalhador.nome}</Text>
          <Text style={styles.workerMeta}>
            CPF: {trabalhador.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.crachaTag}>
              <Ionicons name="qr-code-outline" size={14} color="#2d6a4f" />
              <Text style={styles.crachaTagText}>Crachá: {trabalhador.cracha}</Text>
            </View>
            <View style={styles.diariaTag}>
              <Ionicons name="cash-outline" size={14} color="#15803d" />
              <Text style={styles.diariaTagText}>Diária: {trabalhador.diaria.formatar()}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Abas com atualização de Query Parameter (router.setParams) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, abaAtiva === 'balaios' && styles.tabButtonActive]}
          onPress={() => mudarAba('balaios')}
        >
          <Ionicons
            name="basket-outline"
            size={18}
            color={abaAtiva === 'balaios' ? '#2d6a4f' : '#666'}
          />
          <Text style={[styles.tabText, abaAtiva === 'balaios' && styles.tabTextActive]}>
            Balaios ({totalBalaios})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, abaAtiva === 'estatisticas' && styles.tabButtonActive]}
          onPress={() => mudarAba('estatisticas')}
        >
          <Ionicons
            name="stats-chart-outline"
            size={18}
            color={abaAtiva === 'estatisticas' ? '#2d6a4f' : '#666'}
          />
          <Text style={[styles.tabText, abaAtiva === 'estatisticas' && styles.tabTextActive]}>
            Estatísticas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo da Aba Selecionada */}
      {abaAtiva === 'balaios' ? (
        <FlatList
          data={balaios}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Ionicons name="cafe-outline" size={40} color="#ccc" />
              <Text style={styles.emptyTitle}>Nenhum balaio registrado</Text>
              <Text style={styles.emptySub}>
                Este trabalhador ainda não teve balaios de café apontados hoje.
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemIcon}>
                <Ionicons name="cafe" size={20} color="#2d6a4f" />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle}>Balaio #{index + 1}</Text>
                <Text style={styles.itemSub}>
                  {new Date(item.data).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} · {new Date(item.data).toLocaleDateString('pt-BR')}
                </Text>
                <Text style={styles.itemCoords}>
                  📍 {item.coordenadas.latitude.toFixed(4)}, {item.coordenadas.longitude.toFixed(4)}
                </Text>
              </View>
              <View style={styles.itemBadge}>
                <Text style={styles.itemBadgeText}>{item.quantidade.litros} L</Text>
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="basket" size={28} color="#2d6a4f" />
            <Text style={styles.statValue}>{totalBalaios}</Text>
            <Text style={styles.statLabel}>Total de Balaios</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="water" size={28} color="#0284c7" />
            <Text style={styles.statValue}>{totalLitros} L</Text>
            <Text style={styles.statLabel}>Litros de Café</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="speedometer" size={28} color="#ea580c" />
            <Text style={styles.statValue}>{mediaLitrosPorBalaio} L</Text>
            <Text style={styles.statLabel}>Média por Balaio</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={28} color="#16a34a" />
            <Text style={styles.statValue}>{trabalhador.diaria.formatar()}</Text>
            <Text style={styles.statLabel}>Valor da Diária</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 12,
  },
  errorSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  iconButton: {
    padding: 6,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  badgeOrigem: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  badgeOrigemText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '500',
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2d6a4f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  workerMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  crachaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  crachaTagText: {
    fontSize: 12,
    color: '#2d6a4f',
    fontWeight: '600',
  },
  diariaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  diariaTagText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#2d6a4f',
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  itemSub: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itemCoords: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  itemBadge: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statsContainer: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
