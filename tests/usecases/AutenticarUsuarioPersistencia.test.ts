import { Session } from '../../src/domain/entities/Session';
import { User } from '../../src/domain/entities/User';
import { AuthGateway } from '../../src/domain/gateways/AuthGateway';
import { SessionStorage } from '../../src/domain/gateways/SessionStorage';
import { AutenticarUsuarioUseCase } from '../../src/usecases/AutenticarUsuarioUseCase';

const session = new Session('tok', new User('u1', 'Maria', 'maria@safra.com'), Date.now() + 60_000);

class FakeAuthGateway implements AuthGateway {
  async signIn(): Promise<Session> {
    return session;
  }
  async signUp(): Promise<Session> {
    return session;
  }
  async signOut(): Promise<void> {}
}

describe('AutenticarUsuarioUseCase — persistência de sessão', () => {
  it('deve rejeitar credenciais vazias', async () => {
    const uc = new AutenticarUsuarioUseCase(new FakeAuthGateway());
    await expect(uc.execute({ email: '', password: '123' })).rejects.toThrow(/obrigat/);
    await expect(uc.execute({ email: 'a@b.com', password: '' })).rejects.toThrow(/obrigat/);
  });

  it('deve autenticar sem storage opcional', async () => {
    const uc = new AutenticarUsuarioUseCase(new FakeAuthGateway());
    await expect(uc.execute({ email: 'a@b.com', password: '123' })).resolves.toBe(session);
  });

  it('deve persistir via saveSession quando o storage expõe esse método', async () => {
    const saveSession = jest.fn().mockResolvedValue(undefined);
    const storage = { saveSession, salvar: jest.fn() } as unknown as SessionStorage;
    const uc = new AutenticarUsuarioUseCase(new FakeAuthGateway(), storage);

    await uc.execute({ email: 'a@b.com', password: '123' });

    expect(saveSession).toHaveBeenCalledWith(session);
  });

  it('deve persistir via salvar quando saveSession não existe', async () => {
    const salvar = jest.fn().mockResolvedValue(undefined);
    const storage = { salvar } as unknown as SessionStorage;
    const uc = new AutenticarUsuarioUseCase(new FakeAuthGateway(), storage);

    await uc.execute({ email: 'a@b.com', password: '123' });

    expect(salvar).toHaveBeenCalledWith(session);
  });
});
