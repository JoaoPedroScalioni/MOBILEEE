import { PeriodoAvaliacao } from '../entities/PeriodoAvaliacao';

export interface PeriodoAvaliacaoRepository {
  save(periodo: PeriodoAvaliacao): Promise<void>;
  findById(id: string): Promise<PeriodoAvaliacao | null>;
  findByEstagioId(estagioId: string): Promise<PeriodoAvaliacao[]>;
  list(): Promise<PeriodoAvaliacao[]>;
  findPendentesSincronizacao(): Promise<PeriodoAvaliacao[]>;
}
