import { InMemoryAuthGateway } from '../../src/infra/inMemoryAuthGateway';
import { AutenticarUsuarioUseCase } from '../../src/usecases/AutenticarUsuarioUseCase';

describe('AutenticarUsuarioUseCase', () => {
  let authGateway: InMemoryAuthGateway;
  let useCase: AutenticarUsuarioUseCase;

  beforeEach(() => {
    authGateway = InMemoryAuthGateway.getInstance();
    useCase = new AutenticarUsuarioUseCase(authGateway);
  });

  it('deve autenticar usuário cadastrado com credenciais corretas', async () => {
    await authGateway.signUp('Aluno Teste', 'aluno@faculdade.edu.br', 'senha123');

    const session = await useCase.execute({
      email: 'aluno@faculdade.edu.br',
      password: 'senha123',
    });

    expect(session).toBeDefined();
    expect(session.user.email).toBe('aluno@faculdade.edu.br');
  });

  it('deve falhar se e-mail ou senha forem omitidos', async () => {
    await expect(
      useCase.execute({
        email: '',
        password: '123',
      })
    ).rejects.toThrow('E-mail e senha são obrigatórios.');
  });
});
