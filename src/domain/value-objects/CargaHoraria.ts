export class CargaHoraria {
  private readonly horasTotais: number;
  private readonly horasMinimas: number;
  private readonly horasPeriodo: number;

  constructor(horasTotais: number, horasMinimas: number, horasPeriodo: number) {
    if (typeof horasTotais !== 'number' || isNaN(horasTotais) || horasTotais < 0) {
      throw new Error('A carga horária total deve ser um número maior ou igual a zero.');
    }

    if (typeof horasMinimas !== 'number' || isNaN(horasMinimas) || horasMinimas <= 0) {
      throw new Error('A carga horária mínima deve ser um número estritamente maior que zero.');
    }

    if (typeof horasPeriodo !== 'number' || isNaN(horasPeriodo) || horasPeriodo < 0) {
      throw new Error('A carga horária do período deve ser um número maior ou igual a zero.');
    }

    if (horasTotais > 0 && horasPeriodo > horasTotais) {
      throw new Error('A carga horária do período não pode exceder as horas totais previstas.');
    }

    this.horasTotais = horasTotais;
    this.horasMinimas = horasMinimas;
    this.horasPeriodo = horasPeriodo;
  }

  public getHorasTotais(): number {
    return this.horasTotais;
  }

  public getHorasMinimas(): number {
    return this.horasMinimas;
  }

  public getHorasPeriodo(): number {
    return this.horasPeriodo;
  }

  public atingiuMinimo(): boolean {
    return this.horasPeriodo >= this.horasMinimas;
  }

  public getPercentualConcluido(): number {
    if (this.horasTotais === 0) return 0;
    const pct = (this.horasPeriodo / this.horasTotais) * 100;
    return Math.min(100, Math.round(pct * 10) / 10);
  }

  public equals(other: CargaHoraria): boolean {
    if (!(other instanceof CargaHoraria)) return false;
    return (
      this.horasTotais === other.horasTotais &&
      this.horasMinimas === other.horasMinimas &&
      this.horasPeriodo === other.horasPeriodo
    );
  }
}
