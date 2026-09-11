import { SyncStatus } from '../../src/domain/value-objects/SyncStatus';

describe('SyncStatus Value Object', () => {
    it('cria um status pendente', () => {
        const status = SyncStatus.pending();
        expect(status.valor).toBe('pending');
        expect(status.isPendente()).toBe(true);
        expect(status.isSincronizado()).toBe(false);
    });

    it('cria um status sincronizado', () => {
        const status = SyncStatus.synced();
        expect(status.valor).toBe('synced');
        expect(status.isSincronizado()).toBe(true);
        expect(status.isPendente()).toBe(false);
    });

    it('cria um status de erro e um de sincronizando', () => {
        expect(SyncStatus.error().isErro()).toBe(true);
        expect(SyncStatus.syncing().valor).toBe('syncing');
    });

    it('aceita valores válidos através de deValor', () => {
        expect(SyncStatus.deValor('pending').valor).toBe('pending');
        expect(SyncStatus.deValor('syncing').valor).toBe('syncing');
        expect(SyncStatus.deValor('synced').valor).toBe('synced');
        expect(SyncStatus.deValor('error').valor).toBe('error');
    });

    it('rejeita valor inválido', () => {
        expect(() => SyncStatus.deValor('excluido')).toThrow('Status de sincronização inválido');
    });
});