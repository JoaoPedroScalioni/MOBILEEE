import { PeriodoAvaliacao } from '../domain/entities/PeriodoAvaliacao';
import { TokenSupervisor } from '../domain/entities/TokenSupervisor';
import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';
import { TokenSupervisorRepository } from '../domain/repositories/TokenSupervisorRepository';

export interface AcessarViaTokenDTO {
  token: string;
}

export interface AcessoSupervisorResult {
  periodo: PeriodoAvaliacao;
  tokenInfo: TokenSupervisor;
}

export class AcessarViaTokenUseCase {
  constructor(
    private readonly tokenRepo: TokenSupervisorRepository,
    private readonly periodoRepo: PeriodoAvaliacaoRepository
  ) {}

  async execute(dto: AcessarViaTokenDTO): Promise<AcessoSupervisorResult> {
    if (!dto.token || dto.token.trim().length === 0) {
      throw new Error('O token de acesso deve ser fornecido.');
    }

    const tokenEntity = await this.tokenRepo.findByToken(dto.token.trim());
    if (!tokenEntity || !tokenEntity.isValido()) {
      throw new Error('Token de acesso do supervisor inválido, expirado ou revogado.');
    }

    const periodo = await this.periodoRepo.findById(tokenEntity.getPeriodoId());
    if (!periodo) {
      throw new Error('Período de avaliação vinculado ao token não foi encontrado.');
    }

    return {
      periodo,
      tokenInfo: tokenEntity,
    };
  }
}
