import { Coordinates } from '../value-objects/Coordinates';
import { ValorMonetario } from '../value-objects/ValorMonetario';

export const CATEGORIAS_DESPESA = [
    'Refeição',
    'Combustível',
    'Insumos',
    'Ferramentas',
    'Transporte',
    'Outros',
] as const;

export type CategoriaDespesa = (typeof CATEGORIAS_DESPESA)[number];

export class Despesa {
    private readonly _id: string;
    private readonly _descricao: string;
    private readonly _valor: ValorMonetario;
    private readonly _categoria: CategoriaDespesa;
    private readonly _fotoUri: string | null;
    private readonly _coordenadas: Coordinates;
    private readonly _data: number;

    constructor(
        id: string,
        descricao: string,
        valor: ValorMonetario,
        categoria: CategoriaDespesa,
        coordenadas: Coordinates,
        data: number,
        fotoUri: string | null = null,
    ) {
        this._id = id;
        this._descricao = descricao;
        this._valor = valor;
        this._categoria = categoria;
        this._coordenadas = coordenadas;
        this._data = data;
        this._fotoUri = fotoUri;
        this.validate();
    }

    get id(): string {
        return this._id;
    }

    get descricao(): string {
        return this._descricao;
    }

    get valor(): ValorMonetario {
        return this._valor;
    }

    get categoria(): CategoriaDespesa {
        return this._categoria;
    }

    get coordenadas(): Coordinates {
        return this._coordenadas;
    }

    get data(): number {
        return this._data;
    }

    get fotoUri(): string | null {
        return this._fotoUri;
    }

    private validate(): void {
        if (!this._id.trim()) {
            throw new Error('Id de despesa inválido');
        }
        if (!this._descricao.trim()) {
            throw new Error('Descrição da despesa inválida');
        }
        if (!(CATEGORIAS_DESPESA as readonly string[]).includes(this._categoria)) {
            throw new Error('Categoria de despesa inválida');
        }
        if (!Number.isFinite(this._data) || this._data <= 0) {
            throw new Error('Data da despesa inválida');
        }
        if (this._fotoUri !== null && !this._fotoUri.includes('://')) {
            throw new Error('Foto da despesa inválida');
        }
    }
}