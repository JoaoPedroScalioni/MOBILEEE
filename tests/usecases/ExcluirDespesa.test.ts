import { Despesa } from '../../src/domain/entities/Despesa';
import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { DespesaRepository } from '../../src/domain/repositories/DespesaRepository';
import { SyncQueueRepository } from '../../src/domain/repositories/SyncQueueRepository';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';
import { ExcluirDespesa } from '../../src/usecases/ExcluirDespesa';

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
    async delete(id: string) {
        this.itens = this.itens.filter((d) => d.id !== id);
    }
}

class FakeSyncQueueRepository implements SyncQueueRepository {
    public itens: SyncQueueItem[] = [];
    async enqueue(item: SyncQueueItem) {
        this.itens.push(item);
    }
    async save(_item: SyncQueueItem) {}
    async remove(_id: string) {}
    async findById(_id: string) {
        return null;
    }
    async findPending() {
        return [];
    }
    async findAll() {
        return [...this.itens];
    }
}

describe('ExcluirDespesa Use Case', () => {
    it('remove a despesa do repositório e enfileira DELETE na sincronização', async () => {
        const repo = new FakeDespesaRepository();
        const fila = new FakeSyncQueueRepository();
        const despesa = new Despesa(
            'd1',
            'Combustível',
            new ValorMonetario(150),
            'Combustível',
            new Coordinates(-20.5, -45.5),
            Date.now(),
        );
        repo.itens.push(despesa);

        const useCase = new ExcluirDespesa(repo, fila);
        await useCase.execute({ id: 'd1' });

        expect(repo.itens).toHaveLength(0);
        expect(fila.itens).toHaveLength(1);
        expect(fila.itens[0].entity).toBe('Despesa');
        expect(fila.itens[0].entityId).toBe('d1');
        expect(fila.itens[0].operation).toBe('DELETE');
    });

    it('rejeita excluir despesa que não existe', async () => {
        const repo = new FakeDespesaRepository();
        const useCase = new ExcluirDespesa(repo);

        await expect(useCase.execute({ id: 'inexistente' })).rejects.toThrow(
            'Despesa não encontrada',
        );
    });
});
