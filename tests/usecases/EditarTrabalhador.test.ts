import { Trabalhador } from '../../src/domain/entities/Trabalhador';
import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { TrabalhadorRepository } from '../../src/domain/repositories/TrabalhadorRepository';
import { SyncQueueRepository } from '../../src/domain/repositories/SyncQueueRepository';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';
import { EditarTrabalhador } from '../../src/usecases/EditarTrabalhador';

class FakeTrabalhadorRepository implements TrabalhadorRepository {
    public itens: Trabalhador[] = [];
    async save(t: Trabalhador) {
        const index = this.itens.findIndex((item) => item.id === t.id);
        if (index >= 0) {
            this.itens[index] = t;
        } else {
            this.itens.push(t);
        }
    }
    async findById(id: string) {
        return this.itens.find((t) => t.id === id) ?? null;
    }
    async findByCracha(codigo: string) {
        return this.itens.find((t) => t.cracha.toLowerCase() === codigo.trim().toLowerCase()) ?? null;
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

describe('EditarTrabalhador Use Case', () => {
    it('atualiza os dados do trabalhador e registra operação UPDATE na fila de sincronização', async () => {
        const repo = new FakeTrabalhadorRepository();
        const fila = new FakeSyncQueueRepository();
        const trabalhadorOriginal = new Trabalhador(
            'trab-1',
            'José Antigo',
            '52998224725',
            'TRAB-001',
            new ValorMonetario(50),
        );
        repo.itens.push(trabalhadorOriginal);

        const useCase = new EditarTrabalhador(repo, fila);
        const atualizado = await useCase.execute({
            id: 'trab-1',
            nome: 'José Atualizado',
            cracha: 'TRAB-001-NOVO',
            diaria: 70,
        });

        expect(atualizado.nome).toBe('José Atualizado');
        expect(atualizado.cracha).toBe('TRAB-001-NOVO');
        expect(atualizado.diaria.valor).toBe(70);

        expect(repo.itens[0].nome).toBe('José Atualizado');
        expect(fila.itens).toHaveLength(1);
        expect(fila.itens[0].operation).toBe('UPDATE');
        expect(fila.itens[0].entityId).toBe('trab-1');
    });

    it('rejeita editar trabalhador inexistente', async () => {
        const repo = new FakeTrabalhadorRepository();
        const useCase = new EditarTrabalhador(repo);

        await expect(
            useCase.execute({
                id: 'inexistente',
                nome: 'Qualquer',
                cracha: 'TRAB-999',
                diaria: 60,
            }),
        ).rejects.toThrow('Trabalhador não encontrado');
    });

    it('rejeita atualizar para um crachá que já pertence a outro trabalhador', async () => {
        const repo = new FakeTrabalhadorRepository();
        repo.itens.push(
            new Trabalhador('trab-1', 'José', '52998224725', 'TRAB-001', new ValorMonetario(50)),
            new Trabalhador('trab-2', 'Maria', '11144477735', 'TRAB-002', new ValorMonetario(60)),
        );

        const useCase = new EditarTrabalhador(repo);

        await expect(
            useCase.execute({
                id: 'trab-1',
                nome: 'José',
                cracha: 'TRAB-002',
                diaria: 50,
            }),
        ).rejects.toThrow('Já existe outro trabalhador com este crachá');
    });
});
