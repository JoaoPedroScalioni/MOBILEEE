export class ValorMonetario {
    constructor(public readonly valor: number) {
        this.validate();
    }

    private validate(): void {
        if (!Number.isFinite(this.valor) || this.valor < 0) {
            throw new Error('Valor monetário inválido');
        }
    }

    public formatar(): string {
        return this.valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    }
}