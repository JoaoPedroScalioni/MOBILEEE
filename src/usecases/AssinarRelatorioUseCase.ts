import { PeriodoAvaliacao } from '../domain/entities/PeriodoAvaliacao';
import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';
import { Assinatura, PapelAssinante } from '../domain/value-objects/Assinatura';

export interface AssinarRelatorioDTO {
  periodoId: string;
  autorId: string;
  papel: PapelAssinante;
  base64Assinatura: string;
}

export class AssinarRelatorioUseCase {
  constructor(private readonly periodoRepo: PeriodoAvaliacaoRepository) {}

  async execute(dto: AssinarRelatorioDTO): Promise<PeriodoAvaliacao> {
    const periodo = await this.periodoRepo.findById(dto.periodoId);
    if (!periodo) {
      throw new Error('Período de avaliação não encontrado.');
    }

    const assinatura = new Assinatura(dto.base64Assinatura, dto.autorId, dto.papel, Date.now());

    if (dto.papel === 'aluno') {
      if (periodo.getAlunoId() !== dto.autorId) {
        throw new Error('Permissão negada: apenas o próprio estagiário pode assinar como aluno.');
      }
      periodo.adicionarAssinaturaAluno(assinatura);
    } else if (dto.papel === 'supervisor') {
      periodo.adicionarAssinaturaSupervisor(assinatura);
    } else {
      throw new Error('Papel de assinatura não suportado para este relatório.');
    }

    await this.periodoRepo.save(periodo);
    return periodo;
  }
}
