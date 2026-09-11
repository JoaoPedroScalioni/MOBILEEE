import * as Crypto from 'expo-crypto';
import { Trabalhador } from '../domain/entities/Trabalhador';
import { TrabalhadorRepository } from '../domain/repositories/TrabalhadorRepository';
import { SyncQueueRepository } from '../domain/repositories/SyncQueueRepository';
import { SyncQueueItem } from '../domain/entities/SyncQueueItem';
import { ValorMonetario } from '../domain/value-objects/ValorMonetario';

export interface CadastrarTrabalhadorDTO {
    nome: string;
    cpf: string;
    cracha: string;
    diaria: number;
}

export class CadastrarTrabalhador {
    constructor(
        private readonly repository: TrabalhadorRepository,
        private readonly syncQueueRepository?: SyncQueueRepository,
    ) {}

    public async execute(input: CadastrarTrabalhadorDTO, agora: number = Date.now()) {
        const id = Crypto.randomUUID();
        const trabalhador = new Trabalhador(
            id,
            input.nome,
            input.cpf,
            input.cracha,
            new ValorMonetario(input.diaria),
        );

        await this.repository.save(trabalhador);

        if (this.syncQueueRepository) {
            const item = new SyncQueueItem(
                Crypto.randomUUID(),
                'Trabalhador',
                id,
                'INSERT',
                agora,
                agora,
            );
            await this.syncQueueRepository.enqueue(item);
        }

        return trabalhador;
    }
}