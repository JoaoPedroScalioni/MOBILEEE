import { Apontamento } from '../../src/domain/entities/Apontamento';
import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { Trabalhador } from '../../src/domain/entities/Trabalhador';
import { ApontamentoRepository } from '../../src/domain/repositories/ApontamentoRepository';
import { TrabalhadorRepository } from '../../src/domain/repositories/TrabalhadorRepository';
import { SyncQueueRepository } from '../../src/domain/repositories/SyncQueueRepository';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';
import { RegistrarApontamento } from '../../src/usecases/RegistrarApontamento';

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

describe('RegistrarApontamento Use Case', () => {
    it('registra o balaio e enfileira na fila', async () => {
        const apontamentos = new FakeApontamentoRepository();
        const trabalhadores = new FakeTrabalhadorRepository();
        trabalhadores.itens.push(new Trabalhador('t1', 'José', '52998224725', 'TRAB-001', new ValorMonetario(60)));
        const fila = new FakeSyncQueueRepository();
        const useCase = new RegistrarApontamento(apontamentos, trabalhadores, fila);

        const apontamento = await useCase.execute(
            { trabalhadorId: 't1', litros: 45, latitude: -21.5, longitude: -45.9 },
            AGORA,
        );

        expect(apontamentos.itens).toHaveLength(1);
        expect(apontamentos.itens[0].quantidade.litros).toBe(45);
        expect(fila.itens).toHaveLength(1);
        expect(fila.itens[0].entity).toBe('Apontamento');
        expect(fila.itens[0].entityId).toBe(apontamento.id);
    });

    it('rejeita apontamento para trabalhador inexistente', async () => {
        const apontamentos = new FakeApontamentoRepository();
        const trabalhadores = new FakeTrabalhadorRepository();
        const fila = new FakeSyncQueueRepository();
        const useCase = new RegistrarApontamento(apontamentos, trabalhadores, fila);

        await expect(
            useCase.execute({ trabalhadorId: 'nada', litros: 45, latitude: -21.5, longitude: -45.9 }, AGORA),
        ).rejects.toThrow('Trabalhador não encontrado');

        expect(apontamentos.itens).toHaveLength(0);
        expect(fila.itens).toHaveLength(0);
    });

    it('rejeita quantidade de balaio inválida', async () => {
        const apontamentos = new FakeApontamentoRepository();
        const trabalhadores = new FakeTrabalhadorRepository();
        trabalhadores.itens.push(new Trabalhador('t1', 'José', '52998224725', 'TRAB-001', new ValorMonetario(60)));
        const fila = new FakeSyncQueueRepository();
        const useCase = new RegistrarApontamento(apontamentos, trabalhadores, fila);

        await expect(
            useCase.execute({ trabalhadorId: 't1', litros: 0, latitude: -21.5, longitude: -45.9 }, AGORA),
        ).rejects.toThrow('Quantidade de balaio inválida');

        expect(fila.itens).toHaveLength(0);
    });
});