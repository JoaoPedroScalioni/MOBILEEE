import { Coordinates } from '../value-objects/Coordinates';
import { QuantidadeBalaio } from '../value-objects/QuantidadeBalaio';

export class Apontamento {
    private readonly _id: string;
    private readonly _trabalhadorId: string;
    private readonly _quantidade: QuantidadeBalaio;
    private readonly _coordenadas: Coordinates;
    private readonly _data: number;

    constructor(
        id: string,
        trabalhadorId: string,
        quantidade: QuantidadeBalaio,
        coordenadas: Coordinates,
        data: number,
    ) {
        this._id = id;
        this._trabalhadorId = trabalhadorId;
        this._quantidade = quantidade;
        this._coordenadas = coordenadas;
        this._data = data;
        this.validate();
    }

    get id(): string {
        return this._id;
    }

    get trabalhadorId(): string {
        return this._trabalhadorId;
    }

    get quantidade(): QuantidadeBalaio {
        return this._quantidade;
    }

    get coordenadas(): Coordinates {
        return this._coordenadas;
    }

    get data(): number {
        return this._data;
    }

    private validate(): void {
        if (!this._id.trim()) {
            throw new Error('Id de apontamento inválido');
        }
        if (!this._trabalhadorId.trim()) {
            throw new Error('Id de trabalhador inválido');
        }
        if (!Number.isFinite(this._data) || this._data <= 0) {
            throw new Error('Data do apontamento inválida');
        }
    }
}