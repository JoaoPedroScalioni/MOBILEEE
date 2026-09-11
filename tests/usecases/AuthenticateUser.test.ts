import { Session } from '../../src/domain/entities/Session';
import { User } from '../../src/domain/entities/User';
import { AuthGateway, CredenciaisAuth } from '../../src/domain/gateways/AuthGateway';
import { AuthenticateUser } from '../../src/usecases/AuthenticateUser';

const AGORA = 1_720_000_000_000;
const EMAIL_VALIDO = 'pesquisador@ecofield.app';
const SENHA_VALIDA = '123456';

class FakeAuthGateway implements AuthGateway {
    async signIn(credentials: CredenciaisAuth): Promise<Session> {
        if (credentials.email === EMAIL_VALIDO && credentials.password === SENHA_VALIDA) {
            return new Session(
                'token-fake',
                new User('u1', 'Pesquisador CEFET', EMAIL_VALIDO),
                AGORA + 60_000,
            );
        }
        throw new Error('Credenciais inválidas');
    }

    async signUp(): Promise<Session> {
        return new Session('token-fake', new User('u1', 'Novo', 'novo@ecofield.app'), AGORA + 60_000);
    }

    async signOut(): Promise<void> {}
}

describe('AuthenticateUser Use Case', () => {
    let gateway: FakeAuthGateway;
    let sut: AuthenticateUser;

    beforeEach(() => {
        gateway = new FakeAuthGateway();
        sut = new AuthenticateUser(gateway);
    });

    it('autentica com credenciais válidas e retorna a sessão', async () => {
        const session = await sut.execute({ email: EMAIL_VALIDO, password: SENHA_VALIDA });
        expect(session).toBeInstanceOf(Session);
        expect(session.token).toBe('token-fake');
        expect(session.user.email).toBe(EMAIL_VALIDO);
        expect(session.isValid(AGORA)).toBe(true);
    });

    it('rejeita credenciais inválidas', async () => {
        await expect(
            sut.execute({ email: EMAIL_VALIDO, password: 'senha-errada' }),
        ).rejects.toThrow('Credenciais inválidas');
    });
});