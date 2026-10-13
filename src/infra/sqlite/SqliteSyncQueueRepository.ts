import { SyncQueueItem, SyncQueueOperation } from '../../domain/entities/SyncQueueItem';
import { SyncQueueRepository } from '../../domain/repositories/SyncQueueRepository';
import { SyncStatus } from '../../domain/value-objects/SyncStatus';
import { DatabaseClient } from './DatabaseClient';

export class SqliteSyncQueueRepository implements SyncQueueRepository {
  private static instance: SqliteSyncQueueRepository;
  private readonly db: DatabaseClient;

  private constructor() {
    this.db = DatabaseClient.getInstance();
  }

  public static getInstance(): SqliteSyncQueueRepository {
    if (!SqliteSyncQueueRepository.instance) {
      SqliteSyncQueueRepository.instance = new SqliteSyncQueueRepository();
    }
    return SqliteSyncQueueRepository.instance;
  }

  async enqueue(item: SyncQueueItem): Promise<void> {
    await this.db.run(
      `INSERT INTO sync_queue (id, entidade, entidade_id, operacao, payload, created_at, updated_at, tentativas, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.entity,
        item.entityId,
        item.operation,
        null,
        item.createdAt,
        item.updatedAt,
        item.attempts,
        item.status.valor,
      ]
    );
  }

  async save(item: SyncQueueItem): Promise<void> {
    const existente = await this.findById(item.id);
    if (existente) {
      await this.db.run(
        `UPDATE sync_queue
         SET tentativas = ?, status = ?, updated_at = ?
         WHERE id = ?`,
        [item.attempts, item.status.valor, item.updatedAt, item.id]
      );
    } else {
      await this.enqueue(item);
    }
  }

  async remove(id: string): Promise<void> {
    await this.db.run('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  async findById(id: string): Promise<SyncQueueItem | null> {
    const row = await this.db.getFirst(
      'SELECT * FROM sync_queue WHERE id = ?',
      [id]
    );
    if (!row) return null;
    return this.mapRow(row);
  }

  async findPending(): Promise<SyncQueueItem[]> {
    const rows = await this.db.getAll(
      "SELECT * FROM sync_queue WHERE status != 'synced' ORDER BY created_at ASC"
    );
    return rows.map((r) => this.mapRow(r));
  }

  async findAll(): Promise<SyncQueueItem[]> {
    const rows = await this.db.getAll(
      'SELECT * FROM sync_queue ORDER BY created_at ASC'
    );
    return rows.map((r) => this.mapRow(r));
  }

  private mapRow(row: any): SyncQueueItem {
    return new SyncQueueItem(
      row.id,
      row.entidade,
      row.entidade_id,
      row.operacao as SyncQueueOperation,
      Number(row.created_at),
      Number(row.updated_at),
      Number(row.tentativas || 0),
      SyncStatus.deValor(row.status)
    );
  }
}
