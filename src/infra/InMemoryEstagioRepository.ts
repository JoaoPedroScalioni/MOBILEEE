import { Estagio } from '../domain/entities/Estagio';
import { EstagioRepository } from '../domain/repositories/EstagioRepository';

export class InMemoryEstagioRepository implements EstagioRepository {
  private static instance: InMemoryEstagioRepository;
  private readonly items: Map<string, Estagio> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryEstagioRepository {
    if (!InMemoryEstagioRepository.instance) {
      InMemoryEstagioRepository.instance = new InMemoryEstagioRepository();
    }
    return InMemoryEstagioRepository.instance;
  }

  public clear(): void {
    this.items.clear();
  }

  async save(estagio: Estagio): Promise<void> {
    this.items.set(estagio.getId(), estagio);
  }

  async findById(id: string): Promise<Estagio | null> {
    return this.items.get(id) ?? null;
  }

  async findByAlunoId(alunoId: string): Promise<Estagio[]> {
    return Array.from(this.items.values()).filter((e) => e.getAlunoId() === alunoId);
  }

  async list(): Promise<Estagio[]> {
    return Array.from(this.items.values());
  }
}

export { InMemoryEstagioRepository as EstagioRepositoryFake };
