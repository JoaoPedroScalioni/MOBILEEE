import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { TokenSupervisor } from '../../src/domain/entities/TokenSupervisor';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { InMemoryTokenSupervisorRepository } from '../../src/infra/InMemoryTokenSupervisorRepository';
import { AcessarViaTokenUseCase } from '../../src/usecases/AcessarViaTokenUseCase';

describe('AcessarViaTokenUseCase', () => {
  let tokenRepo: InMemoryTokenSupervisorRepository;
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let useCase: AcessarViaTokenUseCase;

  beforeEach(() => {
    tokenRepo = InMemoryTokenSupervisorRepository.getInstance();
    tokenRepo.clear();
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    useCase = new AcessarViaTokenUseCase(tokenRepo, periodoRepo);
  });

  it('deve conceder acesso ao período via token válido sem necessidade de login com senha', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
    });
    await periodoRepo.save(periodo);

    const token = new TokenSupervisor({
      token: 'tok-supervisor-xyz',
      estagioId: 'e1',
      periodoId: 'p1',
      emailSupervisor: 'sup@empresa.com',
      expiraEm: new Date(Date.now() + 86400000),
    });
    await tokenRepo.save(token);

    const resultado = await useCase.execute({ token: 'tok-supervisor-xyz' });

    expect(resultado.periodo.getId()).toBe('p1');
    expect(resultado.tokenInfo.getEmailSupervisor()).toBe('sup@empresa.com');
  });

  it('deve rejeitar token vazio', async () => {
    await expect(useCase.execute({ token: '  ' })).rejects.toThrow(
      'O token de acesso deve ser fornecido.'
    );
  });

  it('deve rejeitar token inexistente ou revogado', async () => {
    await expect(useCase.execute({ token: 'inexistente' })).rejects.toThrow(
      'Token de acesso do supervisor inválido, expirado ou revogado.'
    );
  });

  it('deve rejeitar se período vinculado ao token não existir', async () => {
    const token = new TokenSupervisor({
      token: 'tok-orfa',
      estagioId: 'e1',
      periodoId: 'p-inexistente',
      emailSupervisor: 'sup@empresa.com',
      expiraEm: new Date(Date.now() + 86400000),
    });
    await tokenRepo.save(token);

    await expect(useCase.execute({ token: 'tok-orfa' })).rejects.toThrow(
      'Período de avaliação vinculado ao token não foi encontrado.'
    );
  });
});
