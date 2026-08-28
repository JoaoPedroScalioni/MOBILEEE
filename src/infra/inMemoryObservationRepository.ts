import { Observation } from "../domain/entities/Observation";
import { ObservationRepository } from "../domain/repositories/ObservationRepository";

// INFRA / REPOSITÓRIO: Implementa a interface criada no domínio.
// Como é InMemory, usa um array (this.observations) ao invés de um banco de dados real.
// Se precisar adicionar a busca nova criada na interface, você a implementa aqui:
// ex: async findByDate(date: Date) { return this.observations.filter(...) }

// Singleton (garante que só teremos 1 instância de banco em memória rodando)
export class InMemoryObservationRepository implements ObservationRepository {
    private observations: Observation[] = []; // O "banco de dados" falso
    private static instance: InMemoryObservationRepository;

    private constructor() { } // Construtor privado para evitar uso de 'new InMemoryObservationRepository()' fora da classe

    public static getInstance(): InMemoryObservationRepository {
        if (!InMemoryObservationRepository.instance) {
            InMemoryObservationRepository.instance = new InMemoryObservationRepository(); //só cria ela dentro dela mesma ou seja só tem ela
        }
        return InMemoryObservationRepository.instance;
    }

    // Função de salvar
    async save(observation: Observation): Promise<void> {
        this.observations.push(observation);
    }
    
    // Função de buscar um por ID
    async findById(id: string): Promise<Observation | null> {
        return this.observations.find(obs => obs.id === id) || null;
    }
    
    // Função de listar todos
    async findAll(): Promise<Observation[]> {
        return [...this.observations]; // Retorna uma cópia do array
    }
}