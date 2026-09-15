import { Coordinates } from '../value-objects/Coordinates';
import { QuantidadeBalaio } from '../value-objects/QuantidadeBalaio';

export class Apontamento {
    private _id: string;
    private _trabalhadorId: string;
    private _quantidade: QuantidadeBalaio;
    private _coordenadas: Coordinates;
    private _data: number;

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

    atualizarData(data: number): void {
        this._data = data;
        this.validate();
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