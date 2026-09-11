import { SincronizacaoService } from '../../src/domain/services/SincronizacaoService';

describe('SincronizacaoService (Domain Service)', () => {
    it('local vence quando updatedAt local é mais recente', () => {
        const service = new SincronizacaoService();
        expect(service.resolverConflito(2000, 1000)).toBe('local');
    });

    it('remoto vence quando updatedAt remoto é mais recente', () => {
        const service = new SincronizacaoService();
        expect(service.resolverConflito(1000, 2000)).toBe('remoto');
    });

    it('empate é resolvido a favor do local (last-write-wins estável)', () => {
        const service = new SincronizacaoService();
        expect(service.resolverConflito(1000, 1000)).toBe('local');
    });
});