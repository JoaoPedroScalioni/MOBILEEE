import * as SecureStore from 'expo-secure-store';
import { SessionStorageSecureStore } from '../../src/adapters/auth/SessionStorageSecureStore';
import { Session } from '../../src/domain/entities/Session';
import { User } from '../../src/domain/entities/User';

const setItemAsyncMock = SecureStore.setItemAsync as jest.Mock;
const getItemAsyncMock = SecureStore.getItemAsync as jest.Mock;
const deleteItemAsyncMock = SecureStore.deleteItemAsync as jest.Mock;

const makeSession = () =>
  new Session('token-xyz', new User('u1', 'Maria', 'maria@safra.com'), Date.now() + 3_600_000);

describe('SessionStorageSecureStore — aliases e resiliência a falhas (expo-secure-store mockado)', () => {
  const storage = new SessionStorageSecureStore();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aliases saveSession/getSession/clearSession delegam para salvar/carregar/limpar', async () => {
    setItemAsyncMock.mockResolvedValueOnce(undefined);
    await storage.saveSession(makeSession());
    expect(setItemAsyncMock).toHaveBeenCalledWith('safracafe.session', expect.any(String));

    getItemAsyncMock.mockResolvedValueOnce(
      JSON.stringify({ token: 't', user: { id: 'u1', name: 'Maria', email: 'maria@safra.com' }, expiresAt: 99 }),
    );
    const carregada = await storage.getSession();
    expect(carregada?.token).toBe('t');

    deleteItemAsyncMock.mockResolvedValueOnce(undefined);
    await storage.clearSession();
    expect(deleteItemAsyncMock).toHaveBeenCalledWith('safracafe.session');
  });

  it('deve engolir falhas do SecureStore ao salvar e limpar', async () => {
    setItemAsyncMock.mockRejectedValueOnce(new Error('keystore indisponível'));
    await expect(storage.salvar(makeSession())).resolves.toBeUndefined();

    deleteItemAsyncMock.mockRejectedValueOnce(new Error('keystore indisponível'));
    await expect(storage.limpar()).resolves.toBeUndefined();
  });

  it('deve devolver null para JSON corrompido, incompleto ou erro de leitura', async () => {
    getItemAsyncMock.mockResolvedValueOnce('{não-é-json');
    expect(await storage.carregar()).toBeNull();

    getItemAsyncMock.mockResolvedValueOnce(JSON.stringify({ token: '', user: {} }));
    expect(await storage.carregar()).toBeNull();

    getItemAsyncMock.mockRejectedValueOnce(new Error('falha'));
    expect(await storage.carregar()).toBeNull();
  });
});
