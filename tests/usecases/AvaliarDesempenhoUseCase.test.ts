import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { TokenSupervisor } from '../../src/domain/entities/TokenSupervisor';
import { StatusPeriodo } from '../../src/domain/value-objects/StatusPeriodo';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { InMemoryTokenSupervisorRepository } from '../../src/infra/InMemoryTokenSupervisorRepository';
import { AvaliarDesempenhoUseCase } from '../../src/usecases/AvaliarDesempenhoUseCase';

describe('AvaliarDesempenhoUseCase', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let tokenRepo: InMemoryTokenSupervisorRepository;
  let useCase: AvaliarDesempenhoUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    tokenRepo = InMemoryTokenSupervisorRepository.getInstance();
    tokenRepo.clear();
    useCase = new AvaliarDesempenhoUseCase(periodoRepo, tokenRepo);
  });

  it('deve avaliar o desempenho do estagiário com critérios e atualizar período', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
    });
    await periodoRepo.save(periodo);

    const resultado = await useCase.execute({
      periodoId: 'p1',
      supervisorId: 'sup-01',
      parecer: 'Estagiário demonstrou excelente curva de aprendizado.',
      criterios: [
        { nome: 'Capacidade Técnica', nota: 9.0 },
        { nome: 'Pontualidade', nota: 9.5 },
      ],
    });

    expect(resultado.getAvaliacaoSupervisor()).not.toBeNull();
    expect(resultado.getAvaliacaoSupervisor()?.calcularMedia()).toBe(9.3);
    expect(resultado.getAvaliacaoSupervisor()?.obterFaixaGeral()).toBe('MB');
  });

  it('deve permitir avaliar via token válido do supervisor', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p2',
      estagioId: 'e2',
      alunoId: 'a2',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
    });
    await periodoRepo.save(periodo);

    const token = new TokenSupervisor({
      token: 'tok-supervisor-valido',
      estagioId: 'e2',
      periodoId: 'p2',
      emailSupervisor: 'sup@empresa.com',
      expiraEm: new Date(Date.now() + 86400000),
    });
    await tokenRepo.save(token);

    const resultado = await useCase.execute({
      periodoId: 'p2',
      supervisorId: 'sup-02',
      parecer: 'Avaliação realizada pelo link direto do token.',
      criterios: [{ nome: 'Autonomia', nota: 8.5 }],
      tokenAcesso: 'tok-supervisor-valido',
    });

    expect(resultado.getAvaliacaoSupervisor()).not.toBeNull();
  });

  it('deve rejeitar se token do supervisor for revogado ou expirado', async () => {
    const token = new TokenSupervisor({
      token: 'tok-revogado',
      estagioId: 'e2',
      periodoId: 'p2',
      emailSupervisor: 'sup@empresa.com',
      expiraEm: new Date(Date.now() + 86400000),
      revogado: true,
    });
    await tokenRepo.save(token);

    await expect(
      useCase.execute({
        periodoId: 'p2',
        supervisorId: 'sup-02',
        parecer: 'Tentativa',
        criterios: [{ nome: 'C', nota: 8 }],
        tokenAcesso: 'tok-revogado',
      })
    ).rejects.toThrow('Token de acesso do supervisor é inválido, revogado ou está expirado.');
  });
});
