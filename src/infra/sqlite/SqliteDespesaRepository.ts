import { Despesa, CategoriaDespesa } from '../../domain/entities/Despesa';
import { DespesaRepository } from '../../domain/repositories/DespesaRepository';
import { Coordinates } from '../../domain/value-objects/Coordinates';
import { ValorMonetario } from '../../domain/value-objects/ValorMonetario';
import { DatabaseClient } from './DatabaseClient';

export class SqliteDespesaRepository implements DespesaRepository {
  private static instance: SqliteDespesaRepository;
  private readonly db: DatabaseClient;

  private constructor() {
    this.db = DatabaseClient.getInstance();
  }

  public static getInstance(): SqliteDespesaRepository {
    if (!SqliteDespesaRepository.instance) {
      SqliteDespesaRepository.instance = new SqliteDespesaRepository();
    }
    return SqliteDespesaRepository.instance;
  }

  async save(despesa: Despesa): Promise<void> {
    const agora = Date.now();
    const existente = await this.findById(despesa.id);
    if (existente) {
      await this.db.run(
        `UPDATE despesas
         SET descricao = ?, valor = ?, categoria = ?, latitude = ?, longitude = ?, data = ?, foto_uri = ?, updated_at = ?
         WHERE id = ?`,
        [
          despesa.descricao,
          despesa.valor.valor,
          despesa.categoria,
          despesa.coordenadas.latitude,
          despesa.coordenadas.longitude,
          despesa.data,
          despesa.fotoUri,
          agora,
          despesa.id,
        ]
      );
    } else {
      await this.db.run(
        `INSERT INTO despesas (id, apontador_id, descricao, valor, categoria, latitude, longitude, data, foto_uri, updated_at, deleted_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'pending')`,
        [
          despesa.id,
          null,
          despesa.descricao,
          despesa.valor.valor,
          despesa.categoria,
          despesa.coordenadas.latitude,
          despesa.coordenadas.longitude,
          despesa.data,
          despesa.fotoUri,
          agora,
        ]
      );
    }
  }

  async findById(id: string): Promise<Despesa | null> {
    const row = await this.db.getFirst(
      'SELECT * FROM despesas WHERE id = ? AND deleted_at IS NULL',
      [id]
    );
    if (!row) return null;
    return this.mapRow(row);
  }

  async findAll(): Promise<Despesa[]> {
    const rows = await this.db.getAll(
      'SELECT * FROM despesas WHERE deleted_at IS NULL ORDER BY data DESC'
    );
    return rows.map((r) => this.mapRow(r));
  }

  async delete(id: string): Promise<void> {
    const agora = Date.now();
    await this.db.run(
      'UPDATE despesas SET deleted_at = ?, updated_at = ? WHERE id = ?',
      [agora, agora, id]
    );
  }

  private mapRow(row: any): Despesa {
    return new Despesa(
      row.id,
      row.descricao,
      new ValorMonetario(Number(row.valor)),
      row.categoria as CategoriaDespesa,
      new Coordinates(Number(row.latitude), Number(row.longitude)),
      Number(row.data),
      row.foto_uri ?? null
    );
  }
}
