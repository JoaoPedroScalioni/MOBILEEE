import { PeriodoAvaliacao } from '../../src/domain/entities/PeriodoAvaliacao';
import { Coordenada } from '../../src/domain/value-objects/Coordenada';
import { StatusPeriodo } from '../../src/domain/value-objects/StatusPeriodo';
import { InMemoryLocationGateway } from '../../src/infra/InMemoryLocationGateway';
import { InMemoryPeriodoAvaliacaoRepository } from '../../src/infra/InMemoryPeriodoAvaliacaoRepository';
import { RegistrarAtividadesUseCase } from '../../src/usecases/RegistrarAtividadesUseCase';

describe('RegistrarAtividadesUseCase', () => {
  let periodoRepo: InMemoryPeriodoAvaliacaoRepository;
  let locationGateway: InMemoryLocationGateway;
  let useCase: RegistrarAtividadesUseCase;

  beforeEach(() => {
    periodoRepo = InMemoryPeriodoAvaliacaoRepository.getInstance();
    periodoRepo.clear();
    locationGateway = new InMemoryLocationGateway();
    useCase = new RegistrarAtividadesUseCase(periodoRepo, locationGateway);
  });

  it('deve registrar atividades com carga horária e geolocalização capturada', async () => {
    const periodo = new PeriodoAvaliacao({
      id: 'p1',
      estagioId: 'e1',
      alunoId: 'a1',
      numeroPeriodo: 1,
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
    });
    await periodoRepo.save(periodo);

    locationGateway.setLocalizacaoSimulada(new Coordenada(-23.5, -46.6));

    const resultado = await useCase.execute({
      periodoId: 'p1',
      descricao: 'Desenvolvimento do sistema mobile de estágio',
      horasTotais: 300,
      horasMinimas: 60,
      horasPeriodo: 100,
      capturarLocalizacao: true,
    });

    expect(resultado.getAtividades()).not.toBeNull();
    expect(resultado.getAtividades()?.getDescricao()).toBe(
      'Desenvolvimento do sistema mobile de estágio'
    );
    expect(resultado.getAtividades()?.getCargaHoraria().getHorasPeriodo()).toBe(100);
    expect(resultado.getAtividades()?.getCoordenada()?.getLatitude()).toBe(-23.5);
  });

  it('deve lançar erro se período não for encontrado', async () => {
    await expect(
      useCase.execute({
        periodoId: 'inexistente',
        descricao: 'Teste',
        horasTotais: 200,
        horasMinimas: 40,
        horasPeriodo: 50,
      })
    ).rejects.toThrow('Período de avaliação não encontrado.');
  });
});
