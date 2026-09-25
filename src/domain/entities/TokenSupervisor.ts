export interface TokenSupervisorProps {
  token: string;
  estagioId: string;
  periodoId: string;
  emailSupervisor: string;
  criadoEm?: Date;
  expiraEm: Date;
  revogado?: boolean;
}

export class TokenSupervisor {
  private readonly token: string;
  private readonly estagioId: string;
  private readonly periodoId: string;
  private readonly emailSupervisor: string;
  private readonly criadoEm: Date;
  private expiraEm: Date;
  private revogado: boolean;

  constructor(props: TokenSupervisorProps) {
    if (!props.token || props.token.trim().length === 0) {
      throw new Error('O token de acesso do supervisor é obrigatório.');
    }
    if (!props.estagioId || props.estagioId.trim().length === 0) {
      throw new Error('O id do estágio associado ao token é obrigatório.');
    }
    if (!props.periodoId || props.periodoId.trim().length === 0) {
      throw new Error('O id do período de avaliação associado ao token é obrigatório.');
    }
    if (!props.emailSupervisor || !props.emailSupervisor.includes('@')) {
      throw new Error('O e-mail do supervisor associado ao token deve ser válido.');
    }
    if (!props.expiraEm) {
      throw new Error('A data de expiração do token é obrigatória.');
    }

    this.token = props.token.trim();
    this.estagioId = props.estagioId.trim();
    this.periodoId = props.periodoId.trim();
    this.emailSupervisor = props.emailSupervisor.trim().toLowerCase();
    this.criadoEm = props.criadoEm ?? new Date();
    this.expiraEm = props.expiraEm;
    this.revogado = props.revogado ?? false;
  }

  public getToken(): string {
    return this.token;
  }

  public getEstagioId(): string {
    return this.estagioId;
  }

  public getPeriodoId(): string {
    return this.periodoId;
  }

  public getEmailSupervisor(): string {
    return this.emailSupervisor;
  }

  public getCriadoEm(): Date {
    return this.criadoEm;
  }

  public getExpiraEm(): Date {
    return this.expiraEm;
  }

  public isRevogado(): boolean {
    return this.revogado;
  }

  public isValido(dataReferencia: Date = new Date()): boolean {
    if (this.revogado) return false;
    return dataReferencia <= this.expiraEm;
  }

  public revogar(): void {
    this.revogado = true;
  }

  public estenderValidade(horasAdicionais: number): void {
    if (typeof horasAdicionais !== 'number' || horasAdicionais <= 0) {
      throw new Error('A quantidade de horas para extensão deve ser um número positivo.');
    }
    const msAdicionais = horasAdicionais * 60 * 60 * 1000;
    this.expiraEm = new Date(this.expiraEm.getTime() + msAdicionais);
  }
}
