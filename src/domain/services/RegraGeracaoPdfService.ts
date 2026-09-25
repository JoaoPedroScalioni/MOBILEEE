import { Estagio } from '../entities/Estagio';
import { PeriodoAvaliacao } from '../entities/PeriodoAvaliacao';

export interface ValidacaoGeracaoPdfResult {
  podeGerar: boolean;
  erros: string[];
}

export class RegraGeracaoPdfService {
  public static validar(periodo: PeriodoAvaliacao, estagio?: Estagio): ValidacaoGeracaoPdfResult {
    const erros: string[] = [];

    if (!periodo) {
      return { podeGerar: false, erros: ['Período de avaliação não informado.'] };
    }

    if (!periodo.podeGerarPdf()) {
      if (periodo.getStatus() !== 'aprovado') {
        erros.push('O relatório do período precisa estar aprovado para geração de PDF.');
      }
      if (!periodo.getAssinaturaAluno() || !periodo.getAssinaturaSupervisor()) {
        erros.push('O relatório deve conter as assinaturas do aluno e do supervisor.');
      }
      if (!periodo.isAssinaturasSincronizadas()) {
        erros.push('Todas as assinaturas digitais devem estar sincronizadas com o servidor.');
      }
    }

    if (estagio && estagio.getId() !== periodo.getEstagioId()) {
      erros.push('O estágio fornecido não corresponde ao estágio vinculado ao período de avaliação.');
    }

    return {
      podeGerar: erros.length === 0,
      erros,
    };
  }

  public static assegurarPodeGerar(periodo: PeriodoAvaliacao, estagio?: Estagio): void {
    const resultado = this.validar(periodo, estagio);
    if (!resultado.podeGerar) {
      throw new Error(`Não é possível gerar o PDF: ${resultado.erros.join(' ')}`);
    }
  }
}
