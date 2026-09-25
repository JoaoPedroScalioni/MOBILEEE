export enum StatusSincronizacao {
  PENDING = 'pending',
  SYNCED = 'synced',
  ERROR = 'error',
}

export function isStatusSincronizacaoValido(valor: string): valor is StatusSincronizacao {
  return Object.values(StatusSincronizacao).includes(valor as StatusSincronizacao);
}
