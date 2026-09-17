import { Trabalhador } from '../../src/domain/entities/Trabalhador';
import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { TrabalhadorRepository } from '../../src/domain/repositories/TrabalhadorRepository';
import { SyncQueueRepository } from '../../src/domain/repositories/SyncQueueRepository';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';
import { ExcluirTrabalhador } from '../../src/usecases/ExcluirTrabalhador';

class FakeTrabalhadorRepository implements TrabalhadorRepository {
    public itens: Trabalhador[] = [];
    async save(t: Trabalhador) {
        this.itens.push(t);
    }
    async findById(id: string) {
        return this.itens.find((t) => t.id === id) ?? null;
    }
    async findByCracha(codigo: string) {
        return this.itens.find((t) => t.cracha === codigo) ?? null;
    }
    async findAll() {
        return [...this.itens];
    }
    async delete(id: string) {
        this.itens = this.itens.filter((t) => t.id !== id);
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

describe('ExcluirTrabalhador Use Case', () => {
    it('remove o trabalhador do repositório e enfileira DELETE na sincronização', async () => {
        const repo = new FakeTrabalhadorRepository();
        const fila = new FakeSyncQueueRepository();
        repo.itens.push(
            new Trabalhador('t1', 'José', '52998224725', 'TRAB-001', new ValorMonetario(60)),
        );

        const useCase = new ExcluirTrabalhador(repo, fila);
        await useCase.execute({ id: 't1' });

        expect(repo.itens).toHaveLength(0);
        expect(fila.itens).toHaveLength(1);
        expect(fila.itens[0].entity).toBe('Trabalhador');
        expect(fila.itens[0].entityId).toBe('t1');
        expect(fila.itens[0].operation).toBe('DELETE');
    });

    it('rejeita excluir trabalhador que não existe', async () => {
        const repo = new FakeTrabalhadorRepository();
        const useCase = new ExcluirTrabalhador(repo);

        await expect(useCase.execute({ id: 'inexistente' })).rejects.toThrow(
            'Trabalhador não encontrado',
        );
    });
});
