import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { StatusSincronizacao } from '../../src/domain/value-objects/StatusSincronizacao';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import {
  RemoteSyncGateway,
  SincronizarFilaUseCase,
} from '../../src/usecases/SincronizarFilaUseCase';

describe('SincronizarFilaUseCase', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
  });

  it('deve sincronizar períodos pendentes localmente e marcar assinaturas como sincronizadas', async () => {
    const useCase = new SincronizarFilaUseCase(periodoRepo);
    const p1 = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
      statusSincronizacao: StatusSincronizacao.PENDING,
      assinaturasSincronizadas: false,
    });
    await periodoRepo.save(p1);

    const resultado = await useCase.execute();

    expect(resultado.totalPendentes).toBe(1);
    expect(resultado.sincronizados).toBe(1);
    expect(resultado.falhas).toBe(0);

    const atualizado = await periodoRepo.findById('p1');
    expect(atualizado?.getStatusSincronizacao()).toBe(StatusSincronizacao.SYNCED);
    expect(atualizado?.isAssinaturasSincronizadas()).toBe(true);
  });

  it('deve registrar falhas quando gateway remoto rejeitar envio ou disparar exceção', async () => {
    const mockGateway: RemoteSyncGateway = {
      enviarPeriodo: jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockRejectedValueOnce(new Error('Network failure')),
    };

    const useCase = new SincronizarFilaUseCase(periodoRepo, mockGateway);

    const p1 = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
      statusSincronizacao: StatusSincronizacao.PENDING,
    });
    const p2 = new PeriodoAvaliacao({
      id: 'p2',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 2,
      dataInicio: new Date('2026-07-01'),
      dataFim: new Date('2026-12-01'),
      statusSincronizacao: StatusSincronizacao.PENDING,
    });

    await periodoRepo.save(p1);
    await periodoRepo.save(p2);

    const resultado = await useCase.execute();

    expect(resultado.totalPendentes).toBe(2);
    expect(resultado.falhas).toBe(2);
    expect(resultado.sincronizados).toBe(0);

    const p1Atualizado = await periodoRepo.findById('p1');
    expect(p1Atualizado?.getStatusSincronizacao()).toBe(StatusSincronizacao.ERROR);
  });
});
