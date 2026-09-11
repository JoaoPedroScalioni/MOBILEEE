import { Trabalhador } from '../../src/domain/entities/Trabalhador';
import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { TrabalhadorRepository } from '../../src/domain/repositories/TrabalhadorRepository';
import { SyncQueueRepository } from '../../src/domain/repositories/SyncQueueRepository';
import { CadastrarTrabalhador } from '../../src/usecases/CadastrarTrabalhador';

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

describe('CadastrarTrabalhador Use Case', () => {
    it('cadastra e enfileira o trabalhador na fila de sincronização', async () => {
        const repo = new FakeTrabalhadorRepository();
        const fila = new FakeSyncQueueRepository();
        const useCase = new CadastrarTrabalhador(repo, fila);

        const trabalhador = await useCase.execute({
            nome: 'João Pereira',
            cpf: '52998224725',
            cracha: 'TRAB-010',
            diaria: 55,
        });

        expect(repo.itens).toHaveLength(1);
        expect(repo.itens[0].id).toBe(trabalhador.id);
        expect(fila.itens).toHaveLength(1);
        expect(fila.itens[0].entity).toBe('Trabalhador');
        expect(fila.itens[0].entityId).toBe(trabalhador.id);
        expect(fila.itens[0].operation).toBe('INSERT');
    });

    it('rejeita CPF inválido sem alterar a fila', async () => {
        const repo = new FakeTrabalhadorRepository();
        const fila = new FakeSyncQueueRepository();
        const useCase = new CadastrarTrabalhador(repo, fila);

        await expect(
            useCase.execute({
                nome: 'Teste',
                cpf: '999',
                cracha: 'TRAB-011',
                diaria: 55,
            }),
        ).rejects.toThrow('CPF inválido');

        expect(repo.itens).toHaveLength(0);
        expect(fila.itens).toHaveLength(0);
    });
});