export type ColumnType = 'TEXT' | 'REAL' | 'INTEGER';

export interface ColumnDefinition {
  type: ColumnType;
  primaryKey?: boolean;
  notNull?: boolean;
  unique?: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface RelationDefinition {
  type: 'hasMany' | 'belongsTo';
  targetTable: string;
  foreignKey: string;
}

export interface TableSchema {
  name: string;
  columns: Record<string, ColumnDefinition>;
  relations?: Record<string, RelationDefinition>;
}

/**
 * Mapeamento Entidade-Relacionamento (ORM) do SafraCafé para SQLite Local.
 * Atende ao marco de 06/out: 'Construindo o Entidade Relacionamento e armazenando os dados no SQLite'
 * e 'Utilizando ORM com SQLite'.
 */
export const OrmSchema = {
  apontadores: {
    name: 'apontadores',
    columns: {
      id: { type: 'TEXT', primaryKey: true, notNull: true },
      nome: { type: 'TEXT', notNull: true },
      email: { type: 'TEXT', notNull: true, unique: true },
    },
    relations: {
      apontamentos: {
        type: 'hasMany',
        targetTable: 'apontamentos',
        foreignKey: 'apontador_id',
      },
      despesas: {
        type: 'hasMany',
        targetTable: 'despesas',
        foreignKey: 'apontador_id',
      },
    },
  } as TableSchema,

  trabalhadores: {
    name: 'trabalhadores',
    columns: {
      id: { type: 'TEXT', primaryKey: true, notNull: true },
      nome: { type: 'TEXT', notNull: true },
      cpf: { type: 'TEXT', notNull: true },
      cracha: { type: 'TEXT', notNull: true, unique: true },
      diaria: { type: 'REAL', notNull: true },
      updated_at: { type: 'INTEGER', notNull: true },
      deleted_at: { type: 'INTEGER' },
      sync_status: { type: 'TEXT', notNull: true },
    },
    relations: {
      apontamentos: {
        type: 'hasMany',
        targetTable: 'apontamentos',
        foreignKey: 'trabalhador_id',
      },
    },
  } as TableSchema,

  apontamentos: {
    name: 'apontamentos',
    columns: {
      id: { type: 'TEXT', primaryKey: true, notNull: true },
      apontador_id: {
        type: 'TEXT',
        references: { table: 'apontadores', column: 'id' },
      },
      trabalhador_id: {
        type: 'TEXT',
        notNull: true,
        references: { table: 'trabalhadores', column: 'id' },
      },
      litros: { type: 'REAL', notNull: true },
      latitude: { type: 'REAL', notNull: true },
      longitude: { type: 'REAL', notNull: true },
      data: { type: 'INTEGER', notNull: true },
      updated_at: { type: 'INTEGER', notNull: true },
      deleted_at: { type: 'INTEGER' },
      sync_status: { type: 'TEXT', notNull: true },
    },
    relations: {
      trabalhador: {
        type: 'belongsTo',
        targetTable: 'trabalhadores',
        foreignKey: 'trabalhador_id',
      },
      apontador: {
        type: 'belongsTo',
        targetTable: 'apontadores',
        foreignKey: 'apontador_id',
      },
    },
  } as TableSchema,

  despesas: {
    name: 'despesas',
    columns: {
      id: { type: 'TEXT', primaryKey: true, notNull: true },
      apontador_id: {
        type: 'TEXT',
        references: { table: 'apontadores', column: 'id' },
      },
      descricao: { type: 'TEXT', notNull: true },
      valor: { type: 'REAL', notNull: true },
      categoria: { type: 'TEXT', notNull: true },
      latitude: { type: 'REAL', notNull: true },
      longitude: { type: 'REAL', notNull: true },
      data: { type: 'INTEGER', notNull: true },
      foto_uri: { type: 'TEXT' },
      updated_at: { type: 'INTEGER', notNull: true },
      deleted_at: { type: 'INTEGER' },
      sync_status: { type: 'TEXT', notNull: true },
    },
    relations: {
      apontador: {
        type: 'belongsTo',
        targetTable: 'apontadores',
        foreignKey: 'apontador_id',
      },
    },
  } as TableSchema,

  sync_queue: {
    name: 'sync_queue',
    columns: {
      id: { type: 'TEXT', primaryKey: true, notNull: true },
      entidade: { type: 'TEXT', notNull: true },
      entidade_id: { type: 'TEXT', notNull: true },
      operacao: { type: 'TEXT', notNull: true },
      payload: { type: 'TEXT' },
      created_at: { type: 'INTEGER', notNull: true },
      updated_at: { type: 'INTEGER', notNull: true },
      tentativas: { type: 'INTEGER', notNull: true },
      status: { type: 'TEXT', notNull: true },
    },
  } as TableSchema,
};
