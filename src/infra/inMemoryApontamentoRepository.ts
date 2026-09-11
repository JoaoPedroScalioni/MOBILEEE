import { Apontamento } from '../domain/entities/Apontamento';
import { ApontamentoRepository } from '../domain/repositories/ApontamentoRepository';

export class InMemoryApontamentoRepository implements ApontamentoRepository {
    private readonly apontamentos: Apontamento[] = [];
    private static instance: InMemoryApontamentoRepository;

    private constructor() {}

    public static getInstance(): InMemoryApontamentoRepository {
        if (!InMemoryApontamentoRepository.instance) {
            InMemoryApontamentoRepository.instance = new InMemoryApontamentoRepository();
        }
        return InMemoryApontamentoRepository.instance;
    }

    async save(apontamento: Apontamento): Promise<void> {
        this.apontamentos.push(apontamento);
    }

    async findById(id: string): Promise<Apontamento | null> {
        return this.apontamentos.find((a) => a.id === id) ?? null;
    }

    async findByTrabalhadorId(trabalhadorId: string): Promise<Apontamento[]> {
        return this.apontamentos.filter((a) => a.trabalhadorId === trabalhadorId);
    }

    async findAll(): Promise<Apontamento[]> {
        return [...this.apontamentos];
    }
}