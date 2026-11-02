import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  compartilharCrachaPDF,
  DadosCracha,
  imprimirCracha,
} from '../utils/crachaHelper';

interface CrachaModalProps {
  visible: boolean;
  onClose: () => void;
  trabalhador: DadosCracha | null;
}

export function CrachaModal({ visible, onClose, trabalhador }: CrachaModalProps) {
  const [processando, setProcessando] = useState(false);

  if (!trabalhador) return null;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(trabalhador.cracha)}`;
  const cpfFormatado = trabalhador.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  async function handleImprimir() {
    if (!trabalhador) return;
    setProcessando(true);
    try {
      await imprimirCracha(trabalhador);
    } catch (err) {
      Alert.alert('Erro ao imprimir', err instanceof Error ? err.message : 'Falha na impressão.');
    } finally {
      setProcessando(false);
    }
  }

  async function handleCompartilhar() {
    if (!trabalhador) return;
    setProcessando(true);
    try {
      await compartilharCrachaPDF(trabalhador);
    } catch (err) {
      Alert.alert('Erro ao gerar PDF', err instanceof Error ? err.message : 'Falha no compartilhamento.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="id-card" size={22} color="#2d6a4f" />
              <Text style={styles.headerTitle}>Crachá do Colhedor</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          {/* O Cartão do Crachá */}
          <View style={styles.badgeCard}>
            <View style={styles.badgeHole} />
            <Text style={styles.badgeFarm}>FAZENDA SAFRACAFÉ</Text>
            <Text style={styles.badgeSub}>CRACHÁ DE IDENTIFICAÇÃO</Text>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: qrUrl }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.codePill}>
              <Text style={styles.codeText}>{trabalhador.cracha}</Text>
            </View>

            <Text style={styles.workerName}>{trabalhador.nome}</Text>
            <Text style={styles.workerMeta}>CPF: {cpfFormatado}</Text>
            {trabalhador.diariaFormatada ? (
              <Text style={styles.workerDiaria}>Diária: {trabalhador.diariaFormatada}</Text>
            ) : null}

            <Text style={styles.badgeHint}>
              📸 Pronto para ser lido pela Câmera do app
            </Text>
          </View>

          {/* Ações: Imprimir & Compartilhar */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.btnImprimir]}
              onPress={handleImprimir}
              disabled={processando}
            >
              {processando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="print-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Imprimir</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.btnShare]}
              onPress={handleCompartilhar}
              disabled={processando}
            >
              <Ionicons name="share-social-outline" size={18} color="#042f2e" />
              <Text style={[styles.actionBtnText, { color: '#042f2e' }]}>Salvar PDF</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.btnFechar} onPress={onClose}>
            <Text style={styles.btnFecharText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeBtn: {
    padding: 4,
  },
  badgeCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2d6a4f',
    padding: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  badgeHole: {
    width: 40,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    marginBottom: 8,
  },
  badgeFarm: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2d6a4f',
    letterSpacing: 1.5,
  },
  badgeSub: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  codePill: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
  },
  workerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  workerMeta: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  workerDiaria: {
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
    marginTop: 2,
  },
  badgeHint: {
    fontSize: 11,
    color: '#059669',
    marginTop: 10,
    fontWeight: '500',
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  btnImprimir: {
    backgroundColor: '#2d6a4f',
  },
  btnShare: {
    backgroundColor: '#34d399',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  btnFechar: {
    paddingVertical: 8,
  },
  btnFecharText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
});

