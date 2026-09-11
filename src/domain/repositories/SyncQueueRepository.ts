import { SyncQueueItem } from '../entities/SyncQueueItem';

export interface SyncQueueRepository {
  enqueue(item: SyncQueueItem): Promise<void>;
  save(item: SyncQueueItem): Promise<void>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<SyncQueueItem | null>;
  findPending(): Promise<SyncQueueItem[]>;
  findAll(): Promise<SyncQueueItem[]>;
}