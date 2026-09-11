import * as Crypto from 'expo-crypto';
import { Apontamento } from '../domain/entities/Apontamento';
import { SyncQueueItem } from '../domain/entities/SyncQueueItem';
import { TrabalhadorRepository } from '../domain/repositories/TrabalhadorRepository';
import { ApontamentoRepository } from '../domain/repositories/ApontamentoRepository';
import { SyncQueueRepository } from '../domain/repositories/SyncQueueRepository';
import { Coordinates } from '../domain/value-objects/Coordinates';
import { QuantidadeBalaio } from '../domain/value-objects/QuantidadeBalaio';

export interface RegistrarApontamentoDTO {
    trabalhadorId: string;
    litros: number;
    latitude: number;
    longitude: number;
}

export class RegistrarApontamento {
    constructor(
        private readonly apontamentoRepository: ApontamentoRepository,
        private readonly trabalhadorRepository: TrabalhadorRepository,
        private readonly syncQueueRepository?: SyncQueueRepository,
    ) {}

    public async execute(input: RegistrarApontamentoDTO, agora: number = Date.now()) {
        const trabalhador = await this.trabalhadorRepository.findById(input.trabalhadorId);
        if (!trabalhador) {
            throw new Error('Trabalhador não encontrado');
        }

        const coordenadas = new Coordinates(input.latitude, input.longitude);
        const quantidade = new QuantidadeBalaio(input.litros);
        const id = Crypto.randomUUID();
        const apontamento = new Apontamento(id, input.trabalhadorId, quantidade, coordenadas, agora);

        await this.apontamentoRepository.save(apontamento);

        if (this.syncQueueRepository) {
            const item = new SyncQueueItem(
                Crypto.randomUUID(),
                'Apontamento',
                id,
                'INSERT',
                agora,
                agora,
            );
            await this.syncQueueRepository.enqueue(item);
        }

        return apontamento;
    }
}