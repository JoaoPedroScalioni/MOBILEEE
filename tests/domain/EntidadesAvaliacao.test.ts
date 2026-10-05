import { AtividadesDesenvolvidas } from '../../src/domain/entities/AtividadesDesenvolvidas';
import { AutoAvaliacao } from '../../src/domain/entities/AutoAvaliacao';
import { AvaliacaoSupervisor } from '../../src/domain/entities/AvaliacaoSupervisor';
import { User } from '../../src/domain/entities/User';
import { CargaHoraria } from '../../src/domain/value-objects/CargaHoraria';
import { Coordenada } from '../../src/domain/value-objects/Coordenada';
import { Criterio } from '../../src/domain/value-objects/Criterio';

const criterios = (...notas: number[]) => notas.map((n, i) => new Criterio(`Criterio ${i + 1}`, n));

describe('AutoAvaliacao (entidade)', () => {
  const base = () => ({
    id: 'auto-1',
    alunoId: 'aluno-1',
    criterios: criterios(9, 9),
    parecer: 'Bom desempenho geral',
  });

  it('deve instanciar, expor getters e calcular média/faixa MB', () => {
    const data = new Date('2026-05-01');
    const a = new AutoAvaliacao({ ...base(), id: '  auto-1 ', dataAvaliacao: data });

    expect(a.getId()).toBe('auto-1');
    expect(a.getAlunoId()).toBe('aluno-1');
    expect(a.getCriterios()).toHaveLength(2);
    expect(a.getParecer()).toBe('Bom desempenho geral');
    expect(a.getDataAvaliacao()).toBe(data);
    expect(a.calcularMedia()).toBe(9);
    expect(a.obterFaixaGeral()).toBe('MB');
  });

  it.each([
    [[7.5, 7.5], 'B'],
    [[5, 6], 'R'],
    [[1, 2], 'F'],
  ])('deve classificar a faixa geral (%j => %s)', (notas, faixa) => {
    const a = new AutoAvaliacao({ ...base(), criterios: criterios(...(notas as number[])) });
    expect(a.obterFaixaGeral()).toBe(faixa);
  });

  it('deve proteger a lista interna de critérios (cópia defensiva)', () => {
    const a = new AutoAvaliacao(base());
    a.getCriterios().pop();
    expect(a.getCriterios()).toHaveLength(2);
  });

  it('deve usar data atual quando não informada', () => {
    expect(new AutoAvaliacao(base()).getDataAvaliacao()).toBeInstanceOf(Date);
  });

  it.each([
    ['id vazio', { id: ' ' }, /id da autoavalia/],
    ['aluno vazio', { alunoId: '' }, /aluno/],
    ['sem critérios', { criterios: [] }, /ao menos um crit/],
    ['parecer curto', { parecer: 'ok' }, /m.nimo 5/],
  ])('deve rejeitar %s', (_nome, override, regex) => {
    expect(() => new AutoAvaliacao({ ...base(), ...(override as object) })).toThrow(regex);
  });
});

