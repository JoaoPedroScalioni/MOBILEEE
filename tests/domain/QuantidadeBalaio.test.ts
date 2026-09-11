import { QuantidadeBalaio } from '../../src/domain/value-objects/QuantidadeBalaio';

describe('QuantidadeBalaio Value Object', () => {
    it('cria uma quantidade válida com litros positivos', () => {
        const qtd = new QuantidadeBalaio(45);
        expect(qtd.litros).toBe(45);
    });

    it('rejeita quantidade zero ou negativa', () => {
        expect(() => new QuantidadeBalaio(0)).toThrow('Quantidade de balaio inválida');
        expect(() => new QuantidadeBalaio(-3)).toThrow('Quantidade de balaio inválida');
    });

    it('rejeita valor não numérico', () => {
        expect(() => new QuantidadeBalaio(NaN)).toThrow('Quantidade de balaio inválida');
    });
});