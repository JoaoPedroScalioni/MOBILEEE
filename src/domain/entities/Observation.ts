import { Coordinates } from "../value-objects/Coordinates";

// ENTIDADE: Representa o objeto principal do nosso domínio (neste caso, uma Observação)
// Se precisar adicionar novos campos à Observação (ex: data, descrição):
// 1. Adicione a propriedade aqui na classe
// 2. Modifique o construtor para receber a nova propriedade
// 3. (Opcional) Adicione uma validação para ela no método validate()
export class Observation {
    public readonly id: string; // id único gerado na criação
    public readonly coordinates: Coordinates; // objeto de valor (Value Object) com latitude e longitude
    public photo: string // string da URI da foto (não é readonly pois pode mudar)
    
    // Construtor é chamado quando fazemos 'new Observation(...)'
    constructor(id: string, coordinates: Coordinates, photo: string) {
        this.id = id;
        this.coordinates = coordinates;
        this.photo = photo;
        this.validate(); // Sempre valida os dados ao criar a instância
    }

    // Regras de negócio da Entidade ficam aqui
    // Se o professor pedir para adicionar uma nova validação (ex: a foto não pode ser vazia), é aqui que você altera.
    private validate(): void {
        if (!this.photo || !this.photo.includes('://')) {
            throw new Error('Foto inválida');
        }
    }

    // Método para atualizar a foto
    public updatePhoto(photo: string): void {
        this.photo = photo;
        this.validate(); // Valida novamente após a mudança
    }
}

// oq vai trabalhar com a entidade

// basiado nessa aplicação
// expo router
// src com a estrutura para o cor da aplicação
// dominio com as entities, value objects e repositories

