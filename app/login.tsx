import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../src/adapters/context/AuthContext';

export default function LoginScreenRoute() {
  const { login, status, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const handleEntrar = async () => {
    setErro(null);
    try {
      await login(email, password, 'aluno');
    } catch (err: any) {
      setErro(err?.message || 'Falha ao autenticar.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Portal de Estágio</Text>
      <Text style={styles.subtitulo}>Acesso do Aluno, Supervisor ou Coordenação</Text>

      {user && (
        <View style={styles.alertaSucesso}>
          <Text style={styles.textoSucesso}>Conectado como: {user.email}</Text>
        </View>
      )}

      {erro && (
        <View style={styles.alertaErro}>
          <Text style={styles.textoErro}>{erro}</Text>
        </View>
      )}

      <View style={styles.campo}>
        <Text style={styles.label}>E-mail Institucional</Text>
        <TextInput
          testID="login-input-email"
          style={styles.input}
          placeholder="exemplo@universidade.edu.br"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.campo}>
        <Text style={styles.label}>Senha de Acesso</Text>
        <TextInput
          testID="login-input-password"
          style={styles.input}
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity
        testID="login-btn-entrar"
        style={styles.botao}
        onPress={handleEntrar}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.textoBotao}>Entrar no Sistema</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitulo: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },
  alertaErro: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  textoErro: {
    color: '#991B1B',
    fontSize: 14,
  },
  alertaSucesso: {
    backgroundColor: '#DCFCE7',
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
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  botao: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  textoBotao: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
