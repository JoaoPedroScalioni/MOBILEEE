import * as Crypto from 'expo-crypto';
import { Trabalhador } from '../domain/entities/Trabalhador';
import { TrabalhadorRepository } from '../domain/repositories/TrabalhadorRepository';
import { SyncQueueRepository } from '../domain/repositories/SyncQueueRepository';
import { SyncQueueItem } from '../domain/entities/SyncQueueItem';
import { ValorMonetario } from '../domain/value-objects/ValorMonetario';

export interface EditarTrabalhadorDTO {
    id: string;
    nome: string;
    cracha: string;
    diaria: number;
}

export class EditarTrabalhador {
    constructor(
        private readonly repository: TrabalhadorRepository,
        private readonly syncQueueRepository?: SyncQueueRepository,
    ) {}

    public async execute(input: EditarTrabalhadorDTO, agora: number = Date.now()): Promise<Trabalhador> {
        const trabalhador = await this.repository.findById(input.id);
        if (!trabalhador) {
            throw new Error('Trabalhador não encontrado');
        }

        const crachaFormatado = input.cracha.trim();
        if (crachaFormatado.toLowerCase() !== trabalhador.cracha.toLowerCase()) {
            const existenteComCracha = await this.repository.findByCracha(crachaFormatado);
            if (existenteComCracha && existenteComCracha.id !== input.id) {
                throw new Error('Já existe outro trabalhador com este crachá');
            }
        }

        trabalhador.atualizar(
            input.nome,
            input.cracha,
            new ValorMonetario(input.diaria),
        );

        await this.repository.save(trabalhador);

        if (this.syncQueueRepository) {
            const item = new SyncQueueItem(
                Crypto.randomUUID(),
                'Trabalhador',
                trabalhador.id,
                'UPDATE',
                agora,
                agora,
            );
            await this.syncQueueRepository.enqueue(item);
        }

        return trabalhador;
    }
}
