import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { NetworkGateway } from '../../src/domain/gateways/NetworkGateway';
import { SyncGateway } from '../../src/domain/gateways/SyncGateway';
import { SyncQueueRepository } from '../../src/domain/repositories/SyncQueueRepository';
import { SincronizacaoService } from '../../src/domain/services/SincronizacaoService';
import { SyncPendingQueue } from '../../src/usecases/SyncPendingQueue';

function makeItem(id: string, createdAt = 1000) {
    return new SyncQueueItem(id, 'Apontamento', 'apt-' + id, 'INSERT', createdAt, createdAt, 0);
}

class FakeSyncQueueRepository implements SyncQueueRepository {
    public items = new Map<string, SyncQueueItem>();

    async enqueue(item: SyncQueueItem): Promise<void> {
        this.items.set(item.id, item);
    }

    async save(item: SyncQueueItem): Promise<void> {
        this.items.set(item.id, item);
    }

    async remove(id: string): Promise<void> {
        this.items.delete(id);
    }

    async findById(id: string): Promise<SyncQueueItem | null> {
        return this.items.get(id) ?? null;
    }

    async findPending(): Promise<SyncQueueItem[]> {
        return [...this.items.values()].filter(i => !i.status.isSincronizado());
    }

    async findAll(): Promise<SyncQueueItem[]> {
        return [...this.items.values()];
    }
}

class FakeNetworkGateway implements NetworkGateway {
    public connected = true;

    async isConnected(): Promise<boolean> {
        return this.connected;
    }
}

class FakeSyncGateway implements SyncGateway {
    public fail = false;

    async push(item: SyncQueueItem): Promise<{ serverUpdatedAt?: number }> {
        if (this.fail) {
            throw new Error('Falha simulada');
        }
        return { serverUpdatedAt: item.updatedAt - 1 };
    }
}

describe('SyncPendingQueue Use Case', () => {
    let repo: FakeSyncQueueRepository;
    let network: FakeNetworkGateway;
    let gateway: FakeSyncGateway;
    let sut: SyncPendingQueue;

    beforeEach(() => {
        repo = new FakeSyncQueueRepository();
        network = new FakeNetworkGateway();
        gateway = new FakeSyncGateway();
        sut = new SyncPendingQueue(repo, gateway, network, new SincronizacaoService());
    });

    it('não sincroniza nada e marca como offline quando não há rede', async () => {
        await repo.enqueue(makeItem('i1'));
        network.connected = false;

        const resultado = await sut.execute(2000);

        expect(resultado).toEqual({ synchronized: 0, pending: 1, offline: true });
        expect(await repo.findPending()).toHaveLength(1);
    });

    it('sincroniza todos os itens pendentes e remove da fila', async () => {
        await repo.enqueue(makeItem('i1'));
        await repo.enqueue(makeItem('i2'));

        const resultado = await sut.execute(2000);

        expect(resultado.synchronized).toBe(2);
        expect(resultado.pending).toBe(0);
        expect(resultado.offline).toBe(false);
        expect(await repo.findAll()).toHaveLength(0);
    });

    it('mantém o item na fila com status de erro quando o gateway falha', async () => {
        await repo.enqueue(makeItem('i1'));
        gateway.fail = true;

        const resultado = await sut.execute(2000);

        expect(resultado.synchronized).toBe(0);
        expect(resultado.pending).toBe(1);
        const item = await repo.findById('i1');
        expect(item?.status.isErro()).toBe(true);
        expect(item?.attempts).toBe(1);
    });

    it('mantém o item na fila quando o servidor está mais atualizado (conflito)', async () => {
        await repo.enqueue(makeItem('i1', 1000));
        gateway.push = async () => ({ serverUpdatedAt: 9999 });

        const resultado = await sut.execute(2000);

        expect(resultado.synchronized).toBe(0);
        expect(resultado.pending).toBe(1);
        expect(await repo.findById('i1')).not.toBeNull();
    });
});