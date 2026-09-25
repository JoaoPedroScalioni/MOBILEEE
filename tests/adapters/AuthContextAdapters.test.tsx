import React from 'react';
import { Button, Text, View } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/adapters/context/AuthContext';
import { InMemoryAuthGateway } from '../../src/infra/inMemoryAuthGateway';
import { AutenticarUsuarioUseCase } from '../../src/usecases/AutenticarUsuarioUseCase';

function ConsumerComponent() {
  const { user, status, login, logout, papel } = useAuth();
  return (
    <View>
      <Text testID="txt-status">{status}</Text>
      <Text testID="txt-email">{user?.email ?? 'nenhum'}</Text>
      <Text testID="txt-papel">{papel}</Text>
      <Button
        testID="btn-login"
        title="Login"
        onPress={() => login('aluno@escola.edu.br', 'senha123', 'aluno')}
      />
      <Button testID="btn-logout" title="Logout" onPress={logout} />
    </View>
  );
}

describe('AuthContext (Adapters/Context)', () => {
  let authGateway: InMemoryAuthGateway;
  let authUseCase: AutenticarUsuarioUseCase;

  beforeEach(() => {
    authGateway = InMemoryAuthGateway.getInstance();
    authUseCase = new AutenticarUsuarioUseCase(authGateway);
  });

  it('deve disponibilizar estado de autenticação via Context API sem prop drilling', async () => {
    await authGateway.signUp('Aluno Teste', 'aluno@escola.edu.br', 'senha123');

    const { getByTestId } = await render(
      <AuthProvider autenticarUseCase={authUseCase}>
        <ConsumerComponent />
      </AuthProvider>
    );

    expect(getByTestId('txt-email').props.children).toBe('nenhum');

    await fireEvent.press(getByTestId('btn-login'));

    await waitFor(() => {
      expect(getByTestId('txt-status').props.children).toBe('authenticated');
      expect(getByTestId('txt-email').props.children).toBe('aluno@escola.edu.br');
      expect(getByTestId('txt-papel').props.children).toBe('aluno');
    });
  });

  it('deve lançar erro se useAuth for invocado fora do AuthProvider', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(async () => {
      await render(<ConsumerComponent />);
    }).rejects.toThrow('useAuth deve ser utilizado dentro de um <AuthProvider>');
    consoleSpy.mockRestore();
  });
});
