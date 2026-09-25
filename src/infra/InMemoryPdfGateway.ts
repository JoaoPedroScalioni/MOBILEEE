import { Estagio } from '../domain/entities/Estagio';
import { PeriodoAvaliacao } from '../domain/entities/PeriodoAvaliacao';
import { DocumentoPdfGerado, PdfGateway } from '../domain/gateways/PdfGateway';

export class InMemoryPdfGateway implements PdfGateway {
  async gerarRelatorioAvaliacao(
    periodo: PeriodoAvaliacao,
    estagio?: Estagio
  ): Promise<DocumentoPdfGerado> {
    const nomeArquivo = `relatorio-periodo-${periodo.getNumeroPeriodo()}-${periodo.getId()}.pdf`;
    return {
      uri: `file:///storage/emulated/0/Download/${nomeArquivo}`,
      base64: `JVBERi0xLjQKJcTl8uXrp/Og...mocked-pdf-content-${periodo.getId()}`,
      nomeArquivo,
      geradoEm: new Date(),
    };
  }
}

export { InMemoryPdfGateway as PdfGatewayFake };
