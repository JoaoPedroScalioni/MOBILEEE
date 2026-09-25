import { CargaHoraria } from '../../src/domain/value-objects/CargaHoraria';

describe('CargaHoraria Value Object', () => {
  it('deve instanciar carga horária válida e calcular métricas', () => {
    const ch = new CargaHoraria(300, 60, 150);
    expect(ch.getHorasTotais()).toBe(300);
    expect(ch.getHorasMinimas()).toBe(60);
    expect(ch.getHorasPeriodo()).toBe(150);
    expect(ch.atingiuMinimo()).toBe(true);
    expect(ch.getPercentualConcluido()).toBe(50);
  });

  it('deve validar quando não atingiu o mínimo', () => {
    const ch = new CargaHoraria(300, 60, 40);
    expect(ch.atingiuMinimo()).toBe(false);
  });

  it('deve lançar erro se horas mínimas forem menores ou iguais a zero', () => {
    expect(() => new CargaHoraria(300, 0, 10)).toThrow(
      'A carga horária mínima deve ser um número estritamente maior que zero.'
    );
    expect(() => new CargaHoraria(300, -10, 10)).toThrow(
      'A carga horária mínima deve ser um número estritamente maior que zero.'
    );
  });

  it('deve lançar erro se horas totais ou do período forem negativas', () => {
    expect(() => new CargaHoraria(-1, 60, 10)).toThrow(
      'A carga horária total deve ser um número maior ou igual a zero.'
    );
    expect(() => new CargaHoraria(300, 60, -5)).toThrow(
      'A carga horária do período deve ser um número maior ou igual a zero.'
    );
  });

  it('deve lançar erro se horas do período excederem as horas totais', () => {
    expect(() => new CargaHoraria(100, 20, 120)).toThrow(
      'A carga horária do período não pode exceder as horas totais previstas.'
    );
  });

  it('deve comparar igualdade', () => {
    const ch1 = new CargaHoraria(200, 40, 80);
    const ch2 = new CargaHoraria(200, 40, 80);
    const ch3 = new CargaHoraria(200, 40, 90);

    expect(ch1.equals(ch2)).toBe(true);
    expect(ch1.equals(ch3)).toBe(false);
  });
});
