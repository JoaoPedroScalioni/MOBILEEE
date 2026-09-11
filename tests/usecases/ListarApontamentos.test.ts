import { Apontamento } from '../../src/domain/entities/Apontamento';
import { ApontamentoRepository } from '../../src/domain/repositories/ApontamentoRepository';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { QuantidadeBalaio } from '../../src/domain/value-objects/QuantidadeBalaio';
import { ListarApontamentos } from '../../src/usecases/ListarApontamentos';

const AGORA = 1_720_000_000_000;

class FakeApontamentoRepository implements ApontamentoRepository {
    public itens: Apontamento[] = [];
    async save(a: Apontamento) {
        this.itens.push(a);
    }
    async findById(id: string) {
        return this.itens.find((a) => a.id === id) ?? null;
    }
    async findByTrabalhadorId(id: string) {
        return this.itens.filter((a) => a.trabalhadorId === id);
    }
    async findAll() {
        return [...this.itens];
    }
}

describe('ListarApontamentos Use Case', () => {
    it('retorna todos os apontamentos', async () => {
        const repo = new FakeApontamentoRepository();
        repo.itens.push(
            new Apontamento('a1', 't1', new QuantidadeBalaio(45), new Coordinates(-21.5, -45.9), AGORA),
            new Apontamento('a2', 't2', new QuantidadeBalaio(60), new Coordinates(-21.6, -45.8), AGORA),
        );
        const useCase = new ListarApontamentos(repo);

        const resultado = await useCase.execute();

        expect(resultado).toHaveLength(2);
        expect(resultado[0].quantidade.litros).toBe(45);
    });

    it('retorna ordem por filtro de trabalhador', async () => {
        const repo = new FakeApontamentoRepository();
        repo.itens.push(
            new Apontamento('a1', 't1', new QuantidadeBalaio(45), new Coordinates(-21.5, -45.9), AGORA),
            new Apontamento('a2', 't2', new QuantidadeBalaio(60), new Coordinates(-21.6, -45.8), AGORA),
        );
        const useCase = new ListarApontamentos(repo);

        const resultado = await repo.findByTrabalhadorId('t2');

        expect(resultado).toHaveLength(1);
        expect(resultado[0].id).toBe('a2');
    });
});