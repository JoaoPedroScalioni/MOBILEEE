import { Trabalhador } from '../../src/domain/entities/Trabalhador';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';

function makeTrabalhador() {
    return new Trabalhador('t1', 'José da Silva', '52998224725', 'TRAB-001', new ValorMonetario(60));
}

describe('Trabalhador Entity', () => {
    it('cria um trabalhador válido', () => {
        const t = makeTrabalhador();
        expect(t.id).toBe('t1');
        expect(t.nome).toBe('José da Silva');
        expect(t.cpf).toBe('52998224725');
        expect(t.cracha).toBe('TRAB-001');
        expect(t.diaria.valor).toBe(60);
    });

    it('rejeita id vazio', () => {
        expect(() => new Trabalhador('  ', 'Nome', '52998224725', 'TRAB-001', new ValorMonetario(60)))
            .toThrow('Id de trabalhador inválido');
    });

    it('rejeita nome vazio', () => {
        expect(() => new Trabalhador('t1', '  ', '52998224725', 'TRAB-001', new ValorMonetario(60)))
            .toThrow('Nome de trabalhador inválido');
    });

    it('rejeita CPF com formato inválido', () => {
        expect(() => new Trabalhador('t1', 'Nome', '123', 'TRAB-001', new ValorMonetario(60)))
            .toThrow('CPF inválido');
    });

    it('rejeita crachá vazio', () => {
        expect(() => new Trabalhador('t1', 'Nome', '52998224725', '  ', new ValorMonetario(60)))
            .toThrow('Crachá de trabalhador inválido');
    });
});