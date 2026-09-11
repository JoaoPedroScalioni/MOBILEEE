import { Session } from '../../src/domain/entities/Session';
import { User } from '../../src/domain/entities/User';
import { AuthGateway } from '../../src/domain/gateways/AuthGateway';
import { SessionStorage } from '../../src/domain/gateways/SessionStorage';
import { SignOut } from '../../src/usecases/SignOut';

const AGORA = 1_720_000_000_000;

class FakeAuthGateway implements AuthGateway {
    public signOutCalled = false;

    async signIn(): Promise<Session> {
        return new Session('token', new User('u1', 'Pesquisador', 'pesquisador@ecofield.app'), AGORA + 60_000);
    }

    async signUp(): Promise<Session> {
        throw new Error('não utilizado');
    }

    async signOut(): Promise<void> {
        this.signOutCalled = true;
    }
}

class FakeSessionStorage implements SessionStorage {
    private session: Session | null = new Session(
        'token',
        new User('u1', 'Pesquisador', 'pesquisador@ecofield.app'),
        AGORA + 60_000,
    );

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

describe('SignOut Use Case', () => {
    it('encerra a sessão no gateway e limpa o storage', async () => {
        const gateway = new FakeAuthGateway();
        const storage = new FakeSessionStorage();
        const sut = new SignOut(gateway, storage);

        await sut.execute();

        expect(gateway.signOutCalled).toBe(true);
        expect(await storage.carregar()).toBeNull();
    });
});