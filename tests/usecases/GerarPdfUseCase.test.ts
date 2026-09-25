import { Assinatura } from '../../src/domain/value-objects/Assinatura';
import { CargaHoraria } from '../../src/domain/value-objects/CargaHoraria';
import { Criterio } from '../../src/domain/value-objects/Criterio';
import { StatusPeriodo } from '../../src/domain/value-objects/StatusPeriodo';
import { AtividadesDesenvolvidas } from '../../src/domain/entities/AtividadesDesenvolvidas';
import { AutoAvaliacao } from '../../src/domain/entities/AutoAvaliacao';
import { AvaliacaoSupervisor } from '../../src/domain/entities/AvaliacaoSupervisor';
import { Estagio } from '../../src/domain/entities/Estagio';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { InMemoryEstagioRepository } from '../../src/infra/InMemoryEstagioRepository';
import { InMemoryPdfGateway } from '../../src/infra/InMemoryPdfGateway';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { GerarPdfUseCase } from '../../src/usecases/GerarPdfUseCase';

describe('GerarPdfUseCase', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let estagioRepo: InMemoryEstagioRepository;
  let pdfGateway: InMemoryPdfGateway;
  let useCase: GerarPdfUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    estagioRepo = InMemoryEstagioRepository.getInstance();
    estagioRepo.clear();
    pdfGateway = new InMemoryPdfGateway();
    useCase = new GerarPdfUseCase(periodoRepo, pdfGateway, estagioRepo);
  });

  it('deve gerar PDF com sucesso quando todas as invariantes e assinaturas sincronizadas forem atendidas', async () => {
    const estagio = new Estagio({
      id: 'e1',
      alunoId: 'a1',
      empresa: 'Empresa Teste',
      supervisorNome: 'Supervisor Teste',
      supervisorEmail: 'sup@teste.com',
      cargaHorariaTotal: new CargaHoraria(300, 60, 0),
      dataInicio: new Date('2026-01-01'),
    });
    await estagioRepo.save(estagio);

    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
    });

    periodo.registrarAtividades(
      new AtividadesDesenvolvidas({
        id: 'at1',
        descricao: 'Atividades completas',
        cargaHoraria: new CargaHoraria(300, 60, 80),
      })
    );
    periodo.registrarAvaliacaoSupervisor(
      new AvaliacaoSupervisor({
        id: 'av1',
        supervisorId: 'sup-1',
        criterios: [new Criterio('Competência', 9.0)],
        parecer: 'Aprovado',
      })
    );
    periodo.registrarAutoAvaliacao(
      new AutoAvaliacao({
        id: 'aa1',
        alunoId: 'a1',
        criterios: [new Criterio('Dedicação', 9.0)],
        parecer: 'Muito bom',
      })
    );
    periodo.adicionarAssinaturaAluno(new Assinatura('base64aluno', 'a1', 'aluno'));
    periodo.adicionarAssinaturaSupervisor(new Assinatura('base64sup', 'sup-1', 'supervisor'));
    periodo.aprovar();
    periodo.marcarAssinaturasSincronizadas(true);
    await periodoRepo.save(periodo);

    const pdf = await useCase.execute({ periodoId: 'p1' });

    expect(pdf).toBeDefined();
    expect(pdf.nomeArquivo).toContain('relatorio-periodo-1-p1.pdf');
    expect(pdf.base64).toContain('mocked-pdf-content');
  });

  it('deve recusar geração de PDF se assinaturas não estiverem sincronizadas', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p2',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
    });
    await periodoRepo.save(periodo);

    await expect(useCase.execute({ periodoId: 'p2' })).rejects.toThrow();
  });
});
