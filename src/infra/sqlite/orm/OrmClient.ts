import { DatabaseClient } from '../DatabaseClient';
import { OrmSchema, TableSchema } from './OrmSchema';

export interface FindManyOptions {
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  include?: string[];
}

export interface FindByIdOptions {
  include?: string[];
}

/**
 * Cliente ORM para SQLite local.
 * Implementa Data Mapper e Query Builder com suporte a Entidade-Relacionamento e Include (Eager Loading).
 * Atende ao marco de 'Utilizando ORM com SQLite' e 'Construindo o Entidade Relacionamento'.
 */
export class OrmClient {
  private static instance: OrmClient;
  private readonly db: DatabaseClient;

  private constructor() {
    this.db = DatabaseClient.getInstance();
  }

  public static getInstance(): OrmClient {
    if (!OrmClient.instance) {
      OrmClient.instance = new OrmClient();
    }
    return OrmClient.instance;
  }

  public getSchema(tableName: keyof typeof OrmSchema): TableSchema {
    const schema = OrmSchema[tableName];
    if (!schema) {
      throw new Error(`Tabela '${String(tableName)}' não encontrada no ORM Schema.`);
    }
    return schema;
  }

  public async insert<T extends Record<string, any>>(
    tableName: keyof typeof OrmSchema,
    data: T
  ): Promise<T> {
    const schema = this.getSchema(tableName);
    const keys = Object.keys(data).filter((k) => schema.columns[k] !== undefined);
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');
    const values = keys.map((k) => data[k]);

    const sql = `INSERT INTO ${schema.name} (${columns}) VALUES (${placeholders})`;
    await this.db.run(sql, values);
    return data;
  }

  public async findById<T = any>(
    tableName: keyof typeof OrmSchema,
    id: string,
    options?: FindByIdOptions
  ): Promise<T | null> {
    const schema = this.getSchema(tableName);
    const sql = `SELECT * FROM ${schema.name} WHERE id = ? AND deleted_at IS NULL`;
    const record = await this.db.getFirst<any>(sql, [id]);

    if (!record) {
      return null;
    }

    if (options?.include && schema.relations) {
      await this.loadRelations(schema, [record], options.include);
    }

    return record as T;
  }

  public async findMany<T = any>(
    tableName: keyof typeof OrmSchema,
    options?: FindManyOptions
  ): Promise<T[]> {
    const schema = this.getSchema(tableName);
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Ignora registros deletados por padrão se a tabela tiver soft delete
    if (schema.columns.deleted_at && (!options?.where || options.where.deleted_at === undefined)) {
      whereClauses.push('deleted_at IS NULL');
    }

    if (options?.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (value === null) {
          whereClauses.push(`${key} IS NULL`);
        } else {
          whereClauses.push(`${key} = ?`);
          params.push(value);
        }
      }
    }

    let sql = `SELECT * FROM ${schema.name}`;
    if (whereClauses.length > 0) {
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    if (options?.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options?.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    const records = await this.db.getAll<any>(sql, params);

    if (options?.include && schema.relations && records.length > 0) {
      await this.loadRelations(schema, records, options.include);
    }

    return records as T[];
  }

  public async update(
    tableName: keyof typeof OrmSchema,
    id: string,
    data: Record<string, any>
  ): Promise<boolean> {
    const schema = this.getSchema(tableName);
    const keys = Object.keys(data).filter((k) => k !== 'id' && schema.columns[k] !== undefined);
    if (keys.length === 0) return false;

    const setClauses = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => data[k]);
    values.push(id);

    const sql = `UPDATE ${schema.name} SET ${setClauses} WHERE id = ?`;
    const result = await this.db.run(sql, values);
    return result.changes > 0;
  }

  public async delete(
    tableName: keyof typeof OrmSchema,
    id: string,
    soft: boolean = true
  ): Promise<boolean> {
    const schema = this.getSchema(tableName);
    if (soft && schema.columns.deleted_at) {
      const agora = Date.now();
      const sql = `UPDATE ${schema.name} SET deleted_at = ?, updated_at = ? WHERE id = ?`;
      const result = await this.db.run(sql, [agora, agora, id]);
      return result.changes > 0;
    } else {
      const sql = `DELETE FROM ${schema.name} WHERE id = ?`;
      const result = await this.db.run(sql, [id]);
      return result.changes > 0;
    }
  }

  private async loadRelations(
    schema: TableSchema,
    records: any[],
    includes: string[]
  ): Promise<void> {
    if (!schema.relations) return;

    for (const relName of includes) {
      const relation = schema.relations[relName];
      if (!relation) continue;

      const targetTable = relation.targetTable as keyof typeof OrmSchema;

      if (relation.type === 'hasMany') {
        const allRelated = await this.findMany(targetTable);
        for (const record of records) {
          record[relName] = allRelated.filter((rel: any) => rel[relation.foreignKey] === record.id);
        }
      } else if (relation.type === 'belongsTo') {
        for (const record of records) {
          const foreignId = record[relation.foreignKey];
          if (foreignId) {
            record[relName] = await this.findById(targetTable, foreignId);
          } else {
            record[relName] = null;
          }
        }
      }
    }
  }
}
