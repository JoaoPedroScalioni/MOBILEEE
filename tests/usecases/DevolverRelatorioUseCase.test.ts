import { StatusPeriodo } from '../../src/domain/value-objects/StatusPeriodo';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { DevolverRelatorioUseCase } from '../../src/usecases/DevolverRelatorioUseCase';

describe('DevolverRelatorioUseCase', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let useCase: DevolverRelatorioUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    useCase = new DevolverRelatorioUseCase(periodoRepo);
  });

  it('deve devolver relatório com justificativa e alterar status para DEVOLVIDO', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
      status: StatusPeriodo.PENDENTE_SUPERVISOR,
    });
    await periodoRepo.save(periodo);

    const resultado = await useCase.execute({
      periodoId: 'p1',
      motivo: 'A descrição das atividades necessita de mais detalhes técnicos.',
    });

    expect(resultado.getStatus()).toBe(StatusPeriodo.DEVOLVIDO);
    expect(resultado.getMotivoDevolucao()).toBe(
      'A descrição das atividades necessita de mais detalhes técnicos.'
    );
  });
});
