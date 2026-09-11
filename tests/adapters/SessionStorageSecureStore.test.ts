import * as SecureStore from 'expo-secure-store';
import { SessionStorageSecureStore } from '../../src/adapters/auth/SessionStorageSecureStore';
import { Session } from '../../src/domain/entities/Session';
import { User } from '../../src/domain/entities/User';

const AGORA = 1_720_000_000_000;

const setItemAsyncMock = SecureStore.setItemAsync as jest.Mock;
const getItemAsyncMock = SecureStore.getItemAsync as jest.Mock;
const deleteItemAsyncMock = SecureStore.deleteItemAsync as jest.Mock;

function makeSession() {
    return new Session(
        'token-abc',
        new User('u1', 'Pesquisador', 'pesquisador@ecofield.app'),
        AGORA + 3_600_000,
    );
}

describe('SessionStorageSecureStore (expo-secure-store)', () => {
    const storage = new SessionStorageSecureStore();

    beforeEach(async () => {
        jest.clearAllMocks();
        await storage.limpar();
    });

    it('salva e recupera uma sessão', async () => {
        await storage.salvar(makeSession());

        const carregada = await storage.carregar();

        expect(carregada).not.toBeNull();
        expect(carregada!.token).toBe('token-abc');
        expect(carregada!.user.email).toBe('pesquisador@ecofield.app');
        expect(setItemAsyncMock).toHaveBeenCalledWith('safracafe.session', expect.any(String));
        expect(getItemAsyncMock).toHaveBeenCalled();
    });

    it('retorna null quando não há sessão salva', async () => {
        expect(await storage.carregar()).toBeNull();
    });

    it('limpa a sessão salva no secure store', async () => {
        await storage.salvar(makeSession());

        await storage.limpar();

        expect(await storage.carregar()).toBeNull();
        expect(deleteItemAsyncMock).toHaveBeenCalledWith('safracafe.session');
    });
});