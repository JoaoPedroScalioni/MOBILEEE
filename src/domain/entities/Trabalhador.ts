import { ValorMonetario } from '../value-objects/ValorMonetario';

const CPF_REGEX = /^\d{11}$/;

export class Trabalhador {
    private readonly _id: string;
    private readonly _nome: string;
    private readonly _cpf: string;
    private readonly _cracha: string;
    private readonly _diaria: ValorMonetario;

    constructor(id: string, nome: string, cpf: string, cracha: string, diaria: ValorMonetario) {
        this._id = id;
        this._nome = nome;
        this._cpf = cpf;
        this._cracha = cracha;
        this._diaria = diaria;
        this.validate();
    }

    get id(): string {
        return this._id;
    }

    get nome(): string {
        return this._nome;
    }

    get cpf(): string {
        return this._cpf;
    }

    get cracha(): string {
        return this._cracha;
    }

    get diaria(): ValorMonetario {
        return this._diaria;
    }

    private validate(): void {
        if (!this._id.trim()) {
            throw new Error('Id de trabalhador inválido');
        }
        if (!this._nome.trim()) {
            throw new Error('Nome de trabalhador inválido');
        }
        if (!CPF_REGEX.test(this._cpf)) {
            throw new Error('CPF inválido');
        }
        if (!this._cracha.trim()) {
            throw new Error('Crachá de trabalhador inválido');
        }
    }
}