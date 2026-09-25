import { CargaHoraria } from '../../src/domain/value-objects/CargaHoraria';
import { Estagio } from '../../src/domain/entities/Estagio';

describe('Estagio Entity', () => {
  it('deve instanciar um estágio válido ativo', () => {
    const estagio = new Estagio({
      id: 'estagio-01',
      alunoId: 'aluno-01',
      empresa: 'Tech Corp',
      supervisorNome: 'Carlos Silva',
      supervisorEmail: 'carlos@techcorp.com',
      cargaHorariaTotal: new CargaHoraria(400, 100, 0),
      dataInicio: new Date('2026-01-10'),
    });

    expect(estagio.getId()).toBe('estagio-01');
    expect(estagio.getEmpresa()).toBe('Tech Corp');
    expect(estagio.isAtivo()).toBe(true);
  });

  it('deve permitir inativar e concluir estágio', () => {
    const estagio = new Estagio({
      id: 'estagio-02',
      alunoId: 'aluno-02',
      empresa: 'Inova Labs',
      supervisorNome: 'Mariana Lima',
      supervisorEmail: 'mariana@inova.com',
      cargaHorariaTotal: new CargaHoraria(300, 60, 0),
      dataInicio: new Date('2026-01-01'),
    });

    estagio.concluir(new Date('2026-06-30'));
    expect(estagio.isAtivo()).toBe(false);
    expect(estagio.getDataFim()).toEqual(new Date('2026-06-30'));
  });

  it('deve lançar erro se data de conclusão for anterior ao início', () => {
    const estagio = new Estagio({
      id: 'estagio-03',
      alunoId: 'aluno-03',
      empresa: 'Soft Inc',
      supervisorNome: 'Roberto',
      supervisorEmail: 'roberto@soft.com',
      cargaHorariaTotal: new CargaHoraria(300, 60, 0),
      dataInicio: new Date('2026-05-01'),
    });

    expect(() => estagio.concluir(new Date('2026-04-01'))).toThrow(
      'A data de conclusão não pode ser anterior ao início do estágio.'
    );
  });
});
