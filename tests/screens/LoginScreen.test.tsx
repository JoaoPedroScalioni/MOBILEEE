import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import LoginScreen from '../../app/index';
import { AuthProvider } from '../../src/adapters/auth/AuthContext';
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

describe('LoginScreen', () => {
    let storage: FakeSessionStorage;

    async function renderScreen() {
        const authGateway = new FakeAuthGateway();
        return await render(
            <AuthProvider
                authenticateUseCase={new AuthenticateUser(authGateway)}
                restoreSessionUseCase={new RestoreSession(storage)}
                signOutUseCase={new SignOut(authGateway, storage)}
                sessionStorage={storage}
            >
                <LoginScreen />
            </AuthProvider>,
        );
    }

    beforeEach(() => {
        jest.clearAllMocks();
        storage = new FakeSessionStorage();
    });

    it('navega para o painel após login com credenciais válidas', async () => {
        const { getByPlaceholderText, getByText } = await renderScreen();

        await fireEvent.changeText(getByPlaceholderText('seu@email.com'), EMAIL_VALIDO);
        await fireEvent.changeText(getByPlaceholderText('******'), SENHA_VALIDA);
        await fireEvent.press(getByText('Entrar'));

        await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(drawer)/(tabs)'));
    });

    it('exibe alerta e não navega com credenciais inválidas', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        const { getByPlaceholderText, getByText } = await renderScreen();

        await fireEvent.changeText(getByPlaceholderText('seu@email.com'), EMAIL_VALIDO);
        await fireEvent.changeText(getByPlaceholderText('******'), 'senha-errada');
        await fireEvent.press(getByText('Entrar'));

        await waitFor(() => expect(alertSpy).toHaveBeenCalled());
        expect(router.replace).not.toHaveBeenCalled();
        alertSpy.mockRestore();
    });

    it('alerta quando os campos obrigatórios estão vazios', async () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        const { getByText } = await renderScreen();

        await fireEvent.press(getByText('Entrar'));

        await waitFor(() => expect(alertSpy).toHaveBeenCalled());
        expect(router.replace).not.toHaveBeenCalled();
        alertSpy.mockRestore();
    });
});