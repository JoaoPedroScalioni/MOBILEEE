import { PeriodoAvaliacao } from '../domain/entities/PeriodoAvaliacao';
import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';
import { RegraDevolucaoService } from '../domain/services/RegraDevolucaoService';

export interface DevolverRelatorioDTO {
  periodoId: string;
  motivo: string;
}

export class DevolverRelatorioUseCase {
  constructor(private readonly periodoRepo: PeriodoAvaliacaoRepository) {}

  async execute(dto: DevolverRelatorioDTO): Promise<PeriodoAvaliacao> {
    const periodo = await this.periodoRepo.findById(dto.periodoId);
    if (!periodo) {
      throw new Error('Período de avaliação não encontrado.');
    }

    RegraDevolucaoService.executarDevolucao(periodo, dto.motivo);
    await this.periodoRepo.save(periodo);

    return periodo;
  }
}
