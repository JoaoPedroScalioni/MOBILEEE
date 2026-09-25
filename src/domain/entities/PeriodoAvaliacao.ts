import { Assinatura } from '../value-objects/Assinatura';
import { StatusPeriodo } from '../value-objects/StatusPeriodo';
import { StatusSincronizacao } from '../value-objects/StatusSincronizacao';
import { AtividadesDesenvolvidas } from './AtividadesDesenvolvidas';
import { AutoAvaliacao } from './AutoAvaliacao';
import { AvaliacaoSupervisor } from './AvaliacaoSupervisor';

export interface PeriodoAvaliacaoProps {
  id: string;
  estagioId: string;
  alunoId: string;
  numeroPeriodo: number;
  dataInicio: Date;
  dataFim: Date;
  status?: StatusPeriodo;
  statusSincronizacao?: StatusSincronizacao;
  atividades?: AtividadesDesenvolvidas | null;
  avaliacaoSupervisor?: AvaliacaoSupervisor | null;
  autoAvaliacao?: AutoAvaliacao | null;
  assinaturaAluno?: Assinatura | null;
  assinaturaSupervisor?: Assinatura | null;
  assinaturasSincronizadas?: boolean;
  motivoDevolucao?: string;
}

export class PeriodoAvaliacao {
  private readonly id: string;
  private readonly estagioId: string;
  private readonly alunoId: string;
  private readonly numeroPeriodo: number;
  private readonly dataInicio: Date;
  private readonly dataFim: Date;
  private status: StatusPeriodo;
  private statusSincronizacao: StatusSincronizacao;
  private atividades: AtividadesDesenvolvidas | null;
  private avaliacaoSupervisor: AvaliacaoSupervisor | null;
  private autoAvaliacao: AutoAvaliacao | null;
  private assinaturaAluno: Assinatura | null;
  private assinaturaSupervisor: Assinatura | null;
  private assinaturasSincronizadas: boolean;
  private motivoDevolucao?: string;

  constructor(props: PeriodoAvaliacaoProps) {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('O id do período de avaliação é obrigatório.');
    }
    if (!props.estagioId || props.estagioId.trim().length === 0) {
      throw new Error('O id do estágio é obrigatório.');
    }
    if (!props.alunoId || props.alunoId.trim().length === 0) {
      throw new Error('O id do aluno é obrigatório.');
    }
    if (typeof props.numeroPeriodo !== 'number' || props.numeroPeriodo <= 0) {
      throw new Error('O número do período deve ser um inteiro positivo.');
    }
    if (!props.dataInicio || !props.dataFim || props.dataInicio > props.dataFim) {
      throw new Error('As datas de início e fim do período devem ser válidas e coerentes.');
    }

