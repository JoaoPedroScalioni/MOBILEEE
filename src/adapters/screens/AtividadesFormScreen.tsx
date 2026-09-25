import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAtividades } from '../hooks/useAtividades';

export interface AtividadesFormScreenProps {
  periodoId?: string;
  onSalvoComSucesso?: () => void;
  hookOptions?: Parameters<typeof useAtividades>[0];
}

export function AtividadesFormScreen({
  periodoId = 'periodo-01',
  onSalvoComSucesso,
  hookOptions,
}: AtividadesFormScreenProps) {
  const { status, erro, salvarAtividades } = useAtividades(hookOptions);

  const [descricao, setDescricao] = useState('');
  const [horasTotais, setHorasTotais] = useState('300');
  const [horasMinimas, setHorasMinimas] = useState('60');
  const [horasPeriodo, setHorasPeriodo] = useState('80');
  const [capturarGps, setCapturarGps] = useState(true);

  const handleSubmit = async () => {
    const parsedTotais = Number(horasTotais);
    const parsedMinimas = Number(horasMinimas);
    const parsedPeriodo = Number(horasPeriodo);

    const resultado = await salvarAtividades({
      periodoId,
      descricao,
      horasTotais: isNaN(parsedTotais) ? 0 : parsedTotais,
      horasMinimas: isNaN(parsedMinimas) ? 0 : parsedMinimas,
      horasPeriodo: isNaN(parsedPeriodo) ? 0 : parsedPeriodo,
      capturarLocalizacao: capturarGps,
    });

    if (resultado && onSalvoComSucesso) {
      onSalvoComSucesso();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Atividades de Estágio</Text>
      <Text style={styles.subtitulo}>Preencha o resumo das tarefas executadas no período.</Text>

      {status === 'erro' && erro && (
        <View style={styles.alertaErro}>
          <Text style={styles.textoErro}>{erro}</Text>
        </View>
      )}

      {status === 'salvo' && (
        <View style={styles.alertaSucesso}>
          <Text style={styles.textoSucesso}>Atividades salvas com sucesso!</Text>
        </View>
      )}

      <View style={styles.campo}>
        <Text style={styles.label}>Descrição Detalhada das Atividades</Text>
        <TextInput
          testID="input-descricao"
          style={[styles.input, styles.textArea]}
          placeholder="Ex: Desenvolvimento dos módulos do app mobile..."
          multiline
          numberOfLines={4}
          value={descricao}
          onChangeText={setDescricao}
        />
      </View>

      <View style={styles.linhaCampos}>
        <View style={[styles.campo, styles.campoMenor]}>
          <Text style={styles.label}>Horas Totais</Text>
          <TextInput
            testID="input-horas-totais"
            style={styles.input}
            keyboardType="numeric"
            value={horasTotais}
            onChangeText={setHorasTotais}
          />
        </View>

        <View style={[styles.campo, styles.campoMenor]}>
          <Text style={styles.label}>Horas Mínimas</Text>
          <TextInput
            testID="input-horas-minimas"
            style={styles.input}
            keyboardType="numeric"
            value={horasMinimas}
            onChangeText={setHorasMinimas}
          />
        </View>

        <View style={[styles.campo, styles.campoMenor]}>
          <Text style={styles.label}>Horas do Período</Text>
          <TextInput
            testID="input-horas-periodo"
            style={styles.input}
            keyboardType="numeric"
            value={horasPeriodo}
            onChangeText={setHorasPeriodo}
          />
        </View>
      </View>

      <TouchableOpacity
        testID="btn-gps"
        style={[styles.botaoToggleGps, capturarGps ? styles.botaoGpsAtivo : styles.botaoGpsInativo]}
        onPress={() => setCapturarGps(!capturarGps)}
      >
        <Text style={styles.textoBotaoGps}>
          {capturarGps ? '✓ Localização GPS Ativada' : '✗ Localização GPS Desativada'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="btn-salvar"
        style={[styles.botaoSalvar, status === 'salvando' && styles.botaoDesabilitado]}
        onPress={handleSubmit}
        disabled={status === 'salvando'}
      >
        {status === 'salvando' ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBotaoSalvar}>Salvar Atividades</Text>
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
  linhaCampos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  campoMenor: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
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
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  botaoToggleGps: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  botaoGpsAtivo: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  botaoGpsInativo: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textoBotaoGps: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
  },
  botaoSalvar: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotaoSalvar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
