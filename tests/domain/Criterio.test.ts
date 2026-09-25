import { Criterio } from '../../src/domain/value-objects/Criterio';

describe('Criterio Value Object', () => {
  it('deve instanciar um critério válido com nome e nota', () => {
    const criterio = new Criterio('Comunicação e Trabalho em Equipe', 9.5);
    expect(criterio.getNome()).toBe('Comunicação e Trabalho em Equipe');
    expect(criterio.getNota()).toBe(9.5);
    expect(criterio.getFaixa()).toBe('MB');
  });

  it('deve calcular corretamente todas as faixas (MB, B, R, F)', () => {
    expect(new Criterio('Item 1', 10).getFaixa()).toBe('MB');
    expect(new Criterio('Item 2', 8.5).getFaixa()).toBe('MB');
    expect(new Criterio('Item 3', 8.4).getFaixa()).toBe('B');
    expect(new Criterio('Item 4', 7.0).getFaixa()).toBe('B');
    expect(new Criterio('Item 5', 6.9).getFaixa()).toBe('R');
    expect(new Criterio('Item 6', 5.0).getFaixa()).toBe('R');
    expect(new Criterio('Item 7', 4.9).getFaixa()).toBe('F');
    expect(new Criterio('Item 8', 0).getFaixa()).toBe('F');
  });

  it('deve lançar erro se o nome for vazio ou contiver apenas espaços', () => {
    expect(() => new Criterio('', 8)).toThrow('O nome do critério não pode ser vazio.');
    expect(() => new Criterio('   ', 8)).toThrow('O nome do critério não pode ser vazio.');
  });

  it('deve lançar erro se a nota for menor que 0 ou maior que 10', () => {
    expect(() => new Criterio('Pontualidade', -0.5)).toThrow(
      'A nota do critério deve estar entre 0 e 10.'
    );
    expect(() => new Criterio('Pontualidade', 10.1)).toThrow(
      'A nota do critério deve estar entre 0 e 10.'
    );
  });

  it('deve lançar erro se a nota for inválida (NaN)', () => {
    expect(() => new Criterio('Pontualidade', NaN)).toThrow(
      'A nota do critério deve ser um número válido.'
    );
  });

  it('deve comparar igualdade entre critérios', () => {
    const c1 = new Criterio('Proatividade', 8.0);
    const c2 = new Criterio('Proatividade', 8.0);
    const c3 = new Criterio('Proatividade', 9.0);

    expect(c1.equals(c2)).toBe(true);
    expect(c1.equals(c3)).toBe(false);
  });
});
