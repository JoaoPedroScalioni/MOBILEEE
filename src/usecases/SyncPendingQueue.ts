import { NetworkGateway } from '../domain/gateways/NetworkGateway';
import { SyncGateway } from '../domain/gateways/SyncGateway';
import { SyncQueueRepository } from '../domain/repositories/SyncQueueRepository';
import { SincronizacaoService } from '../domain/services/SincronizacaoService';

export interface SyncResultado {
  synchronized: number;
  pending: number;
  offline: boolean;
}

export class SyncPendingQueue {
  constructor(
    private readonly syncQueueRepository: SyncQueueRepository,
    private readonly syncGateway: SyncGateway,
    private readonly networkGateway: NetworkGateway,
    private readonly sincronizacaoService: SincronizacaoService,
  ) {}

  async execute(agora: number = Date.now()): Promise<SyncResultado> {
    const pendentes = await this.syncQueueRepository.findPending();

    if (!(await this.networkGateway.isConnected())) {
      return { synchronized: 0, pending: pendentes.length, offline: true };
    }

    let synchronized = 0;
    for (const item of pendentes) {
      item.registrarTentativa(agora);
      await this.syncQueueRepository.save(item);

      try {
        const resultado = await this.syncGateway.push(item);
        const conflito = this.sincronizacaoService.resolverConflito(
          item.updatedAt,
          resultado.serverUpdatedAt ?? item.updatedAt,
        );
        if (conflito === 'remoto') {
          continue;
        }
        await this.syncQueueRepository.remove(item.id);
        synchronized += 1;
      } catch {
        item.marcarErro(agora);
        await this.syncQueueRepository.save(item);
      }
    }

    const restantes = await this.syncQueueRepository.findPending();
    return { synchronized, pending: restantes.length, offline: false };
  }
}