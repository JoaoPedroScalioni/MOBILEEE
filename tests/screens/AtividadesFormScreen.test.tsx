import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { AtividadesFormScreen } from '../../src/adapters/screens/AtividadesFormScreen';
import { RegistrarAtividadesUseCase } from '../../src/usecases/RegistrarAtividadesUseCase';

describe('AtividadesFormScreen (RNTL Component Testing)', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let useCase: RegistrarAtividadesUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    useCase = new RegistrarAtividadesUseCase(periodoRepo);
  });

  it('deve renderizar o formulário e permitir submissão com sucesso simulando eventos do usuário', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'periodo-01',
      estagioId: 'estagio-01',
      alunoId: 'aluno-01',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
    });
    await periodoRepo.save(periodo);

    const onSalvoMock = jest.fn();

    const { getByTestId, findByText } = await render(
      <AtividadesFormScreen
        periodoId="periodo-01"
        onSalvoComSucesso={onSalvoMock}
        hookOptions={{ useCase }}
      />
    );

    // Simula usuário digitando a descrição
    await fireEvent.changeText(
      getByTestId('input-descricao'),
      'Desenvolvimento de casos de uso e testes com RNTL'
    );
    await fireEvent.changeText(getByTestId('input-horas-periodo'), '100');

    // Alterna o botão do GPS
    await fireEvent.press(getByTestId('btn-gps'));

    // Pressiona o botão de salvar
    await fireEvent.press(getByTestId('btn-salvar'));

    // Valida feedback visual
    expect(await findByText('Atividades salvas com sucesso!')).toBeTruthy();
    expect(onSalvoMock).toHaveBeenCalledTimes(1);

    // Valida estado salvo no repositório Fake
    const periodoSalvo = await periodoRepo.findById('periodo-01');
    expect(periodoSalvo?.getAtividades()?.getDescricao()).toBe(
      'Desenvolvimento de casos de uso e testes com RNTL'
    );
  });

  it('deve exibir mensagem de erro se a validação falhar', async () => {
    const { getByTestId, findByText } = await render(
      <AtividadesFormScreen
        periodoId="periodo-inexistente"
        hookOptions={{ useCase }}
      />
    );

    await fireEvent.changeText(getByTestId('input-descricao'), 'Curto');
    await fireEvent.press(getByTestId('btn-salvar'));

    expect(await findByText('Período de avaliação não encontrado.')).toBeTruthy();
  });
});
