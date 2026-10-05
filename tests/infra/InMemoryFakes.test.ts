import { Apontamento } from '../../src/domain/entities/Apontamento';
import { Despesa } from '../../src/domain/entities/Despesa';
import { Estagio } from '../../src/domain/entities/Estagio';
import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { TokenSupervisor } from '../../src/domain/entities/TokenSupervisor';
import { Trabalhador } from '../../src/domain/entities/Trabalhador';
import { CargaHoraria } from '../../src/domain/value-objects/CargaHoraria';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { QuantidadeBalaio } from '../../src/domain/value-objects/QuantidadeBalaio';
import { SyncStatus } from '../../src/domain/value-objects/SyncStatus';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';
import { InMemoryApontamentoRepository } from '../../src/infra/inMemoryApontamentoRepository';
import { InMemoryCameraGateway } from '../../src/infra/InMemoryCameraGateway';
import { InMemoryDespesaRepository } from '../../src/infra/inMemoryDespesaRepository';
import { InMemoryEstagioRepository } from '../../src/infra/InMemoryEstagioRepository';
import { InMemoryNetworkGateway } from '../../src/infra/inMemoryNetworkGateway';
import { InMemorySyncGateway } from '../../src/infra/inMemorySyncGateway';
import { InMemorySyncQueueRepository } from '../../src/infra/inMemorySyncQueueRepository';
import { InMemoryTokenSupervisorRepository } from '../../src/infra/InMemoryTokenSupervisorRepository';
import { InMemoryTrabalhadorRepository } from '../../src/infra/inMemoryTrabalhadorRepository';

const AGORA = Date.now();