    this.id = props.id.trim();
    this.estagioId = props.estagioId.trim();
    this.alunoId = props.alunoId.trim();
    this.numeroPeriodo = props.numeroPeriodo;
    this.dataInicio = props.dataInicio;
    this.dataFim = props.dataFim;
    this.status = props.status ?? StatusPeriodo.RASCUNHO;
    this.statusSincronizacao = props.statusSincronizacao ?? StatusSincronizacao.PENDING;
    this.atividades = props.atividades ?? null;
    this.avaliacaoSupervisor = props.avaliacaoSupervisor ?? null;
    this.autoAvaliacao = props.autoAvaliacao ?? null;
    this.assinaturaAluno = props.assinaturaAluno ?? null;
    this.assinaturaSupervisor = props.assinaturaSupervisor ?? null;
    this.assinaturasSincronizadas = props.assinaturasSincronizadas ?? false;
    this.motivoDevolucao = props.motivoDevolucao;
  }

  public getId(): string {
    return this.id;
  }

  public getEstagioId(): string {
    return this.estagioId;
  }

  public getAlunoId(): string {
    return this.alunoId;
  }

  public getNumeroPeriodo(): number {
    return this.numeroPeriodo;
  }

  public getDataInicio(): Date {
    return this.dataInicio;
  }

  public getDataFim(): Date {
    return this.dataFim;
  }

  public getStatus(): StatusPeriodo {
    return this.status;
  }

  public getStatusSincronizacao(): StatusSincronizacao {
    return this.statusSincronizacao;
  }

  public getAtividades(): AtividadesDesenvolvidas | null {
    return this.atividades;
  }

  public getAvaliacaoSupervisor(): AvaliacaoSupervisor | null {
    return this.avaliacaoSupervisor;
  }

  public getAutoAvaliacao(): AutoAvaliacao | null {
    return this.autoAvaliacao;
  }

  public getAssinaturaAluno(): Assinatura | null {
    return this.assinaturaAluno;
  }

  public getAssinaturaSupervisor(): Assinatura | null {
    return this.assinaturaSupervisor;
  }

  public isAssinaturasSincronizadas(): boolean {
    return this.assinaturasSincronizadas;
  }

  public getMotivoDevolucao(): string | undefined {
    return this.motivoDevolucao;
  }

  public registrarAtividades(atividades: AtividadesDesenvolvidas): void {
    if (this.status === StatusPeriodo.APROVADO) {
      throw new Error('Não é permitido alterar ou registrar atividades em um período já aprovado.');
    }
    this.atividades = atividades;
    if (this.status === StatusPeriodo.DEVOLVIDO) {
      this.status = StatusPeriodo.RASCUNHO;
      this.motivoDevolucao = undefined;
    }
  }

  public registrarAvaliacaoSupervisor(avaliacao: AvaliacaoSupervisor): void {
    // Invariante explícita: bloqueia o registro se o período já estiver Aprovado
    if (this.status === StatusPeriodo.APROVADO) {
      throw new Error('Não é permitido registrar ou alterar avaliação de supervisor em um período já aprovado.');
    }
    this.avaliacaoSupervisor = avaliacao;
    this.atualizarStatusAposAvaliacoes();
  }

  public registrarAutoAvaliacao(autoAvaliacao: AutoAvaliacao): void {
    if (this.status === StatusPeriodo.APROVADO) {
      throw new Error('Não é permitido registrar ou alterar autoavaliação em um período já aprovado.');
    }
    this.autoAvaliacao = autoAvaliacao;
    this.atualizarStatusAposAvaliacoes();
  }

  private atualizarStatusAposAvaliacoes(): void {
    if (this.avaliacaoSupervisor && this.autoAvaliacao) {
      this.status = StatusPeriodo.PENDENTE_ASSINATURAS;
    } else {
      this.status = StatusPeriodo.PENDENTE_SUPERVISOR;
    }
  }

  public adicionarAssinaturaAluno(assinatura: Assinatura): void {
    if (assinatura.getPapel() !== 'aluno') {
      throw new Error('Apenas assinaturas com o papel de aluno podem ser adicionadas neste campo.');
    }
    if (this.status === StatusPeriodo.APROVADO) {
      throw new Error('Não é permitido adicionar assinaturas a um período já aprovado.');
    }
    this.assinaturaAluno = assinatura;
  }

  public adicionarAssinaturaSupervisor(assinatura: Assinatura): void {
    if (assinatura.getPapel() !== 'supervisor') {
      throw new Error('Apenas assinaturas com o papel de supervisor podem ser adicionadas neste campo.');
    }
    if (this.status === StatusPeriodo.APROVADO) {
      throw new Error('Não é permitido adicionar assinaturas a um período já aprovado.');
    }
    this.assinaturaSupervisor = assinatura;
  }

  public marcarAssinaturasSincronizadas(sincronizado: boolean): void {
    this.assinaturasSincronizadas = sincronizado;
  }

  public atualizarStatusSincronizacao(novoStatus: StatusSincronizacao): void {
    this.statusSincronizacao = novoStatus;
  }

  public aprovar(): void {
    if (!this.atividades) {
      throw new Error('Não é possível aprovar um período sem atividades registradas.');
    }
    if (!this.avaliacaoSupervisor) {
      throw new Error('Não é possível aprovar um período sem a avaliação do supervisor.');
    }
    if (!this.autoAvaliacao) {
      throw new Error('Não é possível aprovar um período sem a autoavaliação do estagiário.');
    }
    if (!this.assinaturaAluno || !this.assinaturaSupervisor) {
      throw new Error('Não é possível aprovar um período sem as assinaturas de ambas as partes.');
    }

    this.status = StatusPeriodo.APROVADO;
    this.motivoDevolucao = undefined;
  }

  public devolver(motivo: string): void {
    if (this.status === StatusPeriodo.APROVADO) {
      throw new Error('Não é permitido devolver um período que já foi aprovado definitivamente.');
    }
    if (!motivo || motivo.trim().length < 5) {
      throw new Error('O motivo da devolução deve ter no mínimo 5 caracteres.');
    }

    this.status = StatusPeriodo.DEVOLVIDO;
    this.motivoDevolucao = motivo.trim();
  }

  // Invariante explícita: podeGerarPdf() apenas com todas as assinaturas sincronizadas e status aprovado
  public podeGerarPdf(): boolean {
    const statusAprovado = this.status === StatusPeriodo.APROVADO;
    const temTodasAssinaturas = this.assinaturaAluno !== null && this.assinaturaSupervisor !== null;
    const sincronizadas = this.assinaturasSincronizadas === true;

    return statusAprovado && temTodasAssinaturas && sincronizadas;
  }

  public validarPodeGerarPdf(): void {
    if (this.status !== StatusPeriodo.APROVADO) {
      throw new Error('O relatório do período precisa estar Aprovado para gerar o PDF.');
    }
    if (!this.assinaturaAluno || !this.assinaturaSupervisor) {
      throw new Error('O relatório precisa conter as assinaturas do aluno e do supervisor para gerar o PDF.');
    }
    if (!this.assinaturasSincronizadas) {
      throw new Error('Todas as assinaturas digitais devem estar sincronizadas com o servidor para gerar o PDF.');
    }
  }
}
