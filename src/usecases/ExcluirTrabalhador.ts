import * as Crypto from 'expo-crypto';
import { TrabalhadorRepository } from '../domain/repositories/TrabalhadorRepository';
import { SyncQueueRepository } from '../domain/repositories/SyncQueueRepository';
import { SyncQueueItem } from '../domain/entities/SyncQueueItem';

export interface ExcluirTrabalhadorDTO {
    id: string;
}

export class ExcluirTrabalhador {
    constructor(
        private readonly repository: TrabalhadorRepository,
        private readonly syncQueueRepository?: SyncQueueRepository,
    ) {}

    public async execute(input: ExcluirTrabalhadorDTO, agora: number = Date.now()): Promise<void> {
        const trabalhador = await this.repository.findById(input.id);
        if (!trabalhador) {
            throw new Error('Trabalhador não encontrado');
        }

        await this.repository.delete(input.id);

        if (this.syncQueueRepository) {
            const item = new SyncQueueItem(
                Crypto.randomUUID(),
                'Trabalhador',
                input.id,
                'DELETE',
                agora,
                agora,
            );
            await this.syncQueueRepository.enqueue(item);
        }
    }
}
