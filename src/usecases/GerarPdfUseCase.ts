import { DocumentoPdfGerado, PdfGateway } from '../domain/gateways/PdfGateway';
import { EstagioRepository } from '../domain/repositories/EstagioRepository';
import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';
import { RegraGeracaoPdfService } from '../domain/services/RegraGeracaoPdfService';

export interface GerarPdfDTO {
  periodoId: string;
}

export class GerarPdfUseCase {
  constructor(
    private readonly periodoRepo: PeriodoAvaliacaoRepository,
    private readonly pdfGateway: PdfGateway,
    private readonly estagioRepo?: EstagioRepository
  ) {}

  async execute(dto: GerarPdfDTO): Promise<DocumentoPdfGerado> {
    const periodo = await this.periodoRepo.findById(dto.periodoId);
    if (!periodo) {
      throw new Error('Período de avaliação não encontrado.');
    }

    let estagio;
    if (this.estagioRepo) {
      estagio = (await this.estagioRepo.findById(periodo.getEstagioId())) ?? undefined;
    }

    RegraGeracaoPdfService.assegurarPodeGerar(periodo, estagio);

    return await this.pdfGateway.gerarRelatorioAvaliacao(periodo, estagio);
  }
}
