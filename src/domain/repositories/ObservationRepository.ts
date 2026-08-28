import { Observation } from "../entities/Observation";

// INTERFACE DO REPOSITÓRIO: Define o contrato para salvar/buscar Observações.
// É apenas uma "assinatura" (não tem a implementação de como salva no banco de dados).
// Se precisar criar um novo método de busca (ex: buscar por data), adicione a assinatura dele aqui primeiro:
// ex: findByDate(date: Date): Promise<Observation[]>;
export interface ObservationRepository {
    save(observation: Observation): Promise<void>;
    findById(id: string): Promise<Observation | null>;
    findAll(): Promise<Observation[]>;
}

//oq vai fazer com a entidade