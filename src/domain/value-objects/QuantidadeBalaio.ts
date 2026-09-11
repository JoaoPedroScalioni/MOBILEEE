export class QuantidadeBalaio {
    constructor(public readonly litros: number) {
        this.validate();
    }

    private validate(): void {
        if (!Number.isFinite(this.litros) || this.litros <= 0) {
            throw new Error('Quantidade de balaio inválida');
        }
    }
}