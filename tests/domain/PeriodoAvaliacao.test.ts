import { Assinatura } from '../../src/domain/value-objects/Assinatura';
import { CargaHoraria } from '../../src/domain/value-objects/CargaHoraria';
import { Criterio } from '../../src/domain/value-objects/Criterio';
import { StatusPeriodo } from '../../src/domain/value-objects/StatusPeriodo';
import { StatusSincronizacao } from '../../src/domain/value-objects/StatusSincronizacao';
import { AtividadesDesenvolvidas } from '../../src/domain/entities/AtividadesDesenvolvidas';
import { AutoAvaliacao } from '../../src/domain/entities/AutoAvaliacao';
import { AvaliacaoSupervisor } from '../../src/domain/entities/AvaliacaoSupervisor';
import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';

export function makePeriodoAvaliacao(
  status: StatusPeriodo = StatusPeriodo.RASCUNHO
): PeriodoAvaliacao {
  return new PeriodoAvaliacao({
    id: 'periodo-01',
    estagioId: 'estagio-01',
    alunoId: 'aluno-01',
    numeroPeriodo: 1,
    dataInicio: new Date('2026-02-01'),
    dataFim: new Date('2026-06-30'),
    status,
    statusSincronizacao: StatusSincronizacao.PENDING,
  });
}

describe('PeriodoAvaliacao Aggregate Root', () => {
  it('deve instanciar um período de avaliação em rascunho com valores válidos', () => {
    const periodo = makePeriodoAvaliacao();

    expect(periodo.getId()).toBe('periodo-01');
    expect(periodo.getEstagioId()).toBe('estagio-01');
    expect(periodo.getAlunoId()).toBe('aluno-01');
    expect(periodo.getStatus()).toBe(StatusPeriodo.RASCUNHO);
    expect(periodo.isAssinaturasSincronizadas()).toBe(false);
  });

  it('deve registrar atividades desenvolvidas com sucesso', () => {
    const periodo = makePeriodoAvaliacao();
    const atividades = new AtividadesDesenvolvidas({
      id: 'ativ-01',
      descricao: 'Desenvolvimento do módulo de relatórios mobile',
      cargaHoraria: new CargaHoraria(200, 40, 80),
    });

    periodo.registrarAtividades(atividades);
    expect(periodo.getAtividades()).toBe(atividades);
  });

  it('deve registrar avaliação do supervisor e atualizar status', () => {
    const periodo = makePeriodoAvaliacao();
    const avaliacao = new AvaliacaoSupervisor({
      id: 'aval-01',
      supervisorId: 'sup-01',
      criterios: [new Criterio('Desempenho Técnico', 9.0)],
      parecer: 'Excelente evolução técnica e comprometimento.',
    });

    periodo.registrarAvaliacaoSupervisor(avaliacao);
    expect(periodo.getAvaliacaoSupervisor()).toBe(avaliacao);
    expect(periodo.getStatus()).toBe(StatusPeriodo.PENDENTE_SUPERVISOR);
  });

  it('deve bloquear registro de uma 2ª avaliação se o período já estiver Aprovado', () => {
    const periodo = makePeriodoAvaliacao(StatusPeriodo.APROVADO);
    const avaliacao = new AvaliacaoSupervisor({
      id: 'aval-02',
      supervisorId: 'sup-01',
      criterios: [new Criterio('Desempenho Técnico', 10.0)],
      parecer: 'Tentativa de nova avaliação após aprovado.',
    });

    expect(() => periodo.registrarAvaliacaoSupervisor(avaliacao)).toThrow(
      'Não é permitido registrar ou alterar avaliação de supervisor em um período já aprovado.'
    );
  });

  it('deve bloquear alteração de atividades se o período já estiver Aprovado', () => {
    const periodo = makePeriodoAvaliacao(StatusPeriodo.APROVADO);
    const atividades = new AtividadesDesenvolvidas({
      id: 'ativ-02',
      descricao: 'Tentativa de alteração de atividade em período aprovado',
      cargaHoraria: new CargaHoraria(200, 40, 90),
    });

    expect(() => periodo.registrarAtividades(atividades)).toThrow(
      'Não é permitido alterar ou registrar atividades em um período já aprovado.'
    );
  });

  it('deve permitir devolução com motivo e bloquear devolução se já aprovado', () => {
    const periodo = makePeriodoAvaliacao();
    periodo.devolver('Faltou detalhar as tarefas do mês de abril.');

    expect(periodo.getStatus()).toBe(StatusPeriodo.DEVOLVIDO);
    expect(periodo.getMotivoDevolucao()).toBe('Faltou detalhar as tarefas do mês de abril.');

    // Período aprovado não pode ser devolvido
    const periodoAprovado = makePeriodoAvaliacao(StatusPeriodo.APROVADO);
    expect(() => periodoAprovado.devolver('Motivo qualquer')).toThrow(
      'Não é permitido devolver um período que já foi aprovado definitivamente.'
    );
  });

  it('deve validar se podeGerarPdf() APENAS com todas as assinaturas sincronizadas e status aprovado', () => {
    const periodo = makePeriodoAvaliacao();

    // Cenário 1: em rascunho sem nada -> false
    expect(periodo.podeGerarPdf()).toBe(false);

    // Adiciona atividades, avaliações e assinaturas
    periodo.registrarAtividades(
      new AtividadesDesenvolvidas({
        id: 'a1',
        descricao: 'Atividades completas de desenvolvimento',
        cargaHoraria: new CargaHoraria(300, 50, 100),
      })
    );
    periodo.registrarAvaliacaoSupervisor(
      new AvaliacaoSupervisor({
        id: 'as1',
        supervisorId: 'sup-1',
        criterios: [new Criterio('Trabalho em Equipe', 9.0)],
        parecer: 'Ótimo trabalho',
      })
    );
    periodo.registrarAutoAvaliacao(
      new AutoAvaliacao({
        id: 'aa1',
        alunoId: 'aluno-01',
        criterios: [new Criterio('Dedicação', 9.5)],
        parecer: 'Aprendi muito neste período',
      })
    );

    const assAluno = new Assinatura('base64aluno==', 'aluno-01', 'aluno');
    const assSupervisor = new Assinatura('base64sup==', 'sup-01', 'supervisor');

    periodo.adicionarAssinaturaAluno(assAluno);
    periodo.adicionarAssinaturaSupervisor(assSupervisor);

    // Aprova o período
    periodo.aprovar();
    expect(periodo.getStatus()).toBe(StatusPeriodo.APROVADO);

    // Cenário 2: Período aprovado com ambas assinaturas, MAS assinaturas NÃO sincronizadas ainda -> false
    expect(periodo.isAssinaturasSincronizadas()).toBe(false);
    expect(periodo.podeGerarPdf()).toBe(false);
    expect(() => periodo.validarPodeGerarPdf()).toThrow(
      'Todas as assinaturas digitais devem estar sincronizadas com o servidor para gerar o PDF.'
    );

    // Cenário 3: Assinaturas sincronizadas -> true!
    periodo.marcarAssinaturasSincronizadas(true);
    expect(periodo.podeGerarPdf()).toBe(true);
    expect(() => periodo.validarPodeGerarPdf()).not.toThrow();
  });
});
