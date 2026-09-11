import { Despesa } from '../../src/domain/entities/Despesa';
import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { DespesaRepository } from '../../src/domain/repositories/DespesaRepository';
import { SyncQueueRepository } from '../../src/domain/repositories/SyncQueueRepository';
import { RegistrarDespesa } from '../../src/usecases/RegistrarDespesa';

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

describe('RegistrarDespesa Use Case', () => {
    it('registra a despesa com foto de recibo e enfileira', async () => {
        const repo = new FakeDespesaRepository();
        const fila = new FakeSyncQueueRepository();
        const useCase = new RegistrarDespesa(repo, fila);

        const despesa = await useCase.execute(
            {
                descricao: 'Óleo diesel',
                valor: 150,
                categoria: 'Combustível',
                latitude: -21.5,
                longitude: -45.9,
                fotoUri: 'file:///recebo.jpg',
            },
            AGORA,
        );

        expect(repo.itens).toHaveLength(1);
        expect(repo.itens[0].fotoUri).toBe('file:///recebo.jpg');
        expect(fila.itens).toHaveLength(1);
        expect(fila.itens[0].entity).toBe('Despesa');
        expect(fila.itens[0].entityId).toBe(despesa.id);
    });

    it('registra despesa sem foto', async () => {
        const repo = new FakeDespesaRepository();
        const fila = new FakeSyncQueueRepository();
        const useCase = new RegistrarDespesa(repo, fila);

        await useCase.execute(
            { descricao: 'Condução', valor: 25, categoria: 'Transporte', latitude: -21.5, longitude: -45.9 },
            AGORA,
        );

        expect(repo.itens[0].fotoUri).toBeNull();
        expect(fila.itens).toHaveLength(1);
    });

    it('rejeita valor monetário inválido sem enfileirar', async () => {
        const repo = new FakeDespesaRepository();
        const fila = new FakeSyncQueueRepository();
        const useCase = new RegistrarDespesa(repo, fila);

        await expect(
            useCase.execute(
                { descricao: 'Óleo', valor: -5, categoria: 'Combustível', latitude: -21.5, longitude: -45.9 },
                AGORA,
            ),
        ).rejects.toThrow('Valor monetário inválido');

        expect(fila.itens).toHaveLength(0);
    });
});