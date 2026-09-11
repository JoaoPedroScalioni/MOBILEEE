import { Apontamento } from '../../src/domain/entities/Apontamento';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { QuantidadeBalaio } from '../../src/domain/value-objects/QuantidadeBalaio';

const AGORA = 1_720_000_000_000;

function makeApontamento() {
    return new Apontamento(
        'apt1',
        'trab-001',
        new QuantidadeBalaio(45),
        new Coordinates(-21.5, -45.9),
        AGORA,
    );
}

describe('Apontamento Entity', () => {
    it('cria um apontamento válido', () => {
        const a = makeApontamento();
        expect(a.id).toBe('apt1');
        expect(a.trabalhadorId).toBe('trab-001');
        expect(a.quantidade.litros).toBe(45);
        expect(a.coordenadas.latitude).toBe(-21.5);
        expect(a.data).toBe(AGORA);
    });

    it('rejeita id vazio', () => {
        expect(() =>
            new Apontamento('', 'trab-001', new QuantidadeBalaio(45), new Coordinates(-21.5, -45.9), AGORA),
        ).toThrow('Id de apontamento inválido');
    });

    it('rejeita trabalhadorId vazio', () => {
        expect(() =>
            new Apontamento('apt1', '  ', new QuantidadeBalaio(45), new Coordinates(-21.5, -45.9), AGORA),
        ).toThrow('Id de trabalhador inválido');
    });

    it('rejeita data inválida', () => {
        expect(() =>
            new Apontamento('apt1', 'trab-001', new QuantidadeBalaio(45), new Coordinates(-21.5, -45.9), 0),
        ).toThrow('Data do apontamento inválida');
    });
});