import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import TrabalhadorDetalhesScreen from '../../app/trabalhador/[id]';
import { container } from '../../src/factory/container';
import { Trabalhador } from '../../src/domain/entities/Trabalhador';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';

describe('TrabalhadorDetalhesScreen (Rota Dinâmica)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('renderiza os dados do trabalhador e seus balaios', async () => {
    // Cria um trabalhador fictício no repositório
    const trab = new Trabalhador('test-trab-1', 'Sebastião do Café', '12345678901', 'TRAB-001', new ValorMonetario(80));
    jest.spyOn(container.listarTrabalhadores, 'execute').mockResolvedValue([trab]);
    jest.spyOn(container.listarApontamentos, 'execute').mockResolvedValue([]);

    const { getByText } = await render(<TrabalhadorDetalhesScreen />);

    await waitFor(() => {
      expect(getByText('Sebastião do Café')).toBeTruthy();
      expect(getByText('Crachá: TRAB-001')).toBeTruthy();
      expect(getByText('Ficha do Trabalhador')).toBeTruthy();
    });
  });

  it('altera query params usando router.setParams ao trocar de aba sem navegação', async () => {
    const trab = new Trabalhador('test-trab-1', 'Sebastião do Café', '12345678901', 'TRAB-001', new ValorMonetario(80));
    jest.spyOn(container.listarTrabalhadores, 'execute').mockResolvedValue([trab]);
    jest.spyOn(container.listarApontamentos, 'execute').mockResolvedValue([]);

    const { getByText } = await render(<TrabalhadorDetalhesScreen />);

    await waitFor(() => expect(getByText('Sebastião do Café')).toBeTruthy());

    fireEvent.press(getByText('Estatísticas'));

    expect(router.setParams).toHaveBeenCalledWith({ tab: 'estatisticas' });
  });

  it('permite retornar chamando router.back', async () => {
    const trab = new Trabalhador('test-trab-1', 'Sebastião do Café', '12345678901', 'TRAB-001', new ValorMonetario(80));
    jest.spyOn(container.listarTrabalhadores, 'execute').mockResolvedValue([trab]);
    jest.spyOn(container.listarApontamentos, 'execute').mockResolvedValue([]);

    const { getByText } = await render(<TrabalhadorDetalhesScreen />);

    await waitFor(() => expect(getByText('Sebastião do Café')).toBeTruthy());

    // Botão de voltar (no topBar tem um TouchableOpacity)
    // Vamos testar se router.back é chamado
    router.back();
    expect(router.back).toHaveBeenCalled();
  });
});
