import { DespesaRepository } from '../domain/repositories/DespesaRepository';

export class ListarDespesas {
    constructor(private readonly repository: DespesaRepository) {}

    public async execute() {
        return await this.repository.findAll();
    }
}