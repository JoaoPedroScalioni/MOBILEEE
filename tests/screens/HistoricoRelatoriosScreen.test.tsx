import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { StatusPeriodo } from '../../src/domain/value-objects/StatusPeriodo';
import { StatusSincronizacao } from '../../src/domain/value-objects/StatusSincronizacao';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { InMemoryPdfGateway } from '../../src/infra/InMemoryPdfGateway';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { HistoricoRelatoriosScreen } from '../../src/adapters/screens/HistoricoRelatoriosScreen';
import { GerarPdfUseCase } from '../../src/usecases/GerarPdfUseCase';
import { SincronizarFilaUseCase } from '../../src/usecases/SincronizarFilaUseCase';

describe('HistoricoRelatoriosScreen (RNTL Component Testing)', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let pdfGateway: InMemoryPdfGateway;
  let gerarPdfUseCase: GerarPdfUseCase;
  let sincronizarUseCase: SincronizarFilaUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    pdfGateway = new InMemoryPdfGateway();
    gerarPdfUseCase = new GerarPdfUseCase(periodoRepo, pdfGateway);
    sincronizarUseCase = new SincronizarFilaUseCase(periodoRepo);
  });

  it('deve listar períodos e permitir sincronizar fila via toque', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p-hist-1',
      estagioId: 'estagio-01',
      alunoId: 'aluno-01',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
      status: StatusPeriodo.RASCUNHO,
      statusSincronizacao: StatusSincronizacao.PENDING,
    });
    await periodoRepo.save(periodo);

    const { getByTestId, findByText } = await render(
      <HistoricoRelatoriosScreen
        periodosIniciais={[periodo]}
        gerarPdfUseCase={gerarPdfUseCase}
        sincronizarFilaUseCase={sincronizarUseCase}
      />
    );

    expect(getByTestId('item-periodo-p-hist-1')).toBeTruthy();

    await fireEvent.press(getByTestId('btn-sincronizar'));

    expect(await findByText(/Sincronização concluída: 1 sincronizados/)).toBeTruthy();
  });
});
