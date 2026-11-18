import { container } from '@/src/factory/container';
import { sincronizarTodosTrechosPendentes } from '@/src/features/mapas/trechosStorage';

let isSyncing = false;
const SYNC_TIMEOUT_MS = 10000;

/**
 * Dispara sincronização em segundo plano da fila local SQLite e dos trechos de colheita
 * para o Supabase (PostgreSQL & Storage S3).
 * Possui timeout seguro para nunca travar em modo offline e retomar assim que houver sinal.
 */
export async function triggerAutoSync(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const isConnected = await container.networkGateway.isConnected();
    if (!isConnected) return;

    const syncWork = Promise.allSettled([
      container.syncPendingQueueSupabase.execute(),
      sincronizarTodosTrechosPendentes(),
    ]);

    const timeoutPromise = new Promise<void>((resolve) => {
      timeoutId = setTimeout(resolve, SYNC_TIMEOUT_MS);
    });

    await Promise.race([syncWork, timeoutPromise]);
  } catch {
    // Falha silenciosa no background se estiver temporariamente sem sinal
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    isSyncing = false;
  }
}
