import { PeriodoAvaliacao } from '../entities/PeriodoAvaliacao';
import { StatusPeriodo } from '../value-objects/StatusPeriodo';

export interface ValidacaoDevolucaoResult {
  podeDevolver: boolean;
  motivosInvalidez: string[];
}

export class RegraDevolucaoService {
  public static validarDevolucao(periodo: PeriodoAvaliacao, motivo: string): ValidacaoDevolucaoResult {
    const motivosInvalidez: string[] = [];

    if (!periodo) {
      return { podeDevolver: false, motivosInvalidez: ['Período de avaliação inexistente.'] };
    }

    if (periodo.getStatus() === StatusPeriodo.APROVADO) {
      motivosInvalidez.push('Não é permitido devolver um período que já foi aprovado definitivamente.');
    }

    if (!motivo || motivo.trim().length < 5) {
      motivosInvalidez.push('A justificativa da devolução deve possuir no mínimo 5 caracteres explicativos.');
    }

    return {
      podeDevolver: motivosInvalidez.length === 0,
      motivosInvalidez,
    };
  }

  public static executarDevolucao(periodo: PeriodoAvaliacao, motivo: string): void {
    const validacao = this.validarDevolucao(periodo, motivo);
    if (!validacao.podeDevolver) {
      throw new Error(`Falha ao devolver período: ${validacao.motivosInvalidez.join(' ')}`);
    }

    periodo.devolver(motivo);
  }
}
