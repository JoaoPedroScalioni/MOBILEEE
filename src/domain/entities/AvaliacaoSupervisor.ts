import { Criterio, FaixaCriterio } from '../value-objects/Criterio';

export interface AvaliacaoSupervisorProps {
  id: string;
  supervisorId: string;
  criterios: Criterio[];
  parecer: string;
  dataAvaliacao?: Date;
}

export class AvaliacaoSupervisor {
  private readonly id: string;
  private readonly supervisorId: string;
  private readonly criterios: Criterio[];
  private readonly parecer: string;
  private readonly dataAvaliacao: Date;

  constructor(props: AvaliacaoSupervisorProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('O id da avaliação do supervisor é obrigatório.');
    }
    if (!props.supervisorId || props.supervisorId.trim().length === 0) {
      throw new Error('O identificador do supervisor é obrigatório.');
    }
    if (!props.criterios || props.criterios.length === 0) {
      throw new Error('A avaliação deve conter ao menos um critério avaliado.');
    }
    if (!props.parecer || props.parecer.trim().length < 5) {
      throw new Error('O parecer do supervisor deve ter no mínimo 5 caracteres.');
    }

    this.id = props.id.trim();
    this.supervisorId = props.supervisorId.trim();
    this.criterios = [...props.criterios];
    this.parecer = props.parecer.trim();
    this.dataAvaliacao = props.dataAvaliacao ?? new Date();
  }

  public getId(): string {
    return this.id;
  }

  public getSupervisorId(): string {
    return this.supervisorId;
  }

  public getCriterios(): Criterio[] {
    return [...this.criterios];
  }

  public getParecer(): string {
    return this.parecer;
  }

  public getDataAvaliacao(): Date {
    return this.dataAvaliacao;
  }

  public calcularMedia(): number {
    const soma = this.criterios.reduce((acc, c) => acc + c.getNota(), 0);
    const media = soma / this.criterios.length;
    return Math.round(media * 10) / 10;
  }

  public obterFaixaGeral(): FaixaCriterio {
    const media = this.calcularMedia();
    if (media >= 8.5) return 'MB';
    if (media >= 7.0) return 'B';
    if (media >= 5.0) return 'R';
    return 'F';
  }
}
