import { act, renderHook } from '@testing-library/react-native';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { useAtividades } from '../../src/adapters/hooks/useAtividades';
import { RegistrarAtividadesUseCase } from '../../src/usecases/RegistrarAtividadesUseCase';

describe('useAtividades Custom Hook', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let useCase: RegistrarAtividadesUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    useCase = new RegistrarAtividadesUseCase(periodoRepo);
  });

  it('deve gerenciar estados idle -> salvando -> salvo com sucesso', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
    });
    await periodoRepo.save(periodo);

    const { result } = await renderHook(() => useAtividades({ useCase }));

    expect(result.current.status).toBe('idle');
    expect(result.current.erro).toBeNull();

    await act(async () => {
      await result.current.salvarAtividades({
        periodoId: 'p1',
        descricao: 'Atividades de desenvolvimento mobile com TDD',
        horasTotais: 300,
        horasMinimas: 60,
        horasPeriodo: 120,
      });
    });

    expect(result.current.status).toBe('salvo');
    expect(result.current.periodo).not.toBeNull();
    expect(result.current.periodo?.getAtividades()?.getCargaHoraria().getHorasPeriodo()).toBe(120);
  });

  it('deve gerenciar estado de erro em caso de falha', async () => {
    const { result } = await renderHook(() => useAtividades({ useCase }));

    await act(async () => {
      await result.current.salvarAtividades({
        periodoId: 'inexistente',
        descricao: 'Teste',
        horasTotais: 100,
        horasMinimas: 20,
        horasPeriodo: 30,
      });
    });

    expect(result.current.status).toBe('erro');
    expect(result.current.erro).toBe('Período de avaliação não encontrado.');
  });
});
