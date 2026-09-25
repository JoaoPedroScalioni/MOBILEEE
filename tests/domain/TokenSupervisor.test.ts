import { TokenSupervisor } from '../../src/domain/entities/TokenSupervisor';

describe('TokenSupervisor Entity', () => {
  it('deve instanciar um token de supervisor válido', () => {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const token = new TokenSupervisor({
      token: 'tok-abc-123',
      estagioId: 'estagio-01',
      periodoId: 'periodo-01',
      emailSupervisor: 'supervisor@empresa.com',
      expiraEm: amanha,
    });

    expect(token.getToken()).toBe('tok-abc-123');
    expect(token.isRevogado()).toBe(false);
    expect(token.isValido()).toBe(true);
  });

  it('deve identificar token expirado', () => {
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const token = new TokenSupervisor({
      token: 'tok-expirado',
      estagioId: 'estagio-01',
      periodoId: 'periodo-01',
      emailSupervisor: 'supervisor@empresa.com',
      expiraEm: ontem,
    });

    expect(token.isValido()).toBe(false);
  });

  it('deve permitir revogar token e estender validade', () => {
    const daqui1Hora = new Date(Date.now() + 60 * 60 * 1000);
    const token = new TokenSupervisor({
      token: 'tok-valido',
      estagioId: 'estagio-01',
      periodoId: 'periodo-01',
      emailSupervisor: 'supervisor@empresa.com',
      expiraEm: daqui1Hora,
    });

    token.estenderValidade(48); // + 48 horas
    expect(token.getExpiraEm().getTime()).toBeGreaterThan(daqui1Hora.getTime());

    token.revogar();
    expect(token.isRevogado()).toBe(true);
    expect(token.isValido()).toBe(false);
  });
});
