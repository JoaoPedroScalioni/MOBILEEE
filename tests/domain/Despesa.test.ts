import { Despesa } from '../../src/domain/entities/Despesa';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';

const AGORA = 1_720_000_000_000;

function makeDespesa(fotoUri: string | null = null) {
    return new Despesa(
        'd1',
        'Óleo diesel',
        new ValorMonetario(150),
        'Combustível',
        new Coordinates(-21.5, -45.9),
        AGORA,
        fotoUri,
    );
}

describe('Despesa Entity', () => {
    it('cria uma despesa válida sem foto', () => {
        const d = makeDespesa();
        expect(d.descricao).toBe('Óleo diesel');
        expect(d.valor.valor).toBe(150);
        expect(d.categoria).toBe('Combustível');
        expect(d.fotoUri).toBeNull();
    });

    it('cria uma despesa válida com foto de recibo', () => {
        const d = makeDespesa('file:///data/comprovante.jpg');
        expect(d.fotoUri).toBe('file:///data/comprovante.jpg');
    });

    it('rejeita descrição vazia', () => {
        expect(() =>
            new Despesa('d1', '  ', new ValorMonetario(150), 'Combustível', new Coordinates(-21.5, -45.9), AGORA),
        ).toThrow('Descrição da despesa inválida');
    });

    it('rejeita categoria desconhecida', () => {
        expect(() =>
            new Despesa('d1', 'Óleo', new ValorMonetario(150), 'Lazer' as unknown as 'Combustível', new Coordinates(-21.5, -45.9), AGORA),
        ).toThrow('Categoria de despesa inválida');
    });

    it('rejeita foto com URI inválida', () => {
        expect(() => makeDespesa('sem-protocolo')).toThrow('Foto da despesa inválida');
    });

    it('rejeita data inválida', () => {
        expect(() =>
            new Despesa('d1', 'Óleo', new ValorMonetario(150), 'Combustível', new Coordinates(-21.5, -45.9), 0),
        ).toThrow('Data da despesa inválida');
    });
});