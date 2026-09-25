import { PeriodoAvaliacao } from '../domain/entities/PeriodoAvaliacao';
import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';
import { StatusSincronizacao } from '../domain/value-objects/StatusSincronizacao';

export class InMemoryPeriodoAvaliacaoRepository implements PeriodoAvaliacaoRepository {
  private static instance: InMemoryPeriodoAvaliacaoRepository;
  private readonly items: Map<string, PeriodoAvaliacao> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryPeriodoAvaliacaoRepository {
    if (!InMemoryPeriodoAvaliacaoRepository.instance) {
      InMemoryPeriodoAvaliacaoRepository.instance = new InMemoryPeriodoAvaliacaoRepository();
    }
    return InMemoryPeriodoAvaliacaoRepository.instance;
  }

  public clear(): void {
    this.items.clear();
  }

  async save(periodo: PeriodoAvaliacao): Promise<void> {
    this.items.set(periodo.getId(), periodo);
  }

  async findById(id: string): Promise<PeriodoAvaliacao | null> {
    const item = this.items.get(id);
    return item ?? null;
  }

  async findByEstagioId(estagioId: string): Promise<PeriodoAvaliacao[]> {
    return Array.from(this.items.values()).filter((p) => p.getEstagioId() === estagioId);
  }

  async list(): Promise<PeriodoAvaliacao[]> {
    return Array.from(this.items.values());
  }

  async findPendentesSincronizacao(): Promise<PeriodoAvaliacao[]> {
    return Array.from(this.items.values()).filter(
      (p) =>
        p.getStatusSincronizacao() === StatusSincronizacao.PENDING ||
        !p.isAssinaturasSincronizadas()
    );
  }
}

// Alias para conformidade estrita com "PeriodoAvaliacaoRepositoryFake"
export { InMemoryPeriodoAvaliacaoRepository as PeriodoAvaliacaoRepositoryFake };
