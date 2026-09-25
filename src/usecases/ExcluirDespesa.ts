import * as Crypto from 'expo-crypto';
import { DespesaRepository } from '../domain/repositories/DespesaRepository';
import { SyncQueueRepository } from '../domain/repositories/SyncQueueRepository';
import { SyncQueueItem } from '../domain/entities/SyncQueueItem';

export interface ExcluirDespesaDTO {
    id: string;
}

export class ExcluirDespesa {
    constructor(
        private readonly repository: DespesaRepository,
        private readonly syncQueueRepository?: SyncQueueRepository,
    ) {}

    public async execute(input: ExcluirDespesaDTO, agora: number = Date.now()): Promise<void> {
        const despesa = await this.repository.findById(input.id);
        if (!despesa) {
            throw new Error('Despesa não encontrada');
        }

        await this.repository.delete(input.id);

        if (this.syncQueueRepository) {
            const item = new SyncQueueItem(
                Crypto.randomUUID(),
                'Despesa',
                input.id,
                'DELETE',
                agora,
                agora,
            );
            await this.syncQueueRepository.enqueue(item);
        }
    }
}
