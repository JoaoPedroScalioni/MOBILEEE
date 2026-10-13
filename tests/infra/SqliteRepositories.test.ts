import { Trabalhador } from '../../src/domain/entities/Trabalhador';
import { Apontamento } from '../../src/domain/entities/Apontamento';
import { Despesa } from '../../src/domain/entities/Despesa';
import { SyncQueueItem } from '../../src/domain/entities/SyncQueueItem';
import { ValorMonetario } from '../../src/domain/value-objects/ValorMonetario';
import { QuantidadeBalaio } from '../../src/domain/value-objects/QuantidadeBalaio';
import { Coordinates } from '../../src/domain/value-objects/Coordinates';
import { SyncStatus } from '../../src/domain/value-objects/SyncStatus';

import { DatabaseClient } from '../../src/infra/sqlite/DatabaseClient';
import { SqliteTrabalhadorRepository } from '../../src/infra/sqlite/SqliteTrabalhadorRepository';
import { SqliteApontamentoRepository } from '../../src/infra/sqlite/SqliteApontamentoRepository';
import { SqliteDespesaRepository } from '../../src/infra/sqlite/SqliteDespesaRepository';
import { SqliteSyncQueueRepository } from '../../src/infra/sqlite/SqliteSyncQueueRepository';
import { LocalReceiptStorage } from '../../src/infra/filesystem/LocalReceiptStorage';

const AGORA = Date.now();

describe('Camada de Persistência SQLite Offline-First (29/set a 13/out)', () => {
  let db: DatabaseClient;

  beforeAll(async () => {
    db = DatabaseClient.getInstance();
    await db.init();
  });

  beforeEach(async () => {
    await db.clearAll();
  });

  describe('DatabaseClient (29/set e 06/out — Banco local e Entidade Relacionamento)', () => {
    it('deve ser singleton', () => {
      expect(DatabaseClient.getInstance()).toBe(DatabaseClient.getInstance());
    });

    it('deve inicializar e responder a consultas SQL', async () => {
      const res = await db.getAll('SELECT 1 as num');
      expect(res).toBeDefined();
    });
  });

  describe('SqliteTrabalhadorRepository (02/out — CRUD de Trabalhadores no SQLite)', () => {
    it('deve salvar, buscar por id, buscar por crachá e listar trabalhadores', async () => {
      const repo = SqliteTrabalhadorRepository.getInstance();
      const trab = new Trabalhador(
        'trab-sql-1',
        'Sebastião Ribeiro',
        '12345678901',
        'CRACHA-100',
        new ValorMonetario(85.5)
      );

      await repo.save(trab);

      const porId = await repo.findById('trab-sql-1');
      expect(porId).not.toBeNull();
      expect(porId?.nome).toBe('Sebastião Ribeiro');
      expect(porId?.diaria.valor).toBe(85.5);

      const porCracha = await repo.findByCracha('CRACHA-100');
      expect(porCracha).not.toBeNull();
      expect(porCracha?.id).toBe('trab-sql-1');

      const todos = await repo.findAll();
      expect(todos.length).toBeGreaterThanOrEqual(1);

      // Exclusão lógica (soft delete)
      await repo.delete('trab-sql-1');
      const aposExcluir = await repo.findById('trab-sql-1');
      expect(aposExcluir).toBeNull();
    });
  });

  describe('SqliteApontamentoRepository (13/out — Geolocalização integrada com SQLite e Cache Local)', () => {
    it('deve registrar colheita com coordenadas satelitais e consultar do cache local', async () => {
      const repo = SqliteApontamentoRepository.getInstance();
      const coords = new Coordinates(-21.2488, -44.9982);
      const apontamento = new Apontamento(
        'ap-sql-1',
        'trab-sql-1',
        new QuantidadeBalaio(60),
        coords,
        AGORA
      );

      await repo.save(apontamento);

      const buscado = await repo.findById('ap-sql-1');
      expect(buscado).not.toBeNull();
      expect(buscado?.quantidade.litros).toBe(60);
      expect(buscado?.coordenadas.latitude).toBeCloseTo(-21.2488);
      expect(buscado?.coordenadas.longitude).toBeCloseTo(-44.9982);

      const porTrabalhador = await repo.findByTrabalhadorId('trab-sql-1');
      expect(porTrabalhador).toHaveLength(1);

      const cacheLocal = await repo.findAll();
      expect(cacheLocal.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('SqliteDespesaRepository e LocalReceiptStorage (09/out — Imagens locais e endereço no SQLite)', () => {
    it('deve persistir recibo no FileSystem e gravar caminho local no SQLite', async () => {
      const storage = LocalReceiptStorage.getInstance();
      const repo = SqliteDespesaRepository.getInstance();

      const tempUri = 'file:///data/user/0/cache/recibo_temp.jpg';
      const permanentUri = await storage.persistReceiptImage(tempUri);
      expect(permanentUri).toBeDefined();

      const coords = new Coordinates(-21.25, -45.0);
      const despesa = new Despesa(
        'desp-sql-1',
        'Adubo Foliar NPK',
        new ValorMonetario(350.0),
        'Insumos',
        coords,
        AGORA,
        permanentUri
      );

      await repo.save(despesa);

      const buscada = await repo.findById('desp-sql-1');
      expect(buscada).not.toBeNull();
      expect(buscada?.fotoUri).toBe(permanentUri);
      expect(buscada?.valor.valor).toBe(350.0);
      expect(buscada?.categoria).toBe('Insumos');

      const todas = await repo.findAll();
      expect(todas.length).toBeGreaterThanOrEqual(1);

      await repo.delete('desp-sql-1');
      expect(await repo.findById('desp-sql-1')).toBeNull();
    });
  });

  describe('SqliteSyncQueueRepository (02/out — Mapeamento de funcionalidades offline com Outbox)', () => {
    it('deve enfileirar mutações offline e atualizar status de propagação', async () => {
      const repo = SqliteSyncQueueRepository.getInstance();
      const item = new SyncQueueItem(
        'queue-1',
        'Trabalhador',
        'trab-sql-1',
        'INSERT',
        AGORA,
        AGORA,
        0,
        SyncStatus.pending()
      );

      await repo.enqueue(item);

      const pendentes = await repo.findPending();
      expect(pendentes.length).toBeGreaterThanOrEqual(1);
      expect(pendentes.some((p) => p.id === 'queue-1')).toBe(true);

      item.registrarTentativa(AGORA + 1000);
      await repo.save(item);

      const atualizado = await repo.findById('queue-1');
      expect(atualizado?.attempts).toBe(1);

      await repo.remove('queue-1');
      expect(await repo.findById('queue-1')).toBeNull();
    });
  });
});
