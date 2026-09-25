import { PeriodoAvaliacao } from '../domain/entities/PeriodoAvaliacao';
import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';

export interface AprovarRelatorioDTO {
  periodoId: string;
}

export class AprovarRelatorioUseCase {
  constructor(private readonly periodoRepo: PeriodoAvaliacaoRepository) {}

  async execute(dto: AprovarRelatorioDTO): Promise<PeriodoAvaliacao> {
    const periodo = await this.periodoRepo.findById(dto.periodoId);
    if (!periodo) {
      throw new Error('Período de avaliação não encontrado.');
    }

    periodo.aprovar();
    await this.periodoRepo.save(periodo);

    return periodo;
  }
}
