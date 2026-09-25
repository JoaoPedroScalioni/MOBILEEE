import { Estagio } from '../entities/Estagio';
import { PeriodoAvaliacao } from '../entities/PeriodoAvaliacao';

export interface DocumentoPdfGerado {
  uri: string;
  base64: string;
  nomeArquivo: string;
  geradoEm: Date;
}

export interface PdfGateway {
  gerarRelatorioAvaliacao(periodo: PeriodoAvaliacao, estagio?: Estagio): Promise<DocumentoPdfGerado>;
}
