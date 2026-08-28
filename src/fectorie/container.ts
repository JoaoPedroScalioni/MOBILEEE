import { InMemoryObservationRepository } from "../infra/inMemoryObservationRepository";
import { ListObservations } from "../usecases/ListObservations";
import { RegisterObservation } from "../usecases/RegisterObservation";

// INJEÇÃO DE DEPENDÊNCIA (Container)
// Centraliza a criação das classes. Em vez de darmos 'new UseCase()' em cada tela do app, pegamos do container.
class Container {
    private static instance: Container;
    
    // Declara quais objetos ficarão disponíveis globalmente
    public readonly InMemoryObservationRepository: InMemoryObservationRepository;
    public readonly registerObservation: RegisterObservation;
    public readonly listObservations: ListObservations;
    // Se o professor mandar criar um novo caso de uso, ex: UpdateObservation:
    // 1. Adicione a declaração aqui: public readonly updateObservation: UpdateObservation;


    private constructor() {
        // Inicializa o repositório
        this.InMemoryObservationRepository = InMemoryObservationRepository.getInstance()
        
        // Inicializa os casos de uso injetando o repositório
        this.registerObservation = new RegisterObservation(this.InMemoryObservationRepository);
        this.listObservations = new ListObservations(this.InMemoryObservationRepository);
        // 2. Inicialize o novo caso de uso: this.updateObservation = new UpdateObservation(this.InMemoryObservationRepository);
    }

    public static getInstance(): Container {
        if (!this.instance) {
            this.instance = new Container();
        }
        return this.instance;
    }

}
export const container = Container.getInstance();

//tmb é um singleton (unica instancia)
// oq faz: é como uma fabrica de dependencias, ele cria as dependencias e injeta nas classes
// é um padrão de projeto que facilita o teste e a manutenção do código
// facilita se for trocar o banco de dados por exemplo, so trocar aqui no container
// faz com que as classes fiquem menos acopladas