import { Coordenada } from '../../src/domain/value-objects/Coordenada';

describe('Coordenada Value Object', () => {
  it('deve instanciar coordenada válida com latitude, longitude e timestamp', () => {
    const ts = 1700000000000;
    const coord = new Coordenada(-23.55052, -46.633308, ts);
    expect(coord.getLatitude()).toBe(-23.55052);
    expect(coord.getLongitude()).toBe(-46.633308);
    expect(coord.getTimestamp()).toBe(ts);
  });

  it('deve assumir timestamp atual se omitido', () => {
    const antes = Date.now();
    const coord = new Coordenada(0, 0);
    const depois = Date.now();

    expect(coord.getTimestamp()).toBeGreaterThanOrEqual(antes);
    expect(coord.getTimestamp()).toBeLessThanOrEqual(depois);
  });

  it('deve lançar erro se latitude estiver fora do intervalo [-90, 90]', () => {
    expect(() => new Coordenada(-90.1, 0)).toThrow('A latitude deve estar no intervalo de -90 a 90.');
    expect(() => new Coordenada(90.1, 0)).toThrow('A latitude deve estar no intervalo de -90 a 90.');
  });

  it('deve lançar erro se longitude estiver fora do intervalo [-180, 180]', () => {
    expect(() => new Coordenada(0, -180.1)).toThrow('A longitude deve estar no intervalo de -180 a 180.');
    expect(() => new Coordenada(0, 180.1)).toThrow('A longitude deve estar no intervalo de -180 a 180.');
  });

  it('deve lançar erro se latitude ou longitude forem NaN', () => {
    expect(() => new Coordenada(NaN, 0)).toThrow('A latitude deve ser um número válido.');
    expect(() => new Coordenada(0, NaN)).toThrow('A longitude deve ser um número válido.');
  });

  it('deve validar timestamp positivo', () => {
    expect(() => new Coordenada(10, 20, -5)).toThrow(
      'A marca temporal (timestamp) deve ser válida e positiva.'
    );
  });

  it('deve comparar igualdade de coordenadas', () => {
    const c1 = new Coordenada(-20, -45, 1000);
    const c2 = new Coordenada(-20, -45, 1000);
    const c3 = new Coordenada(-20, -45, 2000);

    expect(c1.equals(c2)).toBe(true);
    expect(c1.equals(c3)).toBe(false);
  });
});
