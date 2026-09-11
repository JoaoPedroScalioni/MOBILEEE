export type SyncStatusValue = 'pending' | 'syncing' | 'synced' | 'error';

const VALORES_VALIDOS: readonly SyncStatusValue[] = ['pending', 'syncing', 'synced', 'error'];

export class SyncStatus {
  private constructor(readonly valor: SyncStatusValue) {}

  static pending(): SyncStatus {
    return new SyncStatus('pending');
  }

  static syncing(): SyncStatus {
    return new SyncStatus('syncing');
  }

  static synced(): SyncStatus {
    return new SyncStatus('synced');
  }

  static error(): SyncStatus {
    return new SyncStatus('error');
  }

  static deValor(valor: string): SyncStatus {
    if (!VALORES_VALIDOS.includes(valor as SyncStatusValue)) {
      throw new Error(`Status de sincronização inválido: ${valor}`);
    }
    return new SyncStatus(valor as SyncStatusValue);
  }

  isPendente(): boolean {
    return this.valor === 'pending';
  }

  isSincronizado(): boolean {
    return this.valor === 'synced';
  }

  isErro(): boolean {
    return this.valor === 'error';
  }
}