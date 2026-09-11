import { ApontamentoRepository } from '../domain/repositories/ApontamentoRepository';

export class ListarApontamentos {
    constructor(private readonly repository: ApontamentoRepository) {}

    public async execute() {
        return await this.repository.findAll();
    }
}