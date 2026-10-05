import { Estagio } from '../../src/domain/entities/Estagio';
import { Session } from '../../src/domain/entities/Session';
import { TokenSupervisor } from '../../src/domain/entities/TokenSupervisor';
import { User } from '../../src/domain/entities/User';
import { CargaHoraria } from '../../src/domain/value-objects/CargaHoraria';

const estagioProps = () => ({
  id: 'e-1',
  alunoId: 'aluno-1',
  empresa: 'Tech Corp',
  supervisorNome: 'Carlos Silva',
  supervisorEmail: 'CARLOS@TechCorp.com',
  cargaHorariaTotal: new CargaHoraria(400, 100, 0),
  dataInicio: new Date('2026-01-10'),
});

describe('Estagio — invariantes e ciclo de vida', () => {
  it('deve normalizar e expor todos os getters', () => {
    const e = new Estagio(estagioProps());
    expect(e.getAlunoId()).toBe('aluno-1');
    expect(e.getSupervisorNome()).toBe('Carlos Silva');
    expect(e.getSupervisorEmail()).toBe('carlos@techcorp.com');
    expect(e.getCargaHorariaTotal().getHorasTotais()).toBe(400);
    expect(e.getDataInicio()).toEqual(new Date('2026-01-10'));
    expect(e.getDataFim()).toBeUndefined();
  });

  it('deve concluir com data válida e bloquear conclusão anterior ao início', () => {
    const e = new Estagio(estagioProps());
    expect(() => e.concluir(new Date('2025-12-31'))).toThrow(/anterior/);
    expect(e.isAtivo()).toBe(true);

    e.concluir(new Date('2026-06-30'));
    expect(e.isAtivo()).toBe(false);
    expect(e.getDataFim()).toEqual(new Date('2026-06-30'));
  });

  it('deve concluir com data atual por padrão', () => {
    const e = new Estagio({ ...estagioProps(), dataInicio: new Date('2020-01-01') });
    e.concluir();
    expect(e.getDataFim()).toBeInstanceOf(Date);
  });

  it.each([
    ['id', { id: '' }, /id do est/],
    ['aluno', { alunoId: ' ' }, /id do aluno/],
    ['empresa', { empresa: '' }, /empresa/],
    ['supervisor', { supervisorNome: '' }, /nome do supervisor/],
    ['e-mail', { supervisorEmail: 'sem-arroba' }, /e-mail/],
    ['carga horária', { cargaHorariaTotal: undefined }, /carga hor/],
    ['data de início', { dataInicio: undefined }, /data de in/],
  ])('deve rejeitar %s inválido', (_n, override, regex) => {
    expect(() => new Estagio({ ...estagioProps(), ...(override as object) } as any)).toThrow(regex);
  });
});

describe('TokenSupervisor — invariantes, expiração e revogação', () => {
  const props = () => ({
    token: ' tok-1 ',
    estagioId: 'e-1',
    periodoId: 'p-1',
    emailSupervisor: 'SUP@Empresa.com',
    expiraEm: new Date(Date.now() + 3_600_000),
  });

  it('deve normalizar campos e expor getters', () => {
    const criadoEm = new Date('2026-05-01');
    const t = new TokenSupervisor({ ...props(), criadoEm });
    expect(t.getToken()).toBe('tok-1');
    expect(t.getEstagioId()).toBe('e-1');
    expect(t.getPeriodoId()).toBe('p-1');
    expect(t.getEmailSupervisor()).toBe('sup@empresa.com');
    expect(t.getCriadoEm()).toBe(criadoEm);
    expect(t.getExpiraEm()).toBeInstanceOf(Date);
  });

  it('deve invalidar após revogação e respeitar data de referência', () => {
    const t = new TokenSupervisor(props());
    expect(t.isValido()).toBe(true);
    expect(t.isValido(new Date(Date.now() + 7_200_000))).toBe(false);
    t.revogar();
    expect(t.isRevogado()).toBe(true);
    expect(t.isValido()).toBe(false);
  });

  it('deve estender validade apenas com horas positivas', () => {
    const t = new TokenSupervisor(props());
    const antes = t.getExpiraEm().getTime();
    t.estenderValidade(2);
    expect(t.getExpiraEm().getTime()).toBe(antes + 2 * 3_600_000);
    expect(() => t.estenderValidade(0)).toThrow(/positivo/);
    expect(() => t.estenderValidade(NaN)).toThrow(/positivo/);
  });

  it.each([
    ['token', { token: '' }, /token de acesso/],
    ['estágio', { estagioId: '' }, /id do est/],
    ['período', { periodoId: ' ' }, /per.odo/],
    ['e-mail', { emailSupervisor: 'x' }, /e-mail/],
    ['expiração', { expiraEm: undefined }, /expira/],
  ])('deve rejeitar %s inválido', (_n, override, regex) => {
    expect(() => new TokenSupervisor({ ...props(), ...(override as object) } as any)).toThrow(regex);
  });
});

describe('Session — invariantes', () => {
  const user = new User('u1', 'Maria', 'maria@safra.com');

  it('deve validar token, usuário e expiração', () => {
    expect(() => new Session(' ', user, 10)).toThrow(/Token/);
    expect(() => new Session('t', undefined as any, 10)).toThrow(/Usu/);
    expect(() => new Session('t', user, 0)).toThrow(/Expira/);
  });

  it('deve atualizar token revalidando e informar validade temporal', () => {
    const s = new Session('t1', user, 1000);
    s.atualizarToken('t2');
    expect(s.token).toBe('t2');
    expect(() => s.atualizarToken('')).toThrow(/Token/);
    expect(s.isValid(500)).toBe(true);
    expect(s.isValid(2000)).toBe(false);
    expect(typeof s.isValid()).toBe('boolean');
  });
});
