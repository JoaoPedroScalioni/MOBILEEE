import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { AssinaturaScreen } from '../../src/adapters/screens/AssinaturaScreen';
import { AssinarRelatorioUseCase } from '../../src/usecases/AssinarRelatorioUseCase';

describe('AssinaturaScreen (RNTL Component Testing)', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let assinarUseCase: AssinarRelatorioUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    assinarUseCase = new AssinarRelatorioUseCase(periodoRepo);
  });

  it('deve registrar assinatura digital simulando toque nos botões e inputs', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'aluno-01',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
    });
    await periodoRepo.save(periodo);

    const onConcluidoMock = jest.fn();

    const { getByTestId, findByText } = await render(
      <AssinaturaScreen
        periodoId="p1"
        autorIdPadrao="aluno-01"
        assinarUseCase={assinarUseCase}
        onAssinaturaConcluida={onConcluidoMock}
      />
    );

    // Seleciona papel aluno
    await fireEvent.press(getByTestId('btn-papel-aluno'));

    // Pressiona o botão de assinar
    await fireEvent.press(getByTestId('btn-assinar'));

    expect(
      await findByText('Assinatura registrada e vinculada com sucesso!')
    ).toBeTruthy();
    expect(onConcluidoMock).toHaveBeenCalledTimes(1);

    const periodoAtualizado = await periodoRepo.findById('p1');
    expect(periodoAtualizado?.getAssinaturaAluno()).not.toBeNull();
  });
});
