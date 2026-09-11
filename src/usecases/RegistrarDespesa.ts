import * as Crypto from 'expo-crypto';
import { Despesa, CategoriaDespesa } from '../domain/entities/Despesa';
import { SyncQueueItem } from '../domain/entities/SyncQueueItem';
import { DespesaRepository } from '../domain/repositories/DespesaRepository';
import { SyncQueueRepository } from '../domain/repositories/SyncQueueRepository';
import { Coordinates } from '../domain/value-objects/Coordinates';
import { ValorMonetario } from '../domain/value-objects/ValorMonetario';

export interface RegistrarDespesaDTO {
    descricao: string;
    valor: number;
    categoria: CategoriaDespesa;
    latitude: number;
    longitude: number;
    fotoUri?: string | null;
}

export class RegistrarDespesa {
    constructor(
        private readonly repository: DespesaRepository,
        private readonly syncQueueRepository?: SyncQueueRepository,
    ) {}

    public async execute(input: RegistrarDespesaDTO, agora: number = Date.now()) {
        const coordenadas = new Coordinates(input.latitude, input.longitude);
        const id = Crypto.randomUUID();
        const despesa = new Despesa(
            id,
            input.descricao,
            new ValorMonetario(input.valor),
            input.categoria,
            coordenadas,
            agora,
            input.fotoUri ?? null,
        );

        await this.repository.save(despesa);

        if (this.syncQueueRepository) {
            const item = new SyncQueueItem(
                Crypto.randomUUID(),
                'Despesa',
                id,
                'INSERT',
                agora,
                agora,
            );
            await this.syncQueueRepository.enqueue(item);
        }

        return despesa;
    }
}