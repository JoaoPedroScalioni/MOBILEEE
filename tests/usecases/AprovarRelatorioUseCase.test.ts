import { Assinatura } from '../../src/domain/value-objects/Assinatura';
import { CargaHoraria } from '../../src/domain/value-objects/CargaHoraria';
import { Criterio } from '../../src/domain/value-objects/Criterio';
import { StatusPeriodo } from '../../src/domain/value-objects/StatusPeriodo';
import { AtividadesDesenvolvidas } from '../../src/domain/entities/AtividadesDesenvolvidas';
import { AutoAvaliacao } from '../../src/domain/entities/AutoAvaliacao';
import { AvaliacaoSupervisor } from '../../src/domain/entities/AvaliacaoSupervisor';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { AprovarRelatorioUseCase } from '../../src/usecases/AprovarRelatorioUseCase';

describe('AprovarRelatorioUseCase', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let useCase: AprovarRelatorioUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    useCase = new AprovarRelatorioUseCase(periodoRepo);
  });

  it('deve aprovar relatório quando todas as etapas e assinaturas estiverem presentes', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
    });

    periodo.registrarAtividades(
      new AtividadesDesenvolvidas({
        id: 'at-1',
        descricao: 'Atividades aprovadas',
        cargaHoraria: new CargaHoraria(300, 60, 100),
      })
    );
    periodo.registrarAvaliacaoSupervisor(
      new AvaliacaoSupervisor({
        id: 'av-1',
        supervisorId: 'sup-1',
        criterios: [new Criterio('Desempenho', 9.0)],
        parecer: 'Aprovado',
      })
    );
    periodo.registrarAutoAvaliacao(
      new AutoAvaliacao({
        id: 'aa-1',
        alunoId: 'a1',
        criterios: [new Criterio('Dedicação', 9.0)],
        parecer: 'Ótimo',
      })
    );
    periodo.adicionarAssinaturaAluno(new Assinatura('base64aluno', 'a1', 'aluno'));
    periodo.adicionarAssinaturaSupervisor(new Assinatura('base64sup', 'sup-1', 'supervisor'));

    await periodoRepo.save(periodo);

    const resultado = await useCase.execute({ periodoId: 'p1' });
    expect(resultado.getStatus()).toBe(StatusPeriodo.APROVADO);
  });

  it('deve falhar ao tentar aprovar sem assinaturas', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p2',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
    });
    await periodoRepo.save(periodo);

    await expect(useCase.execute({ periodoId: 'p2' })).rejects.toThrow();
  });
});
