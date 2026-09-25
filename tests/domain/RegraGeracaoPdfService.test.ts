import { Assinatura } from '../../src/domain/value-objects/Assinatura';
import { CargaHoraria } from '../../src/domain/value-objects/CargaHoraria';
import { Criterio } from '../../src/domain/value-objects/Criterio';
import { AtividadesDesenvolvidas } from '../../src/domain/entities/AtividadesDesenvolvidas';
import { AutoAvaliacao } from '../../src/domain/entities/AutoAvaliacao';
import { AvaliacaoSupervisor } from '../../src/domain/entities/AvaliacaoSupervisor';
import { Estagio } from '../../src/domain/entities/Estagio';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { RegraGeracaoPdfService } from '../../src/domain/services/RegraGeracaoPdfService';

describe('RegraGeracaoPdfService Domain Service', () => {
  function makePeriodoProntoParaPdf(): { periodo: PeriodoAvaliacao; estagio: Estagio } {
    const estagio = new Estagio({
      id: 'estagio-01',
      alunoId: 'aluno-01',
      empresa: 'Empresa Teste',
      supervisorNome: 'Supervisor Teste',
      supervisorEmail: 'sup@teste.com',
      cargaHorariaTotal: new CargaHoraria(300, 60, 0),
      dataInicio: new Date('2026-01-01'),
    });

    const periodo = new PeriodoAvaliacao({
      id: 'periodo-01',
      estagioId: 'estagio-01',
      alunoId: 'aluno-01',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-01-01'),
      dataFim: new Date('2026-06-01'),
    });

    periodo.registrarAtividades(
      new AtividadesDesenvolvidas({
        id: 'at-1',
        descricao: 'Atividades completas',
        cargaHoraria: new CargaHoraria(300, 60, 80),
      })
    );

    periodo.registrarAvaliacaoSupervisor(
      new AvaliacaoSupervisor({
        id: 'as-1',
        supervisorId: 'sup-1',
        criterios: [new Criterio('Competência', 9.0)],
        parecer: 'Excelente',
      })
    );

    periodo.registrarAutoAvaliacao(
      new AutoAvaliacao({
        id: 'aa-1',
        alunoId: 'aluno-01',
        criterios: [new Criterio('Evolução', 9.0)],
        parecer: 'Muito bom',
      })
    );

    periodo.adicionarAssinaturaAluno(new Assinatura('base64aluno', 'aluno-01', 'aluno'));
    periodo.adicionarAssinaturaSupervisor(new Assinatura('base64sup', 'sup-1', 'supervisor'));
    periodo.aprovar();
    periodo.marcarAssinaturasSincronizadas(true);

    return { periodo, estagio };
  }

  it('deve aprovar geração de PDF quando todos os critérios e sincronização estiverem conformes', () => {
    const { periodo, estagio } = makePeriodoProntoParaPdf();
    const resultado = RegraGeracaoPdfService.validar(periodo, estagio);

    expect(resultado.podeGerar).toBe(true);
    expect(resultado.erros).toHaveLength(0);
    expect(() => RegraGeracaoPdfService.assegurarPodeGerar(periodo, estagio)).not.toThrow();
  });

  it('deve reprovar se as assinaturas não estiverem sincronizadas com o servidor', () => {
    const { periodo, estagio } = makePeriodoProntoParaPdf();
    periodo.marcarAssinaturasSincronizadas(false);

    const resultado = RegraGeracaoPdfService.validar(periodo, estagio);
    expect(resultado.podeGerar).toBe(false);
    expect(resultado.erros.some((e) => e.includes('sincronizadas'))).toBe(true);
    expect(() => RegraGeracaoPdfService.assegurarPodeGerar(periodo, estagio)).toThrow();
  });

  it('deve reprovar se estágio vinculado for divergente', () => {
    const { periodo } = makePeriodoProntoParaPdf();
    const outroEstagio = new Estagio({
      id: 'outro-estagio',
      alunoId: 'aluno-01',
      empresa: 'Outra',
      supervisorNome: 'Outro',
      supervisorEmail: 'outro@teste.com',
      cargaHorariaTotal: new CargaHoraria(300, 60, 0),
      dataInicio: new Date('2026-01-01'),
    });

    const resultado = RegraGeracaoPdfService.validar(periodo, outroEstagio);
    expect(resultado.podeGerar).toBe(false);
    expect(resultado.erros.some((e) => e.includes('não corresponde'))).toBe(true);
  });
});
