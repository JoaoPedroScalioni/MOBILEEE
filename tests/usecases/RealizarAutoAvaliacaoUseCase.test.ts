import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { RealizarAutoAvaliacaoUseCase } from '../../src/usecases/RealizarAutoAvaliacaoUseCase';

describe('RealizarAutoAvaliacaoUseCase', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let useCase: RealizarAutoAvaliacaoUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    useCase = new RealizarAutoAvaliacaoUseCase(periodoRepo);
  });

  it('deve registrar autoavaliação com sucesso pelo próprio aluno', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'aluno-01',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
    });
    await periodoRepo.save(periodo);

    const resultado = await useCase.execute({
      periodoId: 'p1',
      alunoId: 'aluno-01',
      parecer: 'Consegui atingir todos os objetivos propostos.',
      criterios: [{ nome: 'Dedicação', nota: 10.0 }],
    });

    expect(resultado.getAutoAvaliacao()).not.toBeNull();
    expect(resultado.getAutoAvaliacao()?.getAlunoId()).toBe('aluno-01');
    expect(resultado.getAutoAvaliacao()?.calcularMedia()).toBe(10.0);
  });

  it('deve lançar erro de permissão se alunoId for diferente do titular do período', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'aluno-01',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
    });
    await periodoRepo.save(periodo);

    await expect(
      useCase.execute({
        periodoId: 'p1',
        alunoId: 'aluno-intruso',
        parecer: 'Tentando avaliar período alheio',
        criterios: [{ nome: 'Dedicação', nota: 10.0 }],
      })
    ).rejects.toThrow('Permissão negada: o aluno informado não é o titular deste período de estágio.');
  });
});
