import { Despesa } from '../entities/Despesa';

export interface DespesaRepository {
    save(despesa: Despesa): Promise<void>;
    findById(id: string): Promise<Despesa | null>;
    findAll(): Promise<Despesa[]>;
}