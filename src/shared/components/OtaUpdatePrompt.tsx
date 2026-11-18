import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Updates from 'expo-updates';
import { Ionicons } from '@expo/vector-icons';

const CHECK_COOLDOWN_MS = 30000;

export interface OtaUpdatePromptProps {
  forceEnabledForTest?: boolean;
}

export function OtaUpdatePrompt({ forceEnabledForTest = false }: OtaUpdatePromptProps = {}) {
  const { isUpdateAvailable, isUpdatePending, isDownloading, downloadProgress } =
    Updates.useUpdates();

  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualAvailable, setManualAvailable] = useState(false);

  const lastCheckAtRef = useRef<number>(0);

  const ativo = forceEnabledForTest || (!__DEV__ && Platform.OS !== 'web' && Updates.isEnabled);

  const verificarAtualizacao = useCallback(async (force = false) => {
    if (!ativo) return;

    const now = Date.now();
    if (!force && now - lastCheckAtRef.current < CHECK_COOLDOWN_MS) {
      return;
    }
    lastCheckAtRef.current = now;

    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        setManualAvailable(true);
        setDismissed(false);
      }
    } catch {
      // Sem internet ou falha transitória: mantém operação offline sem interromper o usuário
    }
  }, [ativo]);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      void verificarAtualizacao(true);
    }, 0);

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void verificarAtualizacao(false);
      }
    });

    return () => {
      clearTimeout(initTimer);
      sub.remove();
    };
  }, [verificarAtualizacao]);

  const precisaAtualizar =
    ativo && (isUpdatePending || isUpdateAvailable || manualAvailable);

  const modalVisible = precisaAtualizar && !dismissed;

  const handleConfirmUpdate = async () => {
    setApplying(true);
    setErrorMsg(null);
    try {
      if (!isUpdatePending) {
        await Updates.fetchUpdateAsync();
      }
      await Updates.reloadAsync();
    } catch {
      setApplying(false);
      setErrorMsg('Não foi possível baixar a atualização agora. Tente novamente com internet.');
    }
  };

  if (!modalVisible) return null;

  const pctText =
    typeof downloadProgress === 'number' && downloadProgress > 0
      ? ` (${Math.round(downloadProgress * 100)}%)`
      : '';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!applying) setDismissed(true);
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="cloud-download-outline" size={32} color="#1b4332" />
          </View>

          <Text style={styles.title}>Atualização do Sistema</Text>
          <Text style={styles.description}>
            {isUpdatePending
              ? 'Uma nova versão do SafraCafé já foi baixada e está pronta. Toque em OK para aplicar e continuar usando o aplicativo.'
              : 'Há uma nova versão do SafraCafé disponível. Toque em OK para atualizar agora e continuar usando o aplicativo.'}
          </Text>

          {(applying || isDownloading) && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#2d6a4f" />
              <Text style={styles.loadingText}>
                {isUpdatePending
                  ? 'Aplicando atualização...'
                  : `Baixando atualização${pctText}...`}
              </Text>
            </View>
          )}

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.actions}>
            {!applying && (
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setDismissed(true)}
                accessibilityLabel="Atualizar depois"
              >
                <Text style={styles.secondaryBtnText}>Depois</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, applying && styles.primaryBtnDisabled]}
              onPress={handleConfirmUpdate}
              disabled={applying}
              accessibilityLabel="Confirmar atualização do sistema"
            >
              <Text style={styles.primaryBtnText}>
                {applying ? 'Atualizando...' : 'OK, Atualizar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#d8f3dc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1b4332',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 18,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d6a4f',
  },
  errorText: {
    fontSize: 12,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  primaryBtn: {
    flex: 1.5,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#1b4332',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
});
