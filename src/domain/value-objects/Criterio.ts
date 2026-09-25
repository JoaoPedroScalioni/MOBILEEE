export type FaixaCriterio = 'MB' | 'B' | 'R' | 'F';

export class Criterio {
  private readonly nome: string;
  private readonly nota: number;

  constructor(nome: string, nota: number) {
    if (!nome || nome.trim().length === 0) {
      throw new Error('O nome do critério não pode ser vazio.');
    }

    if (typeof nota !== 'number' || isNaN(nota)) {
      throw new Error('A nota do critério deve ser um número válido.');
    }

    if (nota < 0 || nota > 10) {
      throw new Error('A nota do critério deve estar entre 0 e 10.');
    }

    this.nome = nome.trim();
    this.nota = Math.round(nota * 10) / 10;
  }

  public getNome(): string {
    return this.nome;
  }

  public getNota(): number {
    return this.nota;
  }

  public getFaixa(): FaixaCriterio {
    if (this.nota >= 8.5) return 'MB';
    if (this.nota >= 7.0) return 'B';
    if (this.nota >= 5.0) return 'R';
    return 'F';
  }

  public equals(other: Criterio): boolean {
    if (!(other instanceof Criterio)) return false;
    return this.nome === other.nome && this.nota === other.nota;
  }
}
