import { Trabalhador } from '../entities/Trabalhador';

export interface TrabalhadorRepository {
    save(trabalhador: Trabalhador): Promise<void>;
    findById(id: string): Promise<Trabalhador | null>;
    findByCracha(cracha: string): Promise<Trabalhador | null>;
    findAll(): Promise<Trabalhador[]>;
}