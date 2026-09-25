import { TokenSupervisor } from '../domain/entities/TokenSupervisor';
import { TokenSupervisorRepository } from '../domain/repositories/TokenSupervisorRepository';

export class InMemoryTokenSupervisorRepository implements TokenSupervisorRepository {
  private static instance: InMemoryTokenSupervisorRepository;
  private readonly items: Map<string, TokenSupervisor> = new Map();

  private constructor() {}

  public static getInstance(): InMemoryTokenSupervisorRepository {
    if (!InMemoryTokenSupervisorRepository.instance) {
      InMemoryTokenSupervisorRepository.instance = new InMemoryTokenSupervisorRepository();
    }
    return InMemoryTokenSupervisorRepository.instance;
  }

  public clear(): void {
    this.items.clear();
  }

  async save(token: TokenSupervisor): Promise<void> {
    this.items.set(token.getToken(), token);
  }

  async findByToken(token: string): Promise<TokenSupervisor | null> {
    return this.items.get(token) ?? null;
  }

  async findByPeriodoId(periodoId: string): Promise<TokenSupervisor[]> {
    return Array.from(this.items.values()).filter((t) => t.getPeriodoId() === periodoId);
  }
}

export { InMemoryTokenSupervisorRepository as TokenSupervisorRepositoryFake };
