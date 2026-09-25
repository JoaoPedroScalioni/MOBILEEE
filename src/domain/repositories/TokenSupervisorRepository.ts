import { TokenSupervisor } from '../entities/TokenSupervisor';

export interface TokenSupervisorRepository {
  save(token: TokenSupervisor): Promise<void>;
  findByToken(token: string): Promise<TokenSupervisor | null>;
  findByPeriodoId(periodoId: string): Promise<TokenSupervisor[]>;
}
