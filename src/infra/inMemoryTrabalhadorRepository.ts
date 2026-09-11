import { Trabalhador } from '../domain/entities/Trabalhador';
import { TrabalhadorRepository } from '../domain/repositories/TrabalhadorRepository';
import { ValorMonetario } from '../domain/value-objects/ValorMonetario';

export class InMemoryTrabalhadorRepository implements TrabalhadorRepository {
    private readonly trabalhadores: Trabalhador[] = [];
    private static instance: InMemoryTrabalhadorRepository;

    private constructor() {
        this.semearTrabalhadoresDemo();
    }

    public static getInstance(): InMemoryTrabalhadorRepository {
        if (!InMemoryTrabalhadorRepository.instance) {
            InMemoryTrabalhadorRepository.instance = new InMemoryTrabalhadorRepository();
        }
        return InMemoryTrabalhadorRepository.instance;
    }

    private semearTrabalhadoresDemo(): void {
        this.trabalhadores.push(
            new Trabalhador(
                'trab-001',
                'José da Silva',
                '52998224725',
                'TRAB-001',
                new ValorMonetario(60),
            ),
            new Trabalhador(
                'trab-002',
                'Maria de Souza',
                '11144477735',
                'TRAB-002',
                new ValorMonetario(60),
            ),
        );
    }

    async save(trabalhador: Trabalhador): Promise<void> {
        this.trabalhadores.push(trabalhador);
    }

    async findById(id: string): Promise<Trabalhador | null> {
        return this.trabalhadores.find((t) => t.id === id) ?? null;
    }

    async findByCracha(cracha: string): Promise<Trabalhador | null> {
        return (
            this.trabalhadores.find((t) => t.cracha.toLowerCase() === cracha.trim().toLowerCase()) ??
            null
        );
    }

    async findAll(): Promise<Trabalhador[]> {
        return [...this.trabalhadores];
    }
}