describe('AvaliacaoSupervisor (entidade)', () => {
  const base = () => ({
    id: 'av-1',
    supervisorId: 'sup-1',
    criterios: criterios(8, 8, 8),
    parecer: 'Aluno dedicado e pontual',
  });

  it('deve instanciar, expor getters e calcular média/faixa B', () => {
    const data = new Date('2026-05-02');
    const a = new AvaliacaoSupervisor({ ...base(), dataAvaliacao: data });

    expect(a.getId()).toBe('av-1');
    expect(a.getSupervisorId()).toBe('sup-1');
    expect(a.getCriterios()).toHaveLength(3);
    expect(a.getParecer()).toBe('Aluno dedicado e pontual');
    expect(a.getDataAvaliacao()).toBe(data);
    expect(a.calcularMedia()).toBe(8);
    expect(a.obterFaixaGeral()).toBe('B');
  });

  it.each([
    [[10, 9], 'MB'],
    [[5, 5], 'R'],
    [[0, 4], 'F'],
  ])('deve classificar a faixa geral (%j => %s)', (notas, faixa) => {
    const a = new AvaliacaoSupervisor({ ...base(), criterios: criterios(...(notas as number[])) });
    expect(a.obterFaixaGeral()).toBe(faixa);
  });

  it('deve usar data atual quando não informada e copiar critérios', () => {
    const a = new AvaliacaoSupervisor(base());
    a.getCriterios().pop();
    expect(a.getCriterios()).toHaveLength(3);
    expect(a.getDataAvaliacao()).toBeInstanceOf(Date);
  });

  it.each([
    ['id vazio', { id: '' }, /id da avalia/],
    ['supervisor vazio', { supervisorId: ' ' }, /supervisor/],
    ['sem critérios', { criterios: [] }, /ao menos um crit/],
    ['parecer curto', { parecer: 'ruim' }, /m.nimo 5/],
  ])('deve rejeitar %s', (_nome, override, regex) => {
    expect(() => new AvaliacaoSupervisor({ ...base(), ...(override as object) })).toThrow(regex);
  });
});

describe('AtividadesDesenvolvidas (entidade)', () => {
  const carga = new CargaHoraria(400, 100, 20);

  it('deve instanciar com coordenada opcional e expor getters', () => {
    const coord = new Coordenada(-21.2, -44.9, 1_720_000_000_000);
    const data = new Date('2026-05-03');
    const a = new AtividadesDesenvolvidas({
      id: ' at-1 ',
      descricao: '  Desenvolvimento de API  ',
      cargaHoraria: carga,
      coordenada: coord,
      dataRegistro: data,
    });

    expect(a.getId()).toBe('at-1');
    expect(a.getDescricao()).toBe('Desenvolvimento de API');
    expect(a.getCargaHoraria()).toBe(carga);
    expect(a.getCoordenada()).toBe(coord);
    expect(a.getDataRegistro()).toBe(data);
  });

  it('deve aceitar atividade sem coordenada e data atual por padrão', () => {
    const a = new AtividadesDesenvolvidas({ id: 'at-2', descricao: 'Testes unitários', cargaHoraria: carga });
    expect(a.getCoordenada()).toBeUndefined();
    expect(a.getDataRegistro()).toBeInstanceOf(Date);
  });

  it.each([
    ['id vazio', { id: '' }, /id das atividades/],
    ['descrição curta', { descricao: 'abc' }, /m.nimo 5/],
    ['sem carga horária', { cargaHoraria: undefined }, /carga hor/],
  ])('deve rejeitar %s', (_nome, override, regex) => {
    expect(
      () =>
        new AtividadesDesenvolvidas({
          id: 'at-x',
          descricao: 'Descrição válida',
          cargaHoraria: carga,
          ...(override as object),
        } as any),
    ).toThrow(regex);
  });
});

describe('User (entidade) — auto-validação e update*()', () => {
  it('deve criar usuário válido e relançar validação nos updates', () => {
    const u = new User('u1', 'Maria', 'maria@safra.com');
    u.atualizarNome('Maria Souza');
    u.atualizarEmail('maria.souza@safra.com');
    expect(u.name).toBe('Maria Souza');
    expect(u.email).toBe('maria.souza@safra.com');

    expect(() => u.atualizarNome(' ')).toThrow(/Nome/);
    expect(u.name).toBe('Maria Souza');
    expect(() => u.atualizarEmail('invalido')).toThrow(/E-mail/);
    expect(u.email).toBe('maria.souza@safra.com');
  });

  it('deve rejeitar id, nome ou e-mail inválidos na criação', () => {
    expect(() => new User(' ', 'Maria', 'a@b.com')).toThrow(/Id/);
    expect(() => new User('u1', ' ', 'a@b.com')).toThrow(/Nome/);
    expect(() => new User('u1', 'Maria', 'sem-arroba')).toThrow(/E-mail/);
  });
});
