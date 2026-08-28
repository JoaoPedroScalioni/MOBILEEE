import * as Crypto from "expo-crypto";
import { Observation } from "../domain/entities/Observation";
import { ObservationRepository } from "../domain/repositories/ObservationRepository";
import { Coordinates } from "../domain/value-objects/Coordinates";

// DTO (Data Transfer Object): Define os dados de entrada que esse Caso de Uso precisa.
// Se precisar pedir mais dados para criar a observação (ex: descricao), adicione aqui primeiro.
export interface RegisterObservationDTO {
    latitude: number;
    longitude: number;
    photo: string;
}

// USE CASE: Responsável por criar (registrar) uma observação
export class RegisterObservation {
    constructor(private readonly repository: ObservationRepository) {} //dependencia injetada

    // Função de execução do caso de uso
    public async execute(input: RegisterObservationDTO) {
        // 1. Cria os Objetos de Valor e Entidades
        const coordinates = new Coordinates(input.latitude, input.longitude);
        const observation = new Observation(
            Crypto.randomUUID(), // Gera ID único
            coordinates, 
            input.photo
            // Se adicionou campo na Entidade, passe ele aqui também: , input.descricao
        );
        
        // 2. Salva no banco (repositório)
        await this.repository.save(observation);
        
        // 3. Retorna a observação criada
        return observation;
    }
}