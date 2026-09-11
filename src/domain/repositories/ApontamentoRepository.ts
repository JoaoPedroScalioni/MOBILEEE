import { Apontamento } from '../entities/Apontamento';

export interface ApontamentoRepository {
    save(apontamento: Apontamento): Promise<void>;
    findById(id: string): Promise<Apontamento | null>;
    findByTrabalhadorId(trabalhadorId: string): Promise<Apontamento[]>;
    findAll(): Promise<Apontamento[]>;
}