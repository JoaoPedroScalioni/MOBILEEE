import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { container } from '@/src/factory/container';
import { defaultSupabaseConfig } from '@/src/infra/supabase/SupabaseConfig';

/**
 * Modal Central de Sincronização e Status da Nuvem.
 * 
 * Atende aos marcos de:
 * - 29/set: Banco de dados local com SQLite. Aplicativo Off-line first.
 * - 02/out: Mapeamento de funcionalidades offline e ORM.
 * - 03/nov: Supabase como infraestrutura online, comunicação e ferramentas de segurança (RLS).
 * - 06/nov: Bucket S3 storage e sincronização SQLite <-> Supabase online.
 */
export default function CentralSincronizacaoModal() {
  const [pendentesCount, setPendentesCount] = useState<number>(0);
  const [totalTrabalhadores, setTotalTrabalhadores] = useState<number>(0);
  const [totalApontamentos, setTotalApontamentos] = useState<number>(0);
  const [totalDespesas, setTotalDespesas] = useState<number>(0);
  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [ultimoStatus, setUltimoStatus] = useState<string>('Pronto para sincronizar');

  const carregarMetricas = useCallback(async () => {
    try {
      const [pendentes, trabs, apoints, desp] = await Promise.all([
        container.syncQueueRepository.findPending(),
        container.listarTrabalhadores.execute(),
        container.listarApontamentos.execute(),
        container.listarDespesas.execute(),
      ]);
      setPendentesCount(pendentes.length);
      setTotalTrabalhadores(trabs.length);
      setTotalApontamentos(apoints.length);
      setTotalDespesas(desp.length);
    } catch (err) {
      console.error('Erro ao ler métricas de sincronização:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarMetricas();
    }, [carregarMetricas]),
  );

  async function executarSincronizacao() {
    setSincronizando(true);
    setUltimoStatus('Transmitindo fila offline para Supabase PostgreSQL & S3...');
    try {
      // Executa o caso de uso de sincronização da fila
      const resultado = await container.syncPendingQueueSupabase.execute();
      
      await carregarMetricas();
      if (resultado.offline) {
        setUltimoStatus('Dispositivo offline. Fila mantida segura no SQLite local.');
        Alert.alert('Offline', 'Dispositivo sem conexão. As alterações permanecem salvas localmente no SQLite.');
      } else {
        const msg = `${resultado.synchronized} item(ns) sincronizado(s) com sucesso no Supabase!`;
        setUltimoStatus(msg);
        Alert.alert('Sincronização Concluída', msg);
      }
    } catch (error) {
      const erroMsg = error instanceof Error ? error.message : 'Falha na comunicação';
      setUltimoStatus(`Erro: ${erroMsg}`);
      Alert.alert('Erro de Sincronização', erroMsg);
    } finally {
      setSincronizando(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Barra Superior do Modal */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="cloud-done-outline" size={24} color="#2d6a4f" />
          <Text style={styles.title}>Nuvem & Sincronização</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card de Fila Offline */}
        <View style={styles.cardHighlight}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircle}>
              <Ionicons
                name={pendentesCount > 0 ? 'cloud-upload' : 'checkmark-done'}
                size={24}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Fila Offline (SQLite Outbox)</Text>
              <Text style={styles.cardSubtitle}>
                {pendentesCount > 0
                  ? `${pendentesCount} alteração(ões) aguardando envio`
                  : 'Todos os dados locais estão sincronizados'}
              </Text>
            </View>
          </View>

          <View style={styles.queueBadgeRow}>
            <View
              style={[
                styles.queueStatusBadge,
                pendentesCount > 0 ? styles.badgePending : styles.badgeSynced,
              ]}
            >
              <Text
                style={[
                  styles.queueStatusText,
                  pendentesCount > 0 ? styles.textPending : styles.textSynced,
                ]}
              >
                {pendentesCount > 0 ? '● Pendente de Envio' : '● 100% Sincronizado'}
              </Text>
            </View>
          </View>

          {/* Botão de Disparo da Sincronização */}
          <TouchableOpacity
            style={[styles.syncButton, sincronizando && styles.syncButtonDisabled]}
            onPress={executarSincronizacao}
            disabled={sincronizando}
          >
            {sincronizando ? (
              <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="sync" size={20} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.syncButtonText}>
              {sincronizando ? 'Sincronizando com Supabase...' : 'Sincronizar Agora com a Nuvem'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.statusLogText}>{ultimoStatus}</Text>
        </View>

        {/* Card do Banco de Dados SQLite Local */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server-outline" size={20} color="#2d6a4f" />
            <Text style={styles.sectionTitle}>SQLite Local (Offline-First)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            O aplicativo opera com total independência de rede. Dados são gravados no banco relacional local via ORM e espelhados na fila outbox.
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalTrabalhadores}</Text>
              <Text style={styles.statLabel}>Trabalhadores</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalApontamentos}</Text>
              <Text style={styles.statLabel}>Balaios (GPS)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalDespesas}</Text>
              <Text style={styles.statLabel}>Despesas (Fotos)</Text>
            </View>
          </View>
        </View>

        {/* Card da Infraestrutura Remota Supabase BaaS */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe-outline" size={20} color="#0284c7" />
            <Text style={styles.sectionTitle}>Supabase Cloud BaaS</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Endpoint URL:</Text>
            <Text style={styles.infoVal} numberOfLines={1}>
              {defaultSupabaseConfig.url}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Bucket S3 Storage:</Text>
            <Text style={styles.infoVal}>{defaultSupabaseConfig.storageBucket}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Segurança RLS:</Text>
            <Text style={[styles.infoVal, { color: '#16a34a', fontWeight: 'bold' }]}>
              Habilitado (Row Level Security)
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Resolução Conflitos:</Text>
            <Text style={styles.infoVal}>Last-Write-Wins (LWW)</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  cardHighlight: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#2d6a4f',
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2d6a4f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  queueBadgeRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  queueStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgePending: {
    backgroundColor: '#fef3c7',
  },
  badgeSynced: {
    backgroundColor: '#dcfce7',
  },
  queueStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textPending: {
    color: '#b45309',
  },
  textSynced: {
    color: '#15803d',
  },
  syncButton: {
    backgroundColor: '#2d6a4f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  statusLogText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2d6a4f',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoKey: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '600',
    maxWidth: '65%',
  },
});
