import { Despesa } from '../../src/domain/entities/Despesa';
import { DespesaRepository } from '../../src/domain/repositories/DespesaRepository';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';
import { ListarDespesas } from '../../src/usecases/ListarDespesas';

const AGORA = 1_720_000_000_000;

class FakeDespesaRepository implements DespesaRepository {
    public itens: Despesa[] = [];
    async save(d: Despesa) {
        this.itens.push(d);
    }
    async findById(id: string) {
        return this.itens.find((d) => d.id === id) ?? null;
    }
    async findAll() {
        return [...this.itens];
    }
}

describe('ListarDespesas Use Case', () => {
    it('retorna todas as despesas', async () => {
        const repo = new FakeDespesaRepository();
        repo.itens.push(
            new Despesa('d1', 'Óleo', new ValorMonetario(150), 'Combustível', new Coordinates(-21.5, -45.9), AGORA),
            new Despesa('d2', 'Condução', new ValorMonetario(25), 'Transporte', new Coordinates(-21.5, -45.9), AGORA),
        );
        const useCase = new ListarDespesas(repo);

        const resultado = await useCase.execute();

        expect(resultado).toHaveLength(2);
        expect(resultado[1].descricao).toBe('Condução');
    });

    it('retorna lista vazia quando não há despesas', async () => {
        const useCase = new ListarDespesas(new FakeDespesaRepository());
        await expect(useCase.execute()).resolves.toEqual([]);
    });
});