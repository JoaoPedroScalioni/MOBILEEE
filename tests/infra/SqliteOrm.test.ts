import { DatabaseClient } from '../../src/infra/sqlite/DatabaseClient';
import { OrmClient } from '../../src/infra/sqlite/orm/OrmClient';
import { OrmSchema } from '../../src/infra/sqlite/orm/OrmSchema';

describe('ORM com SQLite e Mapeamento Entidade-Relacionamento (06/out)', () => {
  let orm: OrmClient;
  let db: DatabaseClient;

  beforeAll(async () => {
    db = DatabaseClient.getInstance();
    await db.init();
    orm = OrmClient.getInstance();
  });

  beforeEach(async () => {
    await db.clearAll();
  });

  it('deve validar o schema relacional declarativo das tabelas e chaves estrangeiras', () => {
    expect(OrmSchema.trabalhadores.name).toBe('trabalhadores');
    expect(OrmSchema.apontamentos.name).toBe('apontamentos');
    expect(OrmSchema.despesas.name).toBe('despesas');

    // Chaves estrangeiras e relacionamentos
    expect(OrmSchema.apontamentos.relations?.trabalhador).toEqual({
      type: 'belongsTo',
      targetTable: 'trabalhadores',
      foreignKey: 'trabalhador_id',
    });
    expect(OrmSchema.trabalhadores.relations?.apontamentos).toEqual({
      type: 'hasMany',
      targetTable: 'apontamentos',
      foreignKey: 'trabalhador_id',
    });
  });

  it('deve realizar operações de CRUD via ORM no SQLite', async () => {
    const agora = Date.now();

    // Insert
    await orm.insert('trabalhadores', {
      id: 'trab-orm-1',
      nome: 'Carlos Eduardo',
      cpf: '12345678901',
      cracha: 'CRACHA-ORM-1',
      diaria: 70.0,
      updated_at: agora,
      deleted_at: null,
      sync_status: 'pending',
    });

    // FindById
    const trab = await orm.findById('trabalhadores', 'trab-orm-1');
    expect(trab).not.toBeNull();
    expect(trab.nome).toBe('Carlos Eduardo');
    expect(trab.cracha).toBe('CRACHA-ORM-1');

    // Update
    await orm.update('trabalhadores', 'trab-orm-1', {
      diaria: 75.0,
      updated_at: agora + 1000,
    });
    const trabAtualizado = await orm.findById('trabalhadores', 'trab-orm-1');
    expect(trabAtualizado.diaria).toBe(75.0);

    // Soft Delete
    await orm.delete('trabalhadores', 'trab-orm-1', true);
    const trabDeletado = await orm.findById('trabalhadores', 'trab-orm-1');
    expect(trabDeletado).toBeNull();
  });

  it('deve carregar relacionamentos 1:N (hasMany / belongsTo) via Eager Loading (include)', async () => {
    const agora = Date.now();

    // Cria trabalhador
    await orm.insert('trabalhadores', {
      id: 'trab-rel-1',
      nome: 'Ana Paula',
      cpf: '98765432100',
      cracha: 'CRACHA-ANA',
      diaria: 80.0,
      updated_at: agora,
      deleted_at: null,
      sync_status: 'synced',
    });

    // Cria 2 apontamentos associados via chave estrangeira
    await orm.insert('apontamentos', {
      id: 'ap-rel-1',
      apontador_id: 'usr-1',
      trabalhador_id: 'trab-rel-1',
      litros: 40.0,
      latitude: -21.25,
      longitude: -44.99,
      data: agora,
      updated_at: agora,
      deleted_at: null,
      sync_status: 'pending',
    });

    await orm.insert('apontamentos', {
      id: 'ap-rel-2',
      apontador_id: 'usr-1',
      trabalhador_id: 'trab-rel-1',
      litros: 60.0,
      latitude: -21.26,
      longitude: -45.00,
      data: agora + 10,
      updated_at: agora + 10,
      deleted_at: null,
      sync_status: 'pending',
    });

    // Busca trabalhador com seus apontamentos incluídos via ORM
    const trabComApontamentos = await orm.findById('trabalhadores', 'trab-rel-1', {
      include: ['apontamentos'],
    });

    expect(trabComApontamentos).not.toBeNull();
    expect(trabComApontamentos.apontamentos).toBeDefined();
    expect(trabComApontamentos.apontamentos).toHaveLength(2);
    expect(trabComApontamentos.apontamentos[0].litros).toBe(40.0);
    expect(trabComApontamentos.apontamentos[1].litros).toBe(60.0);

    // Busca apontamento com trabalhador incluído via belongsTo
    const apontamentoComTrabalhador = await orm.findById('apontamentos', 'ap-rel-1', {
      include: ['trabalhador'],
    });
    expect(apontamentoComTrabalhador.trabalhador).toBeDefined();
    expect(apontamentoComTrabalhador.trabalhador.nome).toBe('Ana Paula');
  });
});
