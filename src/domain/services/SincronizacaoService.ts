export type ConflitoResultado = 'local' | 'remoto';

export class SincronizacaoService {
  resolverConflito(updatedAtLocal: number, updatedAtRemoto: number): ConflitoResultado {
    if (updatedAtRemoto > updatedAtLocal) {
      return 'remoto';
    }
    return 'local';
  }
}