import { SupabaseAuthGateway } from '../../src/infra/supabase/SupabaseAuthGateway';
import { SupabaseClientManager } from '../../src/infra/supabase/SupabaseClient';

describe('SupabaseAuthGateway (03/nov — Comunicação com Supabase Auth e Segurança)', () => {
  let mockSupabaseClient: any;
  let clientManager: SupabaseClientManager;
  let authGateway: SupabaseAuthGateway;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null }),
      }),
    };

    clientManager = SupabaseClientManager.getInstance();
    clientManager.setClient(mockSupabaseClient);
    authGateway = SupabaseAuthGateway.getInstance(clientManager);
  });

  it('deve realizar login com sucesso e retornar Session e User do domínio', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'jwt-access-token-123',
          expires_at: Math.floor((Date.now() + 3600000) / 1000),
        },
        user: {
          id: 'usr-supabase-1',
          email: 'pesquisador@ecofield.app',
          user_metadata: { name: 'Dr. Leonardo' },
        },
      },
      error: null,
    });

    const session = await authGateway.signIn({
      email: 'pesquisador@ecofield.app',
      password: 'senhaSegura123!',
    });

    expect(session.token).toBe('jwt-access-token-123');
    expect(session.user.id).toBe('usr-supabase-1');
    expect(session.user.name).toBe('Dr. Leonardo');
    expect(session.user.email).toBe('pesquisador@ecofield.app');
    expect(session.isValid()).toBe(true);
  });

  it('deve lançar erro em caso de credenciais rejeitadas pelo Supabase Auth', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Invalid login credentials' },
    });

    await expect(
      authGateway.signIn({
        email: 'invalido@ecofield.app',
        password: 'errada',
      })
    ).rejects.toThrow('Invalid login credentials');
  });

  it('deve cadastrar novo usuário (signUp) e registrar perfil', async () => {
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: {
        session: {
          access_token: 'novo-jwt-token',
          expires_at: Math.floor((Date.now() + 3600000) / 1000),
        },
        user: {
          id: 'usr-novo-1',
          email: 'novo@ecofield.app',
        },
      },
      error: null,
    });

    const session = await authGateway.signUp('Marcos Silva', 'novo@ecofield.app', 'senha12345');
    expect(session.user.name).toBe('Marcos Silva');
    expect(session.user.email).toBe('novo@ecofield.app');
  });

  it('deve executar logout com sucesso', async () => {
    await expect(authGateway.signOut()).resolves.toBeUndefined();
    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
  });
});
