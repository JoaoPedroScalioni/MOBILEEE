import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';

describe('ValorMonetario Value Object', () => {
    it('cria um valor monetário válido', () => {
        const valor = new ValorMonetario(60);
        expect(valor.valor).toBe(60);
    });

    it('aceita valor zero', () => {
        expect(new ValorMonetario(0).valor).toBe(0);
    });

    it('rejeita valor negativo', () => {
        expect(() => new ValorMonetario(-1)).toThrow('Valor monetário inválido');
    });

    it('rejeita valor não numérico', () => {
        expect(() => new ValorMonetario(NaN)).toThrow('Valor monetário inválido');
    });

    it('formata no padrão brasileiro', () => {
        expect(new ValorMonetario(60.5).formatar()).toBe('R$ 60,50');
    });
});