import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import CentralSincronizacaoModal from '../../app/modal';
import { container } from '../../src/factory/container';

describe('CentralSincronizacaoModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza os cards de sincronização e métricas', async () => {
    jest.spyOn(container.syncQueueRepository, 'findPending').mockResolvedValue([]);
    jest.spyOn(container.listarTrabalhadores, 'execute').mockResolvedValue([]);
    jest.spyOn(container.listarApontamentos, 'execute').mockResolvedValue([]);
    jest.spyOn(container.listarDespesas, 'execute').mockResolvedValue([]);

    const { getByText } = await render(<CentralSincronizacaoModal />);

    await waitFor(() => {
      expect(getByText('Nuvem & Sincronização')).toBeTruthy();
      expect(getByText('Fila Offline (SQLite Outbox)')).toBeTruthy();
      expect(getByText('SQLite Local (Offline-First)')).toBeTruthy();
      expect(getByText('Supabase Cloud BaaS')).toBeTruthy();
    });
  });

  it('executa sincronização com Supabase ao pressionar o botão', async () => {
    jest.spyOn(container.syncQueueRepository, 'findPending').mockResolvedValue([]);
    jest.spyOn(container.listarTrabalhadores, 'execute').mockResolvedValue([]);
    jest.spyOn(container.listarApontamentos, 'execute').mockResolvedValue([]);
    jest.spyOn(container.listarDespesas, 'execute').mockResolvedValue([]);
    const syncSpy = jest.spyOn(container.syncPendingQueueSupabase, 'execute').mockResolvedValue({
      synchronized: 3,
      pending: 0,
      offline: false,
    });

    const { getByText } = await render(<CentralSincronizacaoModal />);

    await waitFor(() => expect(getByText('Sincronizar Agora com a Nuvem')).toBeTruthy());

    fireEvent.press(getByText('Sincronizar Agora com a Nuvem'));

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalled();
      expect(getByText('3 item(ns) sincronizado(s) com sucesso no Supabase!')).toBeTruthy();
    });
  });
});
