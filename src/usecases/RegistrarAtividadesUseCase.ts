import { AtividadesDesenvolvidas } from '../domain/entities/AtividadesDesenvolvidas';
import { PeriodoAvaliacao } from '../domain/entities/PeriodoAvaliacao';
import { LocationGateway } from '../domain/gateways/LocationGateway';
import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';
import { CargaHoraria } from '../domain/value-objects/CargaHoraria';
import { Coordenada } from '../domain/value-objects/Coordenada';

export interface RegistrarAtividadesDTO {
  periodoId: string;
  descricao: string;
  horasTotais: number;
  horasMinimas: number;
  horasPeriodo: number;
  capturarLocalizacao?: boolean;
}

export class RegistrarAtividadesUseCase {
  constructor(
    private readonly periodoRepo: PeriodoAvaliacaoRepository,
    private readonly locationGateway?: LocationGateway
  ) {}

  async execute(dto: RegistrarAtividadesDTO): Promise<PeriodoAvaliacao> {
    const periodo = await this.periodoRepo.findById(dto.periodoId);
    if (!periodo) {
      throw new Error('Período de avaliação não encontrado.');
    }

    let coordenada: Coordenada | undefined;
    if (dto.capturarLocalizacao && this.locationGateway) {
      coordenada = await this.locationGateway.obterLocalizacaoAtual();
    }

    const cargaHoraria = new CargaHoraria(dto.horasTotais, dto.horasMinimas, dto.horasPeriodo);
    const atividades = new AtividadesDesenvolvidas({
      id: `ativ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      descricao: dto.descricao,
      cargaHoraria,
      coordenada,
      dataRegistro: new Date(),
    });

    periodo.registrarAtividades(atividades);
    await this.periodoRepo.save(periodo);

    return periodo;
  }
}
