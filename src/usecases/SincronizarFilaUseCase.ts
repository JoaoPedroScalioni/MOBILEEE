import { PeriodoAvaliacaoRepository } from '../domain/repositories/PeriodoAvaliacaoRepository';
import { StatusSincronizacao } from '../domain/value-objects/StatusSincronizacao';

export interface SincronizarFilaResult {
  totalPendentes: number;
  sincronizados: number;
  falhas: number;
}

export interface RemoteSyncGateway {
  enviarPeriodo(periodoId: string, dados: any): Promise<boolean>;
}

export class SincronizarFilaUseCase {
  constructor(
    private readonly periodoRepo: PeriodoAvaliacaoRepository,
    private readonly remoteSyncGateway?: RemoteSyncGateway
  ) {}

  async execute(): Promise<SincronizarFilaResult> {
    const pendentes = await this.periodoRepo.findPendentesSincronizacao();
    let sincronizados = 0;
    let falhas = 0;

    for (const periodo of pendentes) {
      try {
        if (this.remoteSyncGateway) {
          const sucesso = await this.remoteSyncGateway.enviarPeriodo(periodo.getId(), {
            status: periodo.getStatus(),
            alunoId: periodo.getAlunoId(),
          });
          if (!sucesso) {
            periodo.atualizarStatusSincronizacao(StatusSincronizacao.ERROR);
            await this.periodoRepo.save(periodo);
            falhas++;
            continue;
          }
        }

        periodo.atualizarStatusSincronizacao(StatusSincronizacao.SYNCED);
        periodo.marcarAssinaturasSincronizadas(true);
        await this.periodoRepo.save(periodo);
        sincronizados++;
      } catch (err) {
        periodo.atualizarStatusSincronizacao(StatusSincronizacao.ERROR);
        await this.periodoRepo.save(periodo);
        falhas++;
      }
    }

    return {
      totalPendentes: pendentes.length,
      sincronizados,
      falhas,
    };
  }
}
