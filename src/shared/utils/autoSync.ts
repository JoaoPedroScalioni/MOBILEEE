import { container } from '@/src/factory/container';

let isSyncing = false;

/**
 * Dispara sincronização em segundo plano da fila local SQLite para o Supabase (PostgreSQL & Storage S3).
 * Não bloqueia a interface e trata exceções graciosamente quando offline.
 */
export async function triggerAutoSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const isConnected = await container.networkGateway.isConnected();
    if (!isConnected) return;
    await container.syncPendingQueueSupabase.execute();
  } catch (error) {
    // Falha silenciosa no background se estiver temporariamente sem sinal
  } finally {
    isSyncing = false;
  }
}

