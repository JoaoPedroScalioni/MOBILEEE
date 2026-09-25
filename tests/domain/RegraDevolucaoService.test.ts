import { StatusPeriodo } from '../../src/domain/value-objects/StatusPeriodo';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { RegraDevolucaoService } from '../../src/domain/services/RegraDevolucaoService';

describe('RegraDevolucaoService Domain Service', () => {
  it('deve validar e executar devolução com justificativa válida', () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
      status: StatusPeriodo.PENDENTE_SUPERVISOR,
    });

    RegraDevolucaoService.executarDevolucao(periodo, 'Favor corrigir o detalhamento de horas.');
    expect(periodo.getStatus()).toBe(StatusPeriodo.DEVOLVIDO);
    expect(periodo.getMotivoDevolucao()).toBe('Favor corrigir o detalhamento de horas.');
  });

  it('deve rejeitar devolução com justificativa muito curta', () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
      status: StatusPeriodo.PENDENTE_SUPERVISOR,
    });

    expect(() => RegraDevolucaoService.executarDevolucao(periodo, 'erro')).toThrow(
      'A justificativa da devolução deve possuir no mínimo 5 caracteres explicativos.'
    );
  });
});
