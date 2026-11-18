import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Updates from 'expo-updates';
import { OtaUpdatePrompt } from '../../src/shared/components/OtaUpdatePrompt';

const mockUseUpdates = jest.fn();
const mockCheckForUpdateAsync = jest.fn();
const mockFetchUpdateAsync = jest.fn();
const mockReloadAsync = jest.fn();

jest.mock('expo-updates', () => ({
  isEnabled: true,
  useUpdates: () => mockUseUpdates(),
  checkForUpdateAsync: () => mockCheckForUpdateAsync(),
  fetchUpdateAsync: () => mockFetchUpdateAsync(),
  reloadAsync: () => mockReloadAsync(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('OtaUpdatePrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckForUpdateAsync.mockResolvedValue({ isAvailable: false });
    mockFetchUpdateAsync.mockResolvedValue({ isNew: true });
    mockReloadAsync.mockResolvedValue(undefined);
  });

  it('deve exibir aviso de Atualização do Sistema quando houver update disponível e baixar ao clicar OK', async () => {
    mockUseUpdates.mockReturnValue({
      isUpdateAvailable: true,
      isUpdatePending: false,
      isDownloading: false,
      downloadProgress: 0,
    });

    const { getByText } = await render(<OtaUpdatePrompt forceEnabledForTest />);

    expect(getByText('Atualização do Sistema')).toBeTruthy();

    fireEvent.press(getByText('OK, Atualizar'));

    await waitFor(() => {
      expect(mockFetchUpdateAsync).toHaveBeenCalledTimes(1);
      expect(mockReloadAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('deve aplicar diretamente via reloadAsync quando a atualização já estiver baixada (isUpdatePending)', async () => {
    mockUseUpdates.mockReturnValue({
      isUpdateAvailable: true,
      isUpdatePending: true,
      isDownloading: false,
      downloadProgress: 1,
    });

    const { getByText } = await render(<OtaUpdatePrompt forceEnabledForTest />);

    fireEvent.press(getByText('OK, Atualizar'));

    await waitFor(() => {
      expect(mockFetchUpdateAsync).not.toHaveBeenCalled();
      expect(mockReloadAsync).toHaveBeenCalledTimes(1);
    });
  });

  it('deve fechar o aviso ao clicar em Depois sem reiniciar o app', async () => {
    mockUseUpdates.mockReturnValue({
      isUpdateAvailable: true,
      isUpdatePending: false,
      isDownloading: false,
      downloadProgress: 0,
    });

    const { getByText, queryByText } = await render(<OtaUpdatePrompt forceEnabledForTest />);

    fireEvent.press(getByText('Depois'));

    await waitFor(() => {
      expect(queryByText('Atualização do Sistema')).toBeNull();
    });
    expect(mockReloadAsync).not.toHaveBeenCalled();
  });
});
