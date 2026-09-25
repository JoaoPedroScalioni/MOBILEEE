import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { AssinarRelatorioUseCase } from '../../src/usecases/AssinarRelatorioUseCase';

describe('AssinarRelatorioUseCase', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let useCase: AssinarRelatorioUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    useCase = new AssinarRelatorioUseCase(periodoRepo);
  });

  it('deve registrar assinatura digital do aluno e do supervisor', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'aluno-01',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
    });
    await periodoRepo.save(periodo);

    await useCase.execute({
      periodoId: 'p1',
      autorId: 'aluno-01',
      papel: 'aluno',
      base64Assinatura: 'data:image/png;base64,alunoass==',
    });

    await useCase.execute({
      periodoId: 'p1',
      autorId: 'supervisor-01',
      papel: 'supervisor',
      base64Assinatura: 'data:image/png;base64,supass==',
    });

    const atualizado = await periodoRepo.findById('p1');
    expect(atualizado?.getAssinaturaAluno()?.getBase64()).toBe('data:image/png;base64,alunoass==');
    expect(atualizado?.getAssinaturaSupervisor()?.getBase64()).toBe(
      'data:image/png;base64,supass=='
    );
  });

  it('deve recusar se o autor da assinatura de aluno não corresponder ao aluno do estágio', async () => {
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
        autorId: 'outro-aluno',
        papel: 'aluno',
        base64Assinatura: 'data:image/png;base64,fake',
      })
    ).rejects.toThrow('Permissão negada: apenas o próprio estagiário pode assinar como aluno.');
  });
});
