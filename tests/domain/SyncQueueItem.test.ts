import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { SyncStatus } from '../../src/domain/value-objects/SyncStatus';

interface MakeItemParams {
    id?: string;
    entity?: string;
    entityId?: string;
    operation?: 'INSERT' | 'UPDATE' | 'DELETE';
    createdAt?: number;
    updatedAt?: number;
    attempts?: number;
    status?: SyncStatus;
}

function makeItem(params: MakeItemParams = {}) {
    const createdAt = params.createdAt ?? 1000;
    return new SyncQueueItem(
        params.id ?? 'queue-1',
        params.entity ?? 'Apontamento',
        params.entityId ?? 'obs-1',
        params.operation ?? 'INSERT',
        createdAt,
        params.updatedAt ?? createdAt,
        params.attempts ?? 0,
        params.status ?? SyncStatus.pending(),
    );
}

describe('SyncQueueItem Entity', () => {
    it('cria um item de fila com dados válidos', () => {
        const item = makeItem();
        expect(item.id).toBe('queue-1');
        expect(item.entity).toBe('Apontamento');
        expect(item.entityId).toBe('obs-1');
        expect(item.operation).toBe('INSERT');
        expect(item.attempts).toBe(0);
        expect(item.status.isPendente()).toBe(true);
        expect(item.updatedAt).toBe(1000);
    });

    it('rejeita entidade vazia', () => {
        expect(() => makeItem({ entity: '   ' })).toThrow('Entidade da fila de sincronização inválida');
    });

    it('rejeita id da entidade vazio', () => {
        expect(() => makeItem({ entityId: '' })).toThrow('Id da entidade da fila inválido');
    });

    it('rejeita operação inválida', () => {
        expect(() => makeItem({ operation: 'DROP' as 'INSERT' })).toThrow('Operação de sincronização inválida');
    });

    it('rejeita tentativas negativas', () => {
        expect(() => makeItem({ attempts: -1 })).toThrow('Número de tentativas não pode ser negativo');
    });

    it('rejeita updatedAt anterior a createdAt', () => {
        expect(() => makeItem({ createdAt: 2000, updatedAt: 1000 })).toThrow(
            'updatedAt não pode ser anterior a createdAt',
        );
    });

    it('registrarTentativa incrementa tentativas e entra em syncing', () => {
        const item = makeItem();
        item.registrarTentativa(2000);
        expect(item.attempts).toBe(1);
        expect(item.status.valor).toBe('syncing');
        expect(item.updatedAt).toBe(2000);
    });

    it('marcarErro coloca o item em erro', () => {
        const item = makeItem();
        item.marcarErro(3000);
        expect(item.status.isErro()).toBe(true);
        expect(item.updatedAt).toBe(3000);
    });

    it('marcarSincronizado coloca o item em synced', () => {
        const item = makeItem();
        item.marcarSincronizado(4000);
        expect(item.status.isSincronizado()).toBe(true);
        expect(item.updatedAt).toBe(4000);
    });
});