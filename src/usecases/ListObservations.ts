import { ObservationRepository } from "../domain/repositories/ObservationRepository";

// USE CASE (CASO DE USO): Orquestra a ação de listar as observações.
// Ele pede ao repositório para fazer o trabalho pesado.
export class ListObservations {
    // Recebe a interface no construtor (Inversão de Dependência)
    constructor(private readonly repository: ObservationRepository) { }

    // O método execute é onde a ação acontece.
    // Se precisar filtrar os resultados (ex: apenas as observações com foto válida),
    // você poderia alterar o retorno aqui, ou criar um novo método no repositório.
    public async execute() {
        return await this.repository.findAll();
    }
}