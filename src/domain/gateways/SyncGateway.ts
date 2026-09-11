import { SyncQueueItem } from '../entities/SyncQueueItem';

export interface SyncResultadoGateway {
  serverUpdatedAt?: number;
}

export interface SyncGateway {
  push(item: SyncQueueItem): Promise<SyncResultadoGateway>;
}