import { AutoAvaliacao } from '../domain/entities/AutoAvaliacao';
import { PeriodoAvaliacao } from '../domain/entities/PeriodoAvaliacao';
import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';
import { Criterio } from '../domain/value-objects/Criterio';
import { CriterioDTO } from './AvaliarDesempenhoUseCase';

export interface RealizarAutoAvaliacaoDTO {
  periodoId: string;
  alunoId: string;
  parecer: string;
  criterios: CriterioDTO[];
}

export class RealizarAutoAvaliacaoUseCase {
  constructor(private readonly periodoRepo: PeriodoAvaliacaoRepository) {}

  async execute(dto: RealizarAutoAvaliacaoDTO): Promise<PeriodoAvaliacao> {
    const periodo = await this.periodoRepo.findById(dto.periodoId);
    if (!periodo) {
      throw new Error('Período de avaliação não encontrado.');
    }

    if (periodo.getAlunoId() !== dto.alunoId) {
      throw new Error('Permissão negada: o aluno informado não é o titular deste período de estágio.');
    }

    const criterios = dto.criterios.map((c) => new Criterio(c.nome, c.nota));
    const autoAvaliacao = new AutoAvaliacao({
      id: `auto-aval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      alunoId: dto.alunoId,
      parecer: dto.parecer,
      criterios,
      dataAvaliacao: new Date(),
    });

    periodo.registrarAutoAvaliacao(autoAvaliacao);
    await this.periodoRepo.save(periodo);

    return periodo;
  }
}
