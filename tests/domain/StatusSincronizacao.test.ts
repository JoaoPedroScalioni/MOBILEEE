import {
  isStatusSincronizacaoValido,
  StatusSincronizacao,
} from '../../src/domain/value-objects/StatusSincronizacao';

describe('StatusSincronizacao Value Object / Enum', () => {
  it('deve conter os valores corretos: pending, synced e error', () => {
    expect(StatusSincronizacao.PENDING).toBe('pending');
    expect(StatusSincronizacao.SYNCED).toBe('synced');
    expect(StatusSincronizacao.ERROR).toBe('error');
  });

  it('deve validar valores válidos e rejeitar inválidos', () => {
    expect(isStatusSincronizacaoValido('pending')).toBe(true);
    expect(isStatusSincronizacaoValido('synced')).toBe(true);
    expect(isStatusSincronizacaoValido('error')).toBe(true);
    expect(isStatusSincronizacaoValido('invalido')).toBe(false);
  });
});
