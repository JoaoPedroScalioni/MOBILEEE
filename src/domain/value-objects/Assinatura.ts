export type PapelAssinante = 'aluno' | 'supervisor' | 'coordenador';

export class Assinatura {
  private readonly base64: string;
  private readonly timestamp: number;
  private readonly autorId: string;
  private readonly papel: PapelAssinante;

  constructor(
    base64: string,
    autorId: string,
    papel: PapelAssinante,
    timestamp: number = Date.now()
  ) {
    if (!base64 || typeof base64 !== 'string' || base64.trim().length === 0) {
      throw new Error('A assinatura em base64 não pode ser vazia.');
    }
    if (!autorId || typeof autorId !== 'string' || autorId.trim().length === 0) {
      throw new Error('O identificador do autor da assinatura é obrigatório.');
    }
    if (!['aluno', 'supervisor', 'coordenador'].includes(papel)) {
      throw new Error('O papel do assinante deve ser aluno, supervisor ou coordenador.');
    }
    if (typeof timestamp !== 'number' || isNaN(timestamp) || timestamp <= 0) {
      throw new Error('A marca temporal da assinatura deve ser válida.');
    }

    this.base64 = base64.trim();
    this.autorId = autorId.trim();
    this.papel = papel;
    this.timestamp = timestamp;
  }

  public getBase64(): string {
    return this.base64;
  }

  public getAutorId(): string {
    return this.autorId;
  }

  public getPapel(): PapelAssinante {
    return this.papel;
  }

  public getTimestamp(): number {
    return this.timestamp;
  }

  public equals(other: Assinatura): boolean {
    if (!(other instanceof Assinatura)) return false;
    return (
      this.base64 === other.base64 &&
      this.autorId === other.autorId &&
      this.papel === other.papel &&
      this.timestamp === other.timestamp
    );
  }
}
