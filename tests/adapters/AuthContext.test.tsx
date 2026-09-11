import { Button, Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../src/adapters/auth/AuthContext';
import { Session } from '../../src/domain/entities/Session';
import { User } from '../../src/domain/entities/User';
import { AuthGateway, CredenciaisAuth } from '../../src/domain/gateways/AuthGateway';
import { SessionStorage } from '../../src/domain/gateways/SessionStorage';
import { AuthenticateUser } from '../../src/usecases/AuthenticateUser';
import { RestoreSession } from '../../src/usecases/RestoreSession';
import { SignOut } from '../../src/usecases/SignOut';

const AGORA = Date.now();
const EMAIL_VALIDO = 'pesquisador@ecofield.app';
const SENHA_VALIDA = '123456';

class FakeAuthGateway implements AuthGateway {
    async signIn(credentials: CredenciaisAuth): Promise<Session> {
        if (credentials.email === EMAIL_VALIDO && credentials.password === SENHA_VALIDA) {
            return new Session('token-fake', new User('u1', 'Pesquisador', EMAIL_VALIDO), AGORA + 60_000);
        }
        throw new Error('Credenciais inválidas');
    }

    async signUp(): Promise<Session> {
        throw new Error('não utilizado');
    }

    async signOut(): Promise<void> {}
}

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

function Probe() {
    const { session, status, login, logout } = useAuth();

    return (
        <>
            <Text testID="status">{status}</Text>
            {session ? <Text testID="email">{session.user.email}</Text> : null}
            <Button testID="btn-login" title="Entrar" onPress={() => login(EMAIL_VALIDO, SENHA_VALIDA)} />
            <Button title="Sair" onPress={() => logout()} />
        </>
    );
}

async function renderComProvider(storage: FakeSessionStorage) {
    const authGateway = new FakeAuthGateway();
    return await render(
        <AuthProvider
            authenticateUseCase={new AuthenticateUser(authGateway)}
            restoreSessionUseCase={new RestoreSession(storage)}
            signOutUseCase={new SignOut(authGateway, storage)}
            sessionStorage={storage}
        >
            <Probe />
        </AuthProvider>,
    );
}

describe('AuthContext', () => {
    it('restaura a sessão salva no boot do app', async () => {
        const storage = new FakeSessionStorage();
        await storage.salvar(new Session('token-fake', new User('u1', 'Pesquisador', EMAIL_VALIDO), AGORA + 60_000));

        const { getByTestId } = await renderComProvider(storage);

        await waitFor(() => expect(getByTestId('status')).toHaveTextContent('authenticated'));
        expect(getByTestId('email')).toHaveTextContent(EMAIL_VALIDO);
    });

    it('inicia sem sessão quando nada está salvo', async () => {
        const { getByTestId } = await renderComProvider(new FakeSessionStorage());

        await waitFor(() => expect(getByTestId('status')).toHaveTextContent('unauthenticated'));
    });

    it('login autentica e persiste a sessão no storage', async () => {
        const storage = new FakeSessionStorage();
        const { getByTestId } = await renderComProvider(storage);

        await waitFor(() => expect(getByTestId('status')).toHaveTextContent('unauthenticated'));
        await fireEvent.press(getByTestId('btn-login'));

        await waitFor(() => expect(getByTestId('status')).toHaveTextContent('authenticated'));
        expect(await storage.carregar()).not.toBeNull();
    });

    it('logout limpa o contexto e o storage', async () => {
        const storage = new FakeSessionStorage();
        const { getByTestId, getByText } = await renderComProvider(storage);

        await waitFor(() => expect(getByTestId('status')).toHaveTextContent('unauthenticated'));
        await fireEvent.press(getByTestId('btn-login'));
        await waitFor(() => expect(getByTestId('status')).toHaveTextContent('authenticated'));

        await fireEvent.press(getByText('Sair'));

        await waitFor(() => expect(getByTestId('status')).toHaveTextContent('unauthenticated'));
        expect(await storage.carregar()).toBeNull();
    });
});