describe('Fakes In-Memory (infra) — repositórios e gateways', () => {
  describe('InMemoryApontamentoRepository (Singleton)', () => {
    it('deve devolver sempre a mesma instância', () => {
      expect(InMemoryApontamentoRepository.getInstance()).toBe(
        InMemoryApontamentoRepository.getInstance(),
      );
    });

    it('deve salvar e consultar por id, trabalhador e listar todos', async () => {
      const repo = InMemoryApontamentoRepository.getInstance();
      const ap = new Apontamento(
        'ap-infra-1',
        'trab-001',
        new QuantidadeBalaio(10),
        new Coordinates(-21.2, -44.9),
        AGORA,
      );
      await repo.save(ap);

      expect(await repo.findById('ap-infra-1')).toBe(ap);
      expect(await repo.findById('inexistente')).toBeNull();
      expect((await repo.findByTrabalhadorId('trab-001')).length).toBeGreaterThan(0);
      expect((await repo.findAll()).length).toBeGreaterThan(0);
    });
  });

  describe('InMemoryDespesaRepository (Singleton)', () => {
    it('deve salvar, atualizar, buscar, excluir e limpar', async () => {
      const repo = InMemoryDespesaRepository.getInstance();
      repo.clear();
      const coords = new Coordinates(-21.2, -44.9);
      const d1 = new Despesa('d-1', 'Óleo', new ValorMonetario(140), 'Ferramentas', coords, AGORA);
      const d1Atualizada = new Despesa(
        'd-1',
        'Óleo 2T',
        new ValorMonetario(150),
        'Ferramentas',
        coords,
        AGORA,
      );

      await repo.save(d1);
      await repo.save(d1Atualizada);
      expect((await repo.findAll()).length).toBe(1);
      expect(await repo.findById('d-1')).toBe(d1Atualizada);
      expect(await repo.findById('x')).toBeNull();

      await repo.delete('d-1');
      expect(await repo.findAll()).toHaveLength(0);

      await repo.save(d1);
      repo.clear();
      expect(await repo.findAll()).toHaveLength(0);
      expect(InMemoryDespesaRepository.getInstance()).toBe(repo);
    });
  });

  describe('InMemoryTrabalhadorRepository (Singleton)', () => {
    it('deve semear trabalhadores demo e buscar por crachá (case-insensitive)', async () => {
      const repo = InMemoryTrabalhadorRepository.getInstance();
      const todos = await repo.findAll();
      expect(todos.length).toBeGreaterThanOrEqual(2);
      expect(await repo.findByCracha(' trab-001 ')).not.toBeNull();
      expect(await repo.findByCracha('NAO-EXISTE')).toBeNull();
    });

    it('deve inserir, atualizar e excluir', async () => {
      const repo = InMemoryTrabalhadorRepository.getInstance();
      const novo = new Trabalhador(
        'trab-infra',
        'Carlos Teste',
        '52998224725',
        'TRAB-INFRA',
        new ValorMonetario(70),
      );
      await repo.save(novo);
      expect(await repo.findById('trab-infra')).toBe(novo);

      const editado = new Trabalhador(
        'trab-infra',
        'Carlos Editado',
        '52998224725',
        'TRAB-INFRA',
        new ValorMonetario(80),
      );
      await repo.save(editado);
      expect(await repo.findById('trab-infra')).toBe(editado);

      await repo.delete('trab-infra');
      expect(await repo.findById('trab-infra')).toBeNull();
      await repo.delete('inexistente');
    });
  });

  describe('InMemorySyncQueueRepository (Singleton)', () => {
    it('deve enfileirar, salvar, buscar, listar pendentes e remover', async () => {
      const repo = InMemorySyncQueueRepository.getInstance();
      const item = new SyncQueueItem('q-infra', 'apontamento', 'ap-1', 'INSERT', AGORA, AGORA);
      await repo.enqueue(item);

      expect(await repo.findById('q-infra')).toBe(item);
      expect(await repo.findById('nada')).toBeNull();
      expect((await repo.findPending()).some((i) => i.id === 'q-infra')).toBe(true);

      const sincronizado = new SyncQueueItem(
        'q-infra',
        'apontamento',
        'ap-1',
        'INSERT',
        AGORA,
        AGORA,
        1,
        SyncStatus.synced(),
      );
      await repo.save(sincronizado);
      expect((await repo.findPending()).some((i) => i.id === 'q-infra')).toBe(false);

      const outro = new SyncQueueItem('q-infra-2', 'despesa', 'd-1', 'UPDATE', AGORA, AGORA);
      await repo.save(outro);
      expect((await repo.findAll()).length).toBeGreaterThanOrEqual(2);

      await repo.remove('q-infra');
      await repo.remove('q-infra-2');
      await repo.remove('inexistente');
      expect(await repo.findById('q-infra')).toBeNull();
    });
  });

  describe('InMemorySyncGateway (Singleton)', () => {
    it('deve simular sucesso, falha única e updatedAt do servidor', async () => {
      const gateway = InMemorySyncGateway.getInstance();
      const item = new SyncQueueItem('q-gw', 'apontamento', 'ap-1', 'INSERT', AGORA, AGORA);

      gateway.setServerUpdatedAt(12345);
      expect((await gateway.push(item)).serverUpdatedAt).toBe(12345);

      gateway.setServerUpdatedAt(undefined);
      expect((await gateway.push(item)).serverUpdatedAt).toBeGreaterThan(0);

      gateway.setFailNext(true);
      await expect(gateway.push(item)).rejects.toThrow();
      await expect(gateway.push(item)).resolves.toBeDefined();
    });
  });

  describe('InMemoryNetworkGateway (Singleton)', () => {
    it('deve alternar entre online e offline', async () => {
      const net = InMemoryNetworkGateway.getInstance();
      expect(await net.isConnected()).toBe(true);
      net.setConnected(false);
      expect(await net.isConnected()).toBe(false);
      net.setConnected(true);
    });
  });

  describe('InMemoryCameraGateway', () => {
    it('deve devolver foto simulada padrão e permitir trocar a foto', async () => {
      const camera = new InMemoryCameraGateway();
      const padrao = await camera.capturarFoto();
      expect(padrao.uri).toContain('mock');

      camera.setFotoSimulada({ uri: 'file:///outra.jpg', base64: 'abc', largura: 1, altura: 1 });
      expect((await camera.capturarFoto()).uri).toBe('file:///outra.jpg');
    });
  });

  describe('InMemoryEstagioRepository e InMemoryTokenSupervisorRepository', () => {
    it('Estagio: deve salvar, buscar, filtrar por aluno, listar e limpar', async () => {
      const repo = InMemoryEstagioRepository.getInstance();
      repo.clear();
      const estagio = new Estagio({
        id: 'e-1',
        alunoId: 'aluno-1',
        empresa: 'Tech Corp',
        supervisorNome: 'Carlos',
        supervisorEmail: 'carlos@tech.com',
        cargaHorariaTotal: new CargaHoraria(400, 100, 0),
        dataInicio: new Date('2026-01-10'),
      });
      await repo.save(estagio);

      expect(await repo.findById('e-1')).toBe(estagio);
      expect(await repo.findById('x')).toBeNull();
      expect(await repo.findByAlunoId('aluno-1')).toHaveLength(1);
      expect(await repo.list()).toHaveLength(1);
      repo.clear();
      expect(await repo.list()).toHaveLength(0);
    });

    it('Token: deve salvar, buscar por token e por período, e limpar', async () => {
      const repo = InMemoryTokenSupervisorRepository.getInstance();
      repo.clear();
      const token = new TokenSupervisor({
        token: 'tok-1',
        estagioId: 'e-1',
        periodoId: 'p-1',
        emailSupervisor: 'sup@empresa.com',
        expiraEm: new Date(Date.now() + 3600_000),
      });
      await repo.save(token);

      expect(await repo.findByToken('tok-1')).toBe(token);
      expect(await repo.findByToken('nada')).toBeNull();
      expect(await repo.findByPeriodoId('p-1')).toHaveLength(1);
      expect(await repo.findByPeriodoId('p-x')).toHaveLength(0);
      repo.clear();
      expect(await repo.findByToken('tok-1')).toBeNull();
    });
  });
});
