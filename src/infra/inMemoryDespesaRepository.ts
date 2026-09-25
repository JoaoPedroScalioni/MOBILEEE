import { Despesa } from '../domain/entities/Despesa';
import { DespesaRepository } from '../domain/repositories/DespesaRepository';

export class InMemoryDespesaRepository implements DespesaRepository {
    private despesas: Despesa[] = [];
    private static instance: InMemoryDespesaRepository;

    private constructor() {}

    public static getInstance(): InMemoryDespesaRepository {
        if (!InMemoryDespesaRepository.instance) {
            InMemoryDespesaRepository.instance = new InMemoryDespesaRepository();
        }
        return InMemoryDespesaRepository.instance;
    }

    async save(despesa: Despesa): Promise<void> {
        const index = this.despesas.findIndex((d) => d.id === despesa.id);
        if (index >= 0) {
            this.despesas[index] = despesa;
        } else {
            this.despesas.push(despesa);
        }
    }

    async findById(id: string): Promise<Despesa | null> {
        return this.despesas.find((d) => d.id === id) ?? null;
    }

    async findAll(): Promise<Despesa[]> {
        return [...this.despesas];
    }

    async delete(id: string): Promise<void> {
        this.despesas = this.despesas.filter((d) => d.id !== id);
    }

    public clear(): void {
        this.despesas = [];
    }
}