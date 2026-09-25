import {
  isStatusPeriodoValido,
  StatusPeriodo,
} from '../../src/domain/value-objects/StatusPeriodo';

describe('StatusPeriodo Value Object / Enum', () => {
  it('deve conter todos os estados do ciclo de vida do relatório', () => {
    expect(StatusPeriodo.RASCUNHO).toBe('rascunho');
    expect(StatusPeriodo.PENDENTE_SUPERVISOR).toBe('pendente_supervisor');
    expect(StatusPeriodo.PENDENTE_ASSINATURAS).toBe('pendente_assinaturas');
    expect(StatusPeriodo.APROVADO).toBe('aprovado');
    expect(StatusPeriodo.DEVOLVIDO).toBe('devolvido');
  });

  it('deve validar valores válidos e rejeitar inválidos', () => {
    expect(isStatusPeriodoValido('rascunho')).toBe(true);
    expect(isStatusPeriodoValido('aprovado')).toBe(true);
    expect(isStatusPeriodoValido('devolvido')).toBe(true);
    expect(isStatusPeriodoValido('desconhecido')).toBe(false);
  });
});
