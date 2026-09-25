import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { container } from '../../factory/container';
import { AssinarRelatorioUseCase } from '../../usecases/AssinarRelatorioUseCase';

export interface AssinaturaScreenProps {
  periodoId?: string;
  autorIdPadrao?: string;
  papelPadrao?: 'aluno' | 'supervisor';
  assinarUseCase?: AssinarRelatorioUseCase;
  onAssinaturaConcluida?: () => void;
}

export function AssinaturaScreen({
  periodoId = 'periodo-01',
  autorIdPadrao = 'aluno-01',
  papelPadrao = 'aluno',
  assinarUseCase,
  onAssinaturaConcluida,
}: AssinaturaScreenProps) {
  const useCase = assinarUseCase ?? container.assinarRelatorioUseCase;

  const [autorId, setAutorId] = useState(autorIdPadrao);
  const [papel, setPapel] = useState<'aluno' | 'supervisor'>(papelPadrao);
  const [base64, setBase64] = useState('data:image/png;base64,assinatura_digital_mocked_hash123');
  const [loading, setLoading] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleAssinar = async () => {
    setLoading(true);
    setErro(null);
    setMensagemSucesso(false);

    try {
      await useCase.execute({
        periodoId,
        autorId,
        papel,
        base64Assinatura: base64,
      });

      setMensagemSucesso(true);
      if (onAssinaturaConcluida) {
        onAssinaturaConcluida();
      }
    } catch (err: any) {
      setErro(err?.message || 'Falha ao registrar assinatura digital.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Assinatura Digital do Relatório</Text>
      <Text style={styles.subtitulo}>
        Aposição criptográfica de assinatura de conformidade do estágio.
      </Text>

      {erro && (
        <View style={styles.alertaErro}>
          <Text style={styles.textoErro}>{erro}</Text>
        </View>
      )}

      {mensagemSucesso && (
        <View style={styles.alertaSucesso}>
          <Text style={styles.textoSucesso}>Assinatura registrada e vinculada com sucesso!</Text>
        </View>
      )}

      <View style={styles.campo}>
        <Text style={styles.label}>Papel do Assinante</Text>
        <View style={styles.linhaBotoesPapel}>
          <TouchableOpacity
            testID="btn-papel-aluno"
            style={[styles.botaoPapel, papel === 'aluno' && styles.botaoPapelAtivo]}
            onPress={() => setPapel('aluno')}
          >
            <Text style={[styles.textoPapel, papel === 'aluno' && styles.textoPapelAtivo]}>
              Estagiário (Aluno)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="btn-papel-supervisor"
            style={[styles.botaoPapel, papel === 'supervisor' && styles.botaoPapelAtivo]}
            onPress={() => setPapel('supervisor')}
          >
            <Text style={[styles.textoPapel, papel === 'supervisor' && styles.textoPapelAtivo]}>
              Supervisor da Empresa
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Identificador do Autor (ID)</Text>
        <TextInput
          testID="input-autor-id"
          style={styles.input}
          value={autorId}
          onChangeText={setAutorId}
          placeholder="Ex: aluno-01 ou supervisor-01"
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Carimbo Digital (Base64 da Assinatura)</Text>
        <TextInput
          testID="input-base64"
          style={[styles.input, styles.inputBase64]}
          value={base64}
          onChangeText={setBase64}
          multiline
        />
      </View>

      <TouchableOpacity
        testID="btn-assinar"
        style={[styles.botaoAssinar, loading && styles.botaoDesabilitado]}
        onPress={handleAssinar}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBotaoAssinar}>Confirmar Assinatura Digital</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A24',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 14,
    color: '#666B7A',
    marginBottom: 20,
  },
  alertaErro: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  textoErro: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '500',
  },
  alertaSucesso: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  textoSucesso: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },
  campo: {
    marginBottom: 16,
    flexDirection: 'column',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  linhaBotoesPapel: {
    flexDirection: 'row',
    gap: 10,
  },
  botaoPapel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  botaoPapelAtivo: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  textoPapel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  textoPapelAtivo: {
    color: '#2563EB',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  inputBase64: {
    minHeight: 60,
    fontSize: 12,
    color: '#4B5563',
  },
  botaoAssinar: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotaoAssinar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
