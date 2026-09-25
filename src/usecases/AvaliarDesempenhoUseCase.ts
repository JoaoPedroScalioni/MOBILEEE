import { AvaliacaoSupervisor } from '../domain/entities/AvaliacaoSupervisor';
import { PeriodoAvaliacao } from '../domain/entities/PeriodoAvaliacao';
import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';
import { TokenSupervisorRepository } from '../domain/repositories/TokenSupervisorRepository';
import { Criterio } from '../domain/value-objects/Criterio';

export interface CriterioDTO {
  nome: string;
  nota: number;
}

export interface AvaliarDesempenhoDTO {
  periodoId: string;
  supervisorId: string;
  parecer: string;
  criterios: CriterioDTO[];
  tokenAcesso?: string;
}

export class AvaliarDesempenhoUseCase {
  constructor(
    private readonly periodoRepo: PeriodoAvaliacaoRepository,
    private readonly tokenRepo?: TokenSupervisorRepository
  ) {}

  async execute(dto: AvaliarDesempenhoDTO): Promise<PeriodoAvaliacao> {
    if (dto.tokenAcesso && this.tokenRepo) {
      const tokenEntity = await this.tokenRepo.findByToken(dto.tokenAcesso);
      if (!tokenEntity || !tokenEntity.isValido()) {
        throw new Error('Token de acesso do supervisor é inválido, revogado ou está expirado.');
      }
      if (tokenEntity.getPeriodoId() !== dto.periodoId) {
        throw new Error('O token informado não possui autorização para avaliar este período.');
      }
    }

    const periodo = await this.periodoRepo.findById(dto.periodoId);
    if (!periodo) {
      throw new Error('Período de avaliação não encontrado.');
    }

    const criterios = dto.criterios.map((c) => new Criterio(c.nome, c.nota));
    const avaliacao = new AvaliacaoSupervisor({
      id: `aval-sup-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      supervisorId: dto.supervisorId,
      parecer: dto.parecer,
      criterios,
      dataAvaliacao: new Date(),
    });

    periodo.registrarAvaliacaoSupervisor(avaliacao);
    await this.periodoRepo.save(periodo);

    return periodo;
  }
}
