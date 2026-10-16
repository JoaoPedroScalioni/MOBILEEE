import { SyncGateway, SyncResultadoGateway } from '../../domain/gateways/SyncGateway';
import { SyncQueueItem } from '../../domain/entities/SyncQueueItem';
import { SupabaseClientManager } from './SupabaseClient';
import { SupabaseStorageGateway } from './SupabaseStorageGateway';
import { DatabaseClient } from '../sqlite/DatabaseClient';

/**
 * Gateway de sincronização online com o Supabase (PostgreSQL e S3 Storage).
 * Lê os itens da fila SQLite outbox e propaga para o banco de dados e bucket remoto.
 * Atende ao marco de 06/nov:
 * 'Bucket, padrão S3 storage e o armazenamento de arquivos no supabase.
 * Armazenamento de dados no SQLite e sincronizando com o Supabase online.'
 */
export class SupabaseSyncGateway implements SyncGateway {
  private static instance: SupabaseSyncGateway;
  private clientManager: SupabaseClientManager;
  private storageGateway: SupabaseStorageGateway;
  private db: DatabaseClient;

  public constructor(
    clientManager: SupabaseClientManager = SupabaseClientManager.getInstance(),
    storageGateway: SupabaseStorageGateway = SupabaseStorageGateway.getInstance(),
    db: DatabaseClient = DatabaseClient.getInstance()
  ) {
    this.clientManager = clientManager;
    this.storageGateway = storageGateway;
    this.db = db;
  }

  public static getInstance(
    clientManager?: SupabaseClientManager,
    storageGateway?: SupabaseStorageGateway
  ): SupabaseSyncGateway {
    if (!SupabaseSyncGateway.instance) {
      SupabaseSyncGateway.instance = new SupabaseSyncGateway(clientManager, storageGateway);
    }
    return SupabaseSyncGateway.instance;
  }

  public static setInstance(instance: SupabaseSyncGateway): void {
    SupabaseSyncGateway.instance = instance;
  }

  private normalizeTableName(entity: string): string {
    const lower = entity.toLowerCase().trim();
    if (lower === 'trabalhador' || lower === 'trabalhadores') return 'trabalhadores';
    if (lower === 'apontamento' || lower === 'apontamentos') return 'apontamentos';
    if (lower === 'despesa' || lower === 'despesas') return 'despesas';
    return lower;
  }

  async push(item: SyncQueueItem): Promise<SyncResultadoGateway> {
    const client = this.clientManager.getClient();
    const tabela = this.normalizeTableName(item.entity);

    // 1. Resolução de Conflitos: Last-Write-Wins (LWW)
    const { data: existing } = await client
      .from(tabela)
      .select('updated_at')
      .eq('id', item.entityId)
      .maybeSingle();

    if (existing && existing.updated_at && existing.updated_at > item.updatedAt) {
      // Conflito LWW: Servidor possui dados mais recentes que a fila local
      return { serverUpdatedAt: existing.updated_at };
    }

    // 2. Operação de Exclusão Lógica
    if (item.operation === 'DELETE') {
      const { error } = await client
        .from(tabela)
        .update({
          deleted_at: Date.now(),
          updated_at: Date.now(),
          sync_status: 'synced',
        })
        .eq('id', item.entityId);

      if (error) {
        throw new Error(`Erro ao propagar exclusão no Supabase (${tabela}): ${error.message}`);
      }
      return { serverUpdatedAt: Date.now() };
    }

    // 3. Obtém o registro local para transmissão
    let record = await this.db.getFirst(`SELECT * FROM ${tabela} WHERE id = ?`, [item.entityId]);
    if (!record) {
      record = { id: item.entityId, updated_at: item.updatedAt };
    }

    // 4. Upload de mídia para o Bucket S3 se houver foto local anexada (Marco de 06/nov)
    if (tabela === 'despesas' && record.foto_uri && typeof record.foto_uri === 'string' && record.foto_uri.startsWith('file://')) {
      try {
        const destPath = `comprovantes/${item.entityId}_${Date.now()}.jpg`;
        const uploadResult = await this.storageGateway.uploadFile(record.foto_uri, destPath);
        record.foto_uri = uploadResult.publicUrl || uploadResult.path;
      } catch (err: any) {
        throw new Error(`Falha no upload do recibo para o Bucket S3: ${err.message}`);
      }
    }

    // 5. Upsert dos dados tabulares no PostgreSQL
    record.sync_status = 'synced';
    const { error: upsertError } = await client
      .from(tabela)
      .upsert(record, { onConflict: 'id' });

    if (upsertError) {
      throw new Error(`Erro na sincronização com Supabase (${tabela}): ${upsertError.message}`);
    }

    return { serverUpdatedAt: Date.now() };
  }
}
