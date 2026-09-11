import { TrabalhadorRepository } from '../domain/repositories/TrabalhadorRepository';

export class ListarTrabalhadores {
    constructor(private readonly repository: TrabalhadorRepository) {}

    public async execute() {
        return await this.repository.findAll();
    }
}