import { Session } from '../../src/domain/entities/Session';
import { User } from '../../src/domain/entities/User';
import { SessionStorage } from '../../src/domain/gateways/SessionStorage';
import { RestoreSession } from '../../src/usecases/RestoreSession';

const AGORA = Date.now();

class FakeSessionStorage implements SessionStorage {
    private session: Session | null = null;

    async salvar(session: Session): Promise<void> {
        this.session = session;
    }

    async carregar(): Promise<Session | null> {
        return this.session;
    }

    async limpar(): Promise<void> {
        this.session = null;
    }
}

describe('RestoreSession Use Case', () => {
    let storage: FakeSessionStorage;
    let sut: RestoreSession;

    beforeEach(() => {
        storage = new FakeSessionStorage();
        sut = new RestoreSession(storage);
    });

    it('restaura sessão válida salva no storage', async () => {
        const valida = new Session('token-abc', new User('u1', 'Pesquisador', 'pesquisador@ecofield.app'), AGORA + 60_000);
        await storage.salvar(valida);

        const restaurada = await sut.execute();
        expect(restaurada).not.toBeNull();
        expect(restaurada!.token).toBe('token-abc');
    });

    it('retorna null quando não há sessão salva', async () => {
        const restaurada = await sut.execute();
        expect(restaurada).toBeNull();
    });

    it('retorna null quando a sessão salva está expirada', async () => {
        const expirada = new Session('token-abc', new User('u1', 'Pesquisador', 'pesquisador@ecofield.app'), AGORA - 60_000);
        await storage.salvar(expirada);

        const restaurada = await sut.execute();
        expect(restaurada).toBeNull();
    });
});