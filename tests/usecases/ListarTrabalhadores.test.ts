import { Trabalhador } from '../../src/domain/entities/Trabalhador';
import { TrabalhadorRepository } from '../../src/domain/repositories/TrabalhadorRepository';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';
import { ListarTrabalhadores } from '../../src/usecases/ListarTrabalhadores';

class FakeTrabalhadorRepository implements TrabalhadorRepository {
    public itens: Trabalhador[] = [];
    async save(t: Trabalhador) {
        this.itens.push(t);
    }
    async findById(id: string) {
        return this.itens.find((t) => t.id === id) ?? null;
    }
    async findByCracha(_codigo: string) {
        return null;
    }
    async findAll() {
        return [...this.itens];
    }
}

describe('ListarTrabalhadores Use Case', () => {
    it('retorna todos os trabalhadores cadastrados', async () => {
        const repo = new FakeTrabalhadorRepository();
        repo.itens.push(
            new Trabalhador('t1', 'José', '52998224725', 'TRAB-001', new ValorMonetario(60)),
            new Trabalhador('t2', 'Maria', '11144477735', 'TRAB-002', new ValorMonetario(60)),
        );
        const useCase = new ListarTrabalhadores(repo);

        const resultado = await useCase.execute();

        expect(resultado).toHaveLength(2);
        expect(resultado[1].nome).toBe('Maria');
    });

    it('retorna lista vazia quando não há trabalhadores', async () => {
        const useCase = new ListarTrabalhadores(new FakeTrabalhadorRepository());
        await expect(useCase.execute()).resolves.toEqual([]);
    });
});