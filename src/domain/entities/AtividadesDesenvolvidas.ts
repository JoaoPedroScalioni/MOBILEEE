import { CargaHoraria } from '../value-objects/CargaHoraria';
import { Coordenada } from '../value-objects/Coordenada';

export interface AtividadesProps {
  id: string;
  descricao: string;
  cargaHoraria: CargaHoraria;
  coordenada?: Coordenada;
  dataRegistro?: Date;
}

export class AtividadesDesenvolvidas {
  private readonly id: string;
  private readonly descricao: string;
  private readonly cargaHoraria: CargaHoraria;
  private readonly coordenada?: Coordenada;
  private readonly dataRegistro: Date;

  constructor(props: AtividadesProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('O id das atividades é obrigatório.');
    }
    if (!props.descricao || props.descricao.trim().length < 5) {
      throw new Error('A descrição das atividades deve ter no mínimo 5 caracteres.');
    }
    if (!props.cargaHoraria) {
      throw new Error('A carga horária das atividades é obrigatória.');
    }

    this.id = props.id.trim();
    this.descricao = props.descricao.trim();
    this.cargaHoraria = props.cargaHoraria;
    this.coordenada = props.coordenada;
    this.dataRegistro = props.dataRegistro ?? new Date();
  }

  public getId(): string {
    return this.id;
  }

  public getDescricao(): string {
    return this.descricao;
  }

  public getCargaHoraria(): CargaHoraria {
    return this.cargaHoraria;
  }

  public getCoordenada(): Coordenada | undefined {
    return this.coordenada;
  }

  public getDataRegistro(): Date {
    return this.dataRegistro;
  }
}
