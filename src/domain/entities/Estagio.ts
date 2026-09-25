import { CargaHoraria } from '../value-objects/CargaHoraria';

export interface EstagioProps {
  id: string;
  alunoId: string;
  empresa: string;
  supervisorNome: string;
  supervisorEmail: string;
  cargaHorariaTotal: CargaHoraria;
  ativo?: boolean;
  dataInicio: Date;
  dataFim?: Date;
}

export class Estagio {
  private readonly id: string;
  private readonly alunoId: string;
  private readonly empresa: string;
  private readonly supervisorNome: string;
  private readonly supervisorEmail: string;
  private readonly cargaHorariaTotal: CargaHoraria;
  private ativo: boolean;
  private readonly dataInicio: Date;
  private dataFim?: Date;

  constructor(props: EstagioProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('O id do estágio é obrigatório.');
    }
    if (!props.alunoId || props.alunoId.trim().length === 0) {
      throw new Error('O id do aluno é obrigatório.');
    }
    if (!props.empresa || props.empresa.trim().length === 0) {
      throw new Error('A empresa concedente do estágio é obrigatória.');
    }
    if (!props.supervisorNome || props.supervisorNome.trim().length === 0) {
      throw new Error('O nome do supervisor é obrigatório.');
    }
    if (!props.supervisorEmail || !props.supervisorEmail.includes('@')) {
      throw new Error('O e-mail do supervisor deve ser válido.');
    }
    if (!props.cargaHorariaTotal) {
      throw new Error('A carga horária total do estágio é obrigatória.');
    }
    if (!props.dataInicio) {
      throw new Error('A data de início do estágio é obrigatória.');
    }

    this.id = props.id.trim();
    this.alunoId = props.alunoId.trim();
    this.empresa = props.empresa.trim();
    this.supervisorNome = props.supervisorNome.trim();
    this.supervisorEmail = props.supervisorEmail.trim().toLowerCase();
    this.cargaHorariaTotal = props.cargaHorariaTotal;
    this.ativo = props.ativo ?? true;
    this.dataInicio = props.dataInicio;
    this.dataFim = props.dataFim;
  }

  public getId(): string {
    return this.id;
  }

  public getAlunoId(): string {
    return this.alunoId;
  }

  public getEmpresa(): string {
    return this.empresa;
  }

  public getSupervisorNome(): string {
    return this.supervisorNome;
  }

  public getSupervisorEmail(): string {
    return this.supervisorEmail;
  }

  public getCargaHorariaTotal(): CargaHoraria {
    return this.cargaHorariaTotal;
  }

  public isAtivo(): boolean {
    return this.ativo;
  }

  public getDataInicio(): Date {
    return this.dataInicio;
  }

  public getDataFim(): Date | undefined {
    return this.dataFim;
  }

  public inativar(): void {
    this.ativo = false;
  }

  public concluir(dataFim: Date = new Date()): void {
    if (dataFim < this.dataInicio) {
      throw new Error('A data de conclusão não pode ser anterior ao início do estágio.');
    }
    this.ativo = false;
    this.dataFim = dataFim;
  }
